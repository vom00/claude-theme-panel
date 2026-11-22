import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Agent, Hud, Look } from '../types'
import { EMPTY, groupCategories, HIDE_CHIP, normalize, renderHud, renderStrip, STRIP_H, STRIP_W } from './core'
import { cardOf, paletteOf } from './palette'
import { MINI_H, MINI_W, PANEL_H, PANEL_W, renderMini, renderPanel } from './panel'
import { PORTRAIT, PORTRAIT_H, PORTRAIT_W } from './portrait'

const NAME = 'CLAUDE'
/** Width the HUD draws at in the desktop band, CSS pixels (the chat column is about 770). */
const HUD_W = 760
/** Changes arriving within this window are drawn together, as one redraw. */
const BATCH_MS = 1500
/** The side panel's pane id and tab title. */
const PANE = 'cyberpunk'
const PANE_TITLE = 'Cyberpunk'
/** About how wide one cell of the desktop pane's code font is, CSS pixels. */
const CELL_PX = 7.6
/** A blank that is not whitespace (U+2800): a label of them draws nothing and is kept. */
const BLANK = '⠀'

/** Live numbers, written on every event. The drawing never reads this one. */
const hud = atom({ plugin: 'cyberpunk-hud', key: 'hud' } as const, EMPTY)
/** What the drawing reads: a snapshot of `hud`, published only when something visible changed. */
const view = atom({ plugin: 'cyberpunk-hud', key: 'view' } as const, { data: EMPTY, now: 0 })
const isHidden = atom({ plugin: 'cyberpunk-hud', key: 'isHidden' } as const, false)
/** The theme the app is on, which colours the band and the panel. */
const isWorking = atom({ plugin: 'cyberpunk-hud', key: 'isWorking' } as const, false)
const look = atom({ plugin: 'cyberpunk-hud', key: 'look' } as const, null as Look)

const LOOK_KEY = 'look'
const PANEL_OFF_KEY = 'panelOff'
const MIN_KEY = 'minimized'

const sameLook = (a: Look, b: Look) =>
  (a?.scene ?? '') === (b?.scene ?? '') && (a?.tint ?? '').toLowerCase() === (b?.tint ?? '').toLowerCase() && (a?.plugin ?? '') === (b?.plugin ?? '')

/** Records the theme the app is on, kept for the next session too; redraws only on a change. */
async function setLook($: EngineInterface, next: Look) {
  if (sameLook(await read($, look), next)) return
  await update($, look, () => next)
  await (next === null ? $.store.delete(LOOK_KEY) : $.store.set(LOOK_KEY, next)).catch(() => undefined)
}

async function openPanel($: EngineInterface) {
  return $.ui.open({ id: PANE, title: PANE_TITLE })
}

/** Minimizes the HUD to its badge, or brings it back; kept for new sessions too. */
async function setMinimized($: EngineInterface, isMin: boolean) {
  await update($, isHidden, () => isMin)
  await (isMin ? $.store.set(MIN_KEY, true) : $.store.delete(MIN_KEY)).catch(() => undefined)
}


const limitOf = (r: { kind: string; percentUsed: number; resetsAt?: string }) => {
  const at = r.resetsAt ? Date.parse(r.resetsAt) : NaN
  return { kind: r.kind, pct: r.percentUsed, resetsAt: Number.isFinite(at) ? at : null }
}

const firstLine = (s: string) =>
  s
    .replace(/[`*_#>]/g, '')
    .split('\n')
    .map(l => l.trim())
    .find(l => l.length > 0) ?? ''

// Every redraw rebuilds the panel's frame, so redraws are batched and skipped when nothing shown changed.
let isPending = false
let lastSig = ''

async function flush($: EngineInterface) {
  const data = normalize(await read($, hud))
  const t = await $.clock.now()
  // curTools is not drawn; the clock shows minutes
  const sig = `${JSON.stringify({ ...data, curTools: 0 })}|${Math.floor(t / 60_000)}`
  if (sig === lastSig) return
  lastSig = sig
  await update($, view, () => ({ data, now: t }))
}

function schedule($: EngineInterface) {
  if (isPending) return
  isPending = true
  $.clock.after(BATCH_MS, async () => {
    isPending = false
    await flush($)
  })
}

/** Changes the live numbers and queues one batched redraw. */
async function put($: EngineInterface, fn: (h: Hud) => Hud) {
  await update($, hud, x => fn(normalize(x)))
  schedule($)
}

/** Reads the /context breakdown (estimated locally, no request) into the legend groups. */
async function readBreakdown($: EngineInterface) {
  const u = await $.session.usage({ breakdown: 'summary' }).catch(() => null)
  const b = u?.context.breakdown
  if (!u || !b) return
  await put($, s => ({
    ...s,
    cats: groupCategories(b.categories, b.rawMaxTokens),
    ctxPct: u.context.percent ?? s.ctxPct,
    ctxTokens: u.context.tokens ?? s.ctxTokens,
    ctxWindow: u.context.window || s.ctxWindow,
    limits: u.rateLimits.length ? u.rateLimits.map(limitOf) : s.limits,
  }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'hud',
      description: 'Cyberpunk HUD above the prompt: show or hide it',
      argumentHint: '[on|off]',
    })
    await $.command.register({
      name: 'hud-panel',
      description: 'Cyberpunk side panel on the right: show or hide it',
      argumentHint: '[on|off]',
    })
    // the theme seen last time, until this session's theme is set
    if ((await read($, look)) === null) {
      const kept = (await $.store.get(LOOK_KEY).catch(() => undefined)) as Look | undefined
      if (kept && typeof kept === 'object') await update($, look, () => kept)
    }
    if ((await $.store.get(PANEL_OFF_KEY).catch(() => undefined)) !== true) void openPanel($).catch(() => undefined)
    if ((await $.store.get(MIN_KEY).catch(() => undefined)) === true) await update($, isHidden, () => true)
    const [u, t] = await Promise.all([$.session.usage().catch(() => null), $.clock.now()])
    await update($, hud, x => {
      const s = normalize(x)
      return {
        ...s,
        startedAt: u?.startedAt ?? (s.startedAt || t),
        ctxPct: u?.context.percent ?? s.ctxPct,
        ctxTokens: u?.context.tokens ?? s.ctxTokens,
        ctxWindow: u?.context.window || s.ctxWindow,
        limits: u?.rateLimits.length ? u.rateLimits.map(limitOf) : s.limits,
        costUsd: u?.cost?.usd ?? s.costUsd,
      }
    })
    lastSig = ''
    await flush($)
    // the footer clock and uptime show minutes: one check a minute, a redraw only when the minute moved
    $.clock.every(60_000, () => flush($))
    const done = await next(e)
    void readBreakdown($)
    return done
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      const t = await $.clock.now()
      await put($, () => ({ ...EMPTY, startedAt: t }))
    }
    return next(e)
  })

  on('command.run', { command: 'hud' }, async ($, e) => {
    const verb = e.args.trim().toLowerCase()
    const hide = verb === 'off' ? true : verb === 'on' ? false : !(await read($, isHidden))
    await setMinimized($, hide)
    return { text: hide ? 'Cyberpunk HUD minimized. Press ▴ or /hud on to bring it back.' : 'Cyberpunk HUD on.' }
  })

  on('command.run', { command: 'hud-panel' }, async ($, e) => {
    const verb = e.args.trim().toLowerCase()
    const isOpen = (await $.ui.panes()).some(p => p.id === PANE)
    const show = verb === 'on' ? true : verb === 'off' ? false : !isOpen
    if (!show) {
      await $.store.set(PANEL_OFF_KEY, true).catch(() => undefined)
      if (isOpen) await $.ui.close({ id: PANE })
      return { text: 'Cyberpunk panel closed, in new sessions too. /hud-panel on brings it back.' }
    }
    await $.store.delete(PANEL_OFF_KEY).catch(() => undefined)
    const r = await openPanel($)
    return { text: r.isPlaced ? 'Cyberpunk panel open on the right.' : `Cyberpunk panel is open but not shown here: ${r.reason}` }
  })

  // Closing the panel by hand keeps it closed in new sessions, until /hud-panel on.
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') await $.store.set(PANEL_OFF_KEY, true).catch(() => undefined)
    return next(e)
  })

  // The theme: every theme sets itself with $.theme.set, and this hears each call, whoever
  // makes it. The scene names the theme and the glass tint its moment of the day.
  on('theme.set', async ($, e, next) => {
    const result = await next(e)
    const bd = e.backdrop
    const scene = bd && 'scene' in bd && typeof bd.scene === 'string' ? bd.scene : undefined
    const glass = bd && 'scene' in bd ? bd.glass : undefined
    await setLook($, {
      scene,
      plugin: next.origin.plugin,
      tint: glass ? glass.tint : undefined,
      dark: e.overrideColorScheme === undefined ? undefined : e.overrideColorScheme === 'dark',
    }).catch(() => undefined)
    return result
  })

  on('theme.clear', async ($, e, next) => {
    const result = await next(e)
    await setLook($, null).catch(() => undefined)
    return result
  })

  // A second ear for the theme: the backdrop as the app asks for it, in case a theme was set
  // before this mod loaded. It draws nothing itself.
  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    const glass = e.props.glass
    void setLook($, {
      scene: e.props.scene,
      plugin: e.props.plugin,
      tint: glass ? glass.tint : undefined,
      dark: e.props.overrideColorScheme === undefined ? undefined : e.props.overrideColorScheme === 'dark',
    }).catch(() => undefined)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const snap = await read($, view)
    const current = await read($, look)
    const opts = {
      now: snap.now || Date.now(),
      phaseNow: Date.now(),
      isWorking: await read($, isWorking),
      portrait: PORTRAIT,
      portraitW: PORTRAIT_W,
      portraitH: PORTRAIT_H,
      palette: paletteOf(current),
      card: cardOf(current),
    }
    const data = normalize(snap.data)
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      const { Text } = $.ui.resolve(e)
      const c = opts.card
      return <Text>{`${c.name} · ${c.moment}  context ${data.ctxPct === null ? '--' : Math.round(data.ctxPct)}%`}</Text>
    }
    const { Svg } = $.ui.resolve(e)
    const cols = e.props.bodyColumns || e.viewport?.columns || 48
    const wPx = Math.round(Math.max(240, Math.min(620, cols * CELL_PX)))
    if (e.props.placement !== 'dock') {
      return <Svg source={renderMini(data, opts)} alt={`Cyberpunk: ${opts.card.name} theme, context and 5-hour limit`} width={wPx} height={Math.round((wPx * MINI_H) / MINI_W)} isInteractive />
    }
    return (
      <Svg
        source={renderPanel(data, opts)}
        alt={`Cyberpunk panel: ${opts.card.name} theme (${opts.card.moment}), context, plan limits, agents and session stats`}
        width={wPx}
        height={Math.round((wPx * PANEL_H) / PANEL_W)}
        isInteractive
      />
    )
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, hud, x => ({ ...normalize(x), curTools: 0 }))
    await update($, isWorking, () => true)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const sub = e.agentId
    if (!sub) await put($, s => ({ ...s, curTools: s.curTools + 1, toolCalls: s.toolCalls + 1 }))
    else await put($, s => ({ ...s, agents: s.agents.map(a => (a.id === sub ? { ...a, tools: a.tools + 1 } : a)) }))
    const r = await next(e)
    if (!sub && ('deny' in r && r.deny !== undefined ? true : r.isError === true)) {
      await put($, s => ({ ...s, failed: s.failed + 1 }))
    }
    return r
  })

  on('session.measure', async ($, e, next) => {
    await put($, s => ({
      ...s,
      ctxPct: e.context.percent ?? s.ctxPct,
      ctxTokens: e.context.tokens ?? s.ctxTokens,
      ctxWindow: e.context.window || s.ctxWindow,
      limits: e.rateLimits.length ? e.rateLimits.map(limitOf) : s.limits,
      costUsd: e.cost?.usd ?? s.costUsd,
    }))
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny !== undefined || !started.agentId) return started
    const id = started.agentId
    const t = await $.clock.now()
    const agent: Agent = {
      id,
      type: (e.subagentType.split(':').pop() ?? 'agent').toUpperCase(),
      description: e.description,
      model: started.model,
      status: 'running',
      startedAt: t,
      endedAt: null,
      tools: 0,
    }
    await put($, s => {
      const known = s.agents.find(a => a.id === id)
      const agents = known
        ? s.agents.map(a => (a.id === id ? { ...a, model: started.model, status: 'running' as const, endedAt: null } : a))
        : [...s.agents, agent]
      return { ...s, agents: agents.slice(-12), spawned: known ? s.spawned : s.spawned + 1 }
    })
    return started
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const sub = e.agentId
    const t = await $.clock.now()
    if (sub) {
      const status = e.reason === 'answer' ? ('done' as const) : ('failed' as const)
      await put($, s => ({ ...s, agents: s.agents.map(a => (a.id === sub ? { ...a, status, endedAt: t } : a)) }))
      return done
    }
    await update($, isWorking, () => false)
    await put($, s => ({
      ...s,
      turns: s.turns + 1,
      lastTurnMs: e.durationMs,
      toolsPerTurn: [...s.toolsPerTurn, s.curTools].slice(-10),
      ctxHistory: s.ctxPct === null ? s.ctxHistory : [...s.ctxHistory, s.ctxPct].slice(-4),
      lastAnswer: firstLine(e.answer) || s.lastAnswer,
    }))
    void readBreakdown($)
    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || e.props.hasSurvey || e.props.isCollapsed) return next(e)
    // (never name a local `h`: JSX compiles to the global h())
    const { Box, Button, Svg } = $.ui.resolve(e)
    const palette = paletteOf(await read($, look))
    // A see-through button laid over part of a picture: a blank label wide enough to fill the
    // box, cut to its edge, so a press anywhere on that part lands on it.
    const hit = (key: string, w: number, onPress: () => void) => (
      <Box key={`${key}-hit`} position="absolute" top={0} left={0} right={0} bottom={0} flexDirection="row" alignItems="stretch" overflow="hidden">
        <Button key={key} plain label={BLANK.repeat(Math.ceil(w / 4) + 20)} onPress={onPress} />
      </Box>
    )
    const snap = await read($, view)
    if (await read($, isHidden)) {
      // Minimized: one slim strip in the HUD's style, its readings and a SHOW chip; a press
      // anywhere on it brings the HUD back.
      const sh = Math.round((HUD_W * STRIP_H) / STRIP_W)
      return (
        <Box flexDirection="column">
          <Svg source={renderStrip(normalize(snap.data), { palette })} alt="Cyberpunk HUD, minimized" width={HUD_W} height={sh} />
          {hit('hud-restore', HUD_W, () => void setMinimized($, false))}
        </Box>
      )
    }
    const source = renderHud(normalize(snap.data), {
      now: snap.now || Date.now(),
      // animations resume where they were instead of restarting on a redraw
      phaseNow: Date.now(),
      isWorking: e.props.isWorking,
      portrait: PORTRAIT,
      portraitW: PORTRAIT_W,
      portraitH: PORTRAIT_H,
      name: NAME,
      palette,
      hideChip: true,
    })
    // an interactive Svg draws in a frame: without a size it falls back to 300x150. The HIDE chip
    // is drawn in its top-right corner; a see-through button over that corner minimizes it.
    const scale = HUD_W / 1080
    const hh = Math.round(236 * scale)
    const chipW = Math.ceil((1080 - HIDE_CHIP.x + 4) * scale)
    const chipH = Math.ceil((HIDE_CHIP.y + HIDE_CHIP.h + 4) * scale)
    return (
      <Box flexDirection="column">
        <Svg source={source} alt="Cyberpunk HUD: context, plan limits, cost and active agents" width={HUD_W} height={hh} isInteractive />
        <Box key="corner" position="absolute" top={0} right={0} width={`${Math.ceil((100 * chipW) / HUD_W)}%`} height={`${Math.ceil((100 * chipH) / hh)}%`} flexDirection="row" alignItems="stretch" overflow="hidden">
          <Button key="hud-minimize" plain label={BLANK.repeat(Math.ceil(chipW / 4) + 20)} onPress={() => void setMinimized($, true)} />
        </Box>
      </Box>
    )
  })
}
