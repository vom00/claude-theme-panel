// Theme panel: a column of theme cards docked on the right of the chat, each a picture of the
// theme's scene with its name under it. Pressing a name puts that theme on at once; the choice
// is kept for new sessions. The panel carries every theme itself (fifteen BackdropKit themes as
// they ship, and Rainy Window), so one mod sets and draws whichever is on.
//
// The Cyberpunk HUD hears each $.theme.set and colours itself from the scene's name, so the
// HUD changes with the theme.
//
// The little straw hat button (👒) in the desktop prompt footer opens or closes the panel without sending
// anything to the session. /theme-panel opens or closes the panel too; /theme-panel <name> switches to a theme by name.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage, SessionRateLimit, ThemeSetArgs, TurnUsage } from 'claude-code'

import { CATALOG, DEFAULT_SLUG, entryOf, findEntry } from './catalog'
import type { Entry } from './catalog'
import { fillBoard, textsOf } from './kit/board.js'
import type { Figures } from './kit/board.js'
import { BLUR, COLORS, NIGHT_COLORS } from './kit/colors.js'
import { makeColors } from './kit/make-colors.js'
import type { Moment, Theme } from './kit/types'
import { RAINY_LOOK } from './rainy/look'
import { isSlot, kitMoment, nightMoment, SLOT_ICON, SLOT_NAME, SLOTS } from './slots'
import type { Slot } from './slots'
import { THUMB_H, THUMB_W, THUMBS } from './thumbs'

const PLUGIN = 'theme-panel'
const PANE = 'theme-panel'
const PANE_TITLE = 'Themes'
/** About how wide a cell of the desktop pane is, CSS pixels. */
const CELL_PX = 7.6
/** A blank that is not whitespace (U+2800), so a label of them is kept and draws nothing. */
const BLANK = '⠀'

const CURRENT_KEY = 'current'
const PANEL_OFF_KEY = 'panelOff'
const BLUR_OFF_KEY = 'blurOff'

/** The theme on now, by slug ('' before the first is set). */
const current = atom({ plugin: 'theme-panel', key: 'current' } as const, '')
/** Which page of cards the panel shows. */
const page = atom({ plugin: 'theme-panel', key: 'page' } as const, 0)
/** Whether the frosted blur behind the app's panels and messages is on. */
const blurOn = atom({ plugin: 'theme-panel', key: 'blurOn' } as const, true)
// The same, for the places that set a look outside a drawing.
let isBlurOn = true
const TIMES_KEY = 'times'
/** The time of day picked on each theme's card, by slug; a theme not in it shows its night. */
const times = atom({ plugin: 'theme-panel', key: 'times' } as const, {} as Record<string, string>)
// The same, for the places that set a look outside a drawing.
let timesNow: Record<string, string> = {}

/** The time of day `entry` shows: the one picked on its card, else night (where it has times). */
export function slotOf(entry: Entry, picked: Record<string, string> = timesNow): Slot | undefined {
  const offered = entry.slots ?? []
  const p = picked[entry.slug]
  if (isSlot(p) && offered.includes(p)) return p
  return offered.includes('night') ? 'night' : offered[0]
}

// The cards go four to a page. The desktop app draws nothing of a pane whose drawing runs too
// large: all nine pictures at once (342 KB) drew nothing, four (129 KB) drew. thumbs.ts keeps
// the pictures small enough that any page stays under PAGE_BUDGET characters of picture; the
// tests hold every page to it.
export const PER_PAGE = 4
export const PAGE_BUDGET = 125_000
export const PAGES: readonly (readonly Entry[])[] = Array.from({ length: Math.ceil(CATALOG.length / PER_PAGE) }, (_, i) =>
  CATALOG.slice(i * PER_PAGE, i * PER_PAGE + PER_PAGE),
)
export const pictureSize = (c: Entry) => (THUMBS[c.slug] ?? c.thumb ?? '').length

const LIGHT = makeColors(COLORS)
const DARK = makeColors(NIGHT_COLORS)

// The time: read from the engine's clock now and then and carried on in between, so drawing
// never waits.
let clockAt = Date.now()
let perfAt = performance.now()
const now = () => clockAt + (performance.now() - perfAt)

// The theme last set and, for a BackdropKit theme, its moment, read while drawing.
let onSlug = ''
let shown: Moment | undefined
// For a theme that follows the clock by itself (Sunfield): the scheme and glass last worked out.
let clockLookKey = ''

/**
 * The night of `theme`, whatever the hour (the one named night, else its last dark one, else its
 * last). `ms` is kept so the clock-following version is one change away.
 */
export function momentAt(theme: Theme, _ms: number): Moment {
  return nightMoment(theme)
}

/** The moment of a BackdropKit theme shown: the time picked on its card, else its night. */
function momentOf(entry: Entry & { kit: Theme }): Moment {
  const slot = slotOf(entry)
  return (slot && kitMoment(entry.kit, slot)) ?? momentAt(entry.kit, now())
}

/** The whole look for a theme now: its colours, its scene and the glass over it. */
function lookOf(entry: Entry): ThemeSetArgs {
  if (!entry.kit) {
    shown = undefined
    if (entry.lookFor) return entry.lookFor(slotOf(entry) ?? 'night')
    if (!entry.lookAt) return entry.look ?? RAINY_LOOK
    const look = entry.lookAt(now(), slotOf(entry))
    clockLookKey = JSON.stringify([look.overrideColorScheme, look.backdrop])
    return look
  }
  const m = momentOf({ ...entry, kit: entry.kit })
  shown = m
  return {
    colors: (m.dark ? DARK : LIGHT).theme,
    overrideColorScheme: m.dark ? 'dark' : 'light',
    backdrop: { scene: entry.slug, glass: { blur: BLUR, tint: m.tint, opacity: m.opacity } },
  }
}

/** A look with its glass unblurred when the blur is off (its tint and opacity kept). */
export function withBlur(look: ThemeSetArgs, isOn: boolean): ThemeSetArgs {
  const glass = look.backdrop?.glass
  if (isOn || !look.backdrop || !glass) return look
  return { ...look, backdrop: { ...look.backdrop, glass: { ...glass, blur: 0 } } }
}
const setLook = ($: EngineInterface, look: ThemeSetArgs) => $.theme.set(withBlur(look, isBlurOn))

/** The blur switch: on or off, now and in new sessions, with the theme on set again. */
async function setBlur($: EngineInterface, isOn: boolean) {
  isBlurOn = isOn
  await update($, blurOn, () => isOn)
  await (isOn ? $.store.delete(BLUR_OFF_KEY) : $.store.set(BLUR_OFF_KEY, true)).catch(() => undefined)
  const entry = entryOf(onSlug)
  if (entry) await setLook($, lookOf(entry))
}

/** Puts a theme on and records it as the one on. */
async function apply($: EngineInterface, slug: string) {
  const entry = entryOf(slug) ?? entryOf(DEFAULT_SLUG) ?? CATALOG[0]!
  onSlug = entry.slug
  await update($, current, () => entry.slug)
  return setLook($, lookOf(entry))
}

/** A press on a card's day, sunset or night button: that theme at that time, now and in new sessions. */
async function pickTime($: EngineInterface, slug: string, slot: Slot) {
  const entry = entryOf(slug)
  if (!entry?.slots?.includes(slot)) return
  timesNow = { ...timesNow, [slug]: slot }
  await update($, times, () => timesNow)
  await $.store.set(TIMES_KEY, timesNow).catch(() => undefined)
  await $.store.set(CURRENT_KEY, slug).catch(() => undefined)
  await apply($, slug)
  $.ui.invalidate('ui.render')
}

/** A press on a card: that theme, now and in new sessions. */
async function pick($: EngineInterface, slug: string) {
  if (slug === onSlug) return
  await $.store.set(CURRENT_KEY, slug).catch(() => undefined)
  await apply($, slug)
}

async function openPanel($: EngineInterface) {
  return $.ui.open({ id: PANE, title: PANE_TITLE })
}

/** The footer button: opens the panel, or closes it when it is open. No command, no prompt. */
async function togglePanel($: EngineInterface) {
  if ((await $.ui.panes()).some(p => p.id === PANE)) {
    await $.store.set(PANEL_OFF_KEY, true).catch(() => undefined)
    await $.ui.close({ id: PANE })
    return
  }
  await $.store.delete(PANEL_OFF_KEY).catch(() => undefined)
  await openPanel($)
}

/** The footer button's icon: a straw hat with a red band. */
export const BUTTON_ICON = '\u{1F452}'

// A scene's motion counts from its --m: the seconds since a fixed moment are written in, so a
// redrawn scene carries on where it was instead of starting over.
const MOTION_MARK = '--m:0s'
const MOTION_EPOCH = Date.UTC(2026, 0, 1)
const SCENE_LIMIT = 131072

function sceneAt(svg: string, ms: number, lead = 0.2): string {
  const at = svg.indexOf(MOTION_MARK)
  if (at < 0) return svg
  const m = Math.max(0, Math.round(((ms - MOTION_EPOCH) / 1000 + lead) * 20) / 20)
  const out = svg.slice(0, at) + '--m:' + (m === 0 ? '0' : '-' + m) + 's' + svg.slice(at + MOTION_MARK.length)
  return out.length <= SCENE_LIMIT ? out : svg
}

// The price board (Gas Station): the tokens this chat has used, how full the context is and
// how much of the weekly limit is used, drawn into its scene.
const TOKENS_KEY = 'tokens:'
const WEEKLY_KEY = 'weekly'
const KEEP_CHATS = 60
let figures: Figures = {}
let tokensKey: string | undefined

function setFigures(next: Figures): boolean {
  const before = JSON.stringify(textsOf(figures))
  figures = next
  return JSON.stringify(textsOf(next)) !== before
}

type Reading = { context: SessionContextUsage; rateLimits: readonly SessionRateLimit[] }
const weekOf = (r: Reading) => r.rateLimits.find(l => l.kind === 'seven_day')
const withReading = (r: Reading): Figures => ({
  ...figures,
  context: r.context.percent ?? figures.context,
  weekly: weekOf(r)?.percentUsed ?? figures.weekly,
})
const tokensOf = (u: TurnUsage) => u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens

/** Whether the theme on has a price board, so new figures should redraw it. */
const boardIsOn = () => entryOf(onSlug)?.kit?.board !== undefined

function sceneOf(theme: Theme, m: Moment): string {
  if (theme.board === undefined) return m.svg
  const filled = fillBoard(m.svg, theme.board, m.id, figures)
  return filled.length <= SCENE_LIMIT ? filled : m.svg
}

function altOf(theme: Theme, m: Moment): string {
  if (theme.board === undefined) return m.alt
  const t = textsOf(figures)
  return m.alt + ' The price board reads ' + t.tokens + ' tokens, ' + t.context + ' context, ' + t.weekly + ' of the weekly limit.'
}

// How often the moment is checked against the clock.
const RESYNC_MS = 5 * 60 * 1000

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A card's picture: the scene, rounded, with a ring and an ON tag on the theme that is on. */
export function cardSvg(entry: Entry, isOn: boolean): string {
  const body = THUMBS[entry.slug] ?? entry.thumb ?? `<rect width='${THUMB_W}' height='${THUMB_H}' fill='#2a2f45'/>`
  const ring = isOn
    ? `<rect x='1' y='1' width='${THUMB_W - 2}' height='${THUMB_H - 2}' rx='7' fill='none' stroke='#ffffff' stroke-width='2' shape-rendering='geometricPrecision'/>` +
      `<rect x='6' y='6' width='22' height='11' rx='5.5' fill='#ffffff' fill-opacity='0.92' shape-rendering='geometricPrecision'/>` +
      `<text x='17' y='14.2' font-family='Segoe UI,Inter,system-ui,sans-serif' font-size='7' font-weight='700' fill='#141726' text-anchor='middle'>ON</text>`
    : ''
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${THUMB_W} ${THUMB_H}' width='100%' height='100%' preserveAspectRatio='xMidYMid slice'>` +
    `<title>${esc(entry.name)}</title>` +
    `<defs><clipPath id='r'><rect width='${THUMB_W}' height='${THUMB_H}' rx='8'/></clipPath></defs>` +
    `<g clip-path='url(#r)' shape-rendering='crispEdges'>${body}</g>${ring}</svg>`
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'theme-panel',
      description: 'Theme panel on the right: open or close it, or switch to a theme by name',
      argumentHint: '[on|off|blur on|blur off|<theme name> [day|sunset|night]]',
    })
    try {
      clockAt = await $.clock.now()
      perfAt = performance.now()
    } catch {
      // Keep the time read when the module loaded.
    }
    try {
      tokensKey = TOKENS_KEY + (await $.session.id())
      const n = await $.store.get(tokensKey)
      figures = { ...figures, tokens: typeof n === 'number' && Number.isFinite(n) ? n : 0 }
      const counts = (await $.store.keys()).filter(k => k.startsWith(TOKENS_KEY) && k !== tokensKey)
      for (const k of counts.slice(0, Math.max(0, counts.length - KEEP_CHATS + 1))) await $.store.delete(k)
    } catch {
      // No count to carry on from: the board shows dashes until the first turn ends.
    }
    try {
      const w = (await $.store.get(WEEKLY_KEY)) as { percent?: unknown; resetsAt?: unknown } | undefined
      const resets = typeof w?.resetsAt === 'string' ? Date.parse(w.resetsAt) : NaN
      if (typeof w?.percent === 'number' && !(resets <= clockAt)) figures = { ...figures, weekly: w.percent }
    } catch {
      // None kept.
    }
    try {
      figures = withReading(await $.session.usage())
    } catch {
      // No reading yet.
    }
    isBlurOn = (await $.store.get(BLUR_OFF_KEY).catch(() => undefined)) !== true
    await update($, blurOn, () => isBlurOn)
    const keptTimes = await $.store.get(TIMES_KEY).catch(() => undefined)
    timesNow = keptTimes && typeof keptTimes === 'object' ? { ...(keptTimes as Record<string, string>) } : {}
    await update($, times, () => timesNow)
    const kept = await $.store.get(CURRENT_KEY).catch(() => undefined)
    await apply($, typeof kept === 'string' ? kept : DEFAULT_SLUG)
    $.clock.every(RESYNC_MS, () => {
      $.clock
        .now()
        .then(ms => {
          clockAt = ms
          perfAt = performance.now()
        })
        .catch(() => undefined)
        .then(() => {
          const entry = entryOf(onSlug)
          if (entry?.lookAt) {
            // A theme that follows the clock by itself: its glass is set again when the sky
            // changes it, and its scene written afresh each time, so a picture the app restarted
            // (it does on a resize) is never far behind the clock.
            const before = clockLookKey
            const look = lookOf(entry)
            if (clockLookKey === before) return $.ui.invalidate('ui.render')
            return setLook($, look).then(() => $.ui.invalidate('ui.render'))
          }
          if (!entry?.kit || momentOf({ ...entry, kit: entry.kit }) === shown) return undefined
          return setLook($, lookOf(entry)).then(() => $.ui.invalidate('ui.render'))
        })
        .catch(() => undefined)
    })
    if ((await $.store.get(PANEL_OFF_KEY).catch(() => undefined)) !== true) void openPanel($).catch(() => undefined)
    return next(e)
  })

  on('command.run', { command: 'theme-panel' }, async ($, e) => {
    const arg = e.args.trim()
    const verb = arg.toLowerCase()
    if (verb === 'off') {
      await $.store.set(PANEL_OFF_KEY, true).catch(() => undefined)
      if ((await $.ui.panes()).some(p => p.id === PANE)) await $.ui.close({ id: PANE })
      return { text: 'Theme panel closed, in new sessions too. /theme-panel on brings it back.' }
    }
    if (verb === '' || verb === 'on') {
      await $.store.delete(PANEL_OFF_KEY).catch(() => undefined)
      const r = await openPanel($)
      return { text: r.isPlaced ? 'Theme panel open on the right.' : `Theme panel is open but not shown here: ${r.reason}` }
    }
    if (verb === 'blur on' || verb === 'blur off') {
      await setBlur($, verb === 'blur on')
      return { text: `Blur behind messages ${verb === 'blur on' ? 'on' : 'off'}.` }
    }
    // "<theme name> day|sunset|night": that theme at that time of day.
    const words = arg.split(/\s+/)
    const last = words[words.length - 1]?.toLowerCase()
    if (words.length > 1 && isSlot(last)) {
      const timed = findEntry(words.slice(0, -1).join(' '))
      if (timed) {
        if (!timed.slots?.includes(last)) {
          const has = (timed.slots ?? []).map(s => SLOT_NAME[s].toLowerCase())
          return { text: has.length ? `${timed.name} has ${has.join(', ')} only.` : `${timed.name} has one look only.` }
        }
        await pickTime($, timed.slug, last)
        return { text: `${timed.name} is on, at ${SLOT_NAME[last].toLowerCase()}.` }
      }
    }
    const entry = findEntry(arg)
    if (!entry) return { text: `No theme "${arg}". Themes: ${CATALOG.map(c => c.name).join(', ')}.` }
    await pick($, entry.slug)
    return { text: `${entry.name} is on.` }
  })

  // Closing the panel by hand keeps it closed in new sessions, until /theme-panel on.
  on('ui.close', ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') void $.store.set(PANEL_OFF_KEY, true).catch(() => undefined)
    return next(e)
  })

  // The backdrop: the scene of the theme that is on, for this plugin's own sets alone.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== $.plugin.name) return next(e)
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const entry = entryOf(e.props.scene)
    if (!entry) return next(e)
    const { Svg } = $.ui.resolve(e)
    if (!entry.kit) {
      if (entry.svgAt) return <Svg source={entry.svgAt(now(), slotOf(entry))} alt={entry.alt ?? entry.name} isInteractive />
      if (!entry.svg) return next(e)
      return entry.isInteractive ? <Svg source={entry.svg()} alt={entry.alt ?? entry.name} isInteractive /> : <Svg source={entry.svg()} alt={entry.alt ?? entry.name} />
    }
    const m = shown ?? momentOf({ ...entry, kit: entry.kit })
    return <Svg source={sceneAt(sceneOf(entry.kit, m), now())} alt={altOf(entry.kit, m)} isInteractive />
  })

  // The price board's figures: redrawn only when what it shows changes and its theme is on.
  on('session.measure', async ($, e, next) => {
    const week = weekOf(e)
    if (week !== undefined && e.changed.includes('rateLimits')) {
      $.store.set(WEEKLY_KEY, { percent: week.percentUsed, resetsAt: week.resetsAt }).catch(() => undefined)
    }
    if (setFigures(withReading(e)) && boardIsOn()) $.ui.invalidate('ui.render')
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const used = e.usage !== undefined ? tokensOf(e.usage) : 0
    if (used > 0) {
      const changed = setFigures({ ...figures, tokens: (figures.tokens ?? 0) + used })
      if (tokensKey !== undefined) $.store.set(tokensKey, figures.tokens).catch(() => undefined)
      if (changed && boardIsOn()) $.ui.invalidate('ui.render')
    }
    return result
  })

  // The button in the desktop prompt footer, beside the model picker: a straw hat with a red band. The footer
  // draws a Button as its label alone (a picture under it, or its children, are left out), so the
  // icon is the label. A press opens or closes the panel in the mod itself, so nothing is sent to
  // the session and a turn that is running carries on. The footer's own mode labels follow it.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (e.surface !== 'desktop') return next(e)
    const { Box, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Button key="toggle-theme-panel" label={BUTTON_ICON} plain onPress={() => void togglePanel($).catch(() => undefined)} />
        {await next(e)}
      </Box>
    )
  })

  // The panel: "9 themes" and the page arrows on top, then a page of cards, each the scene's
  // picture with the theme's name under it. A press anywhere on a card puts that theme on.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const onNow = await read($, current)
    const isBlur = await read($, blurOn)
    const picked = await read($, times)
    const blurLabel = isBlur ? '◉ Blur on' : '○ Blur off'
    const toggleBlur = () => void setBlur($, !isBlur).catch(() => undefined)
    const total = CATALOG.length
    if (e.surface === 'terminal') {
      const { Box, Text, Button } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          <Text dimColor>{`${total} themes`}</Text>
          <Button key="toggle-blur" plain onPress={toggleBlur}>{blurLabel}</Button>
          {CATALOG.map(c => (
            <Button key={`pick-${c.slug}`} plain onPress={() => void pick($, c.slug)}>
              {c.slug === onNow ? `● ${c.name}` : `  ${c.name}`}
            </Button>
          ))}
        </Box>
      )
    }
    const { Box, Text, Button, Svg } = $.ui.resolve(e)
    const cols = e.props.bodyColumns || e.viewport?.columns || 40
    const w = Math.round(Math.max(180, Math.min(520, cols * CELL_PX - 6)))
    const ph = Math.round((w * THUMB_H) / THUMB_W)
    const pages = PAGES.length
    const p = Math.max(0, Math.min(await read($, page), pages - 1))
    const turn = (d: number) => void update($, page, x => Math.max(0, Math.min(pages - 1, Math.min(x, pages - 1) + d)))
    return (
      <Box flexDirection="column" gap={1}>
        <Box key="head" flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text dimColor>{`${total} themes`}</Text>
          {pages > 1 && (
            <Box key="arrows" flexDirection="row" gap={1}>
              <Button key="up" label="▲" dimColor={p === 0} onPress={() => turn(-1)} />
              <Button key="down" label="▼" dimColor={p >= pages - 1} onPress={() => turn(1)} />
            </Box>
          )}
        </Box>
        {PAGES[p]!.map(c => (
          <Box key={`card-${c.slug}`} flexDirection="column">
            <Svg source={cardSvg(c, c.slug === onNow)} alt={`${c.name} theme${c.slug === onNow ? ', on now' : ''}`} width={w} height={ph} />
            <Text bold>{c.name}</Text>
            {/* One press anywhere on the card: a see-through button laid over the picture and
                the name, as tall as the card (a row stretches it) and as wide as its blank
                label, cut to the card's edge. */}
            <Box key={`hit-${c.slug}`} position="absolute" top={0} left={0} right={0} bottom={0} flexDirection="row" alignItems="stretch" overflow="hidden">
              <Button key={`pick-${c.slug}`} plain label={BLANK.repeat(Math.ceil(w / 4) + 20)} onPress={() => void pick($, c.slug)} />
            </Box>
            {/* The time-of-day buttons in the card's top-right corner, over the press-anywhere
                button: a sun, a sunset and a moon, the one this theme shows marked. A press
                puts the theme on at that time. A scene with one look has none. */}
            {(c.slots?.length ?? 0) > 1 && (
              <Box key={`times-${c.slug}`} position="absolute" top={0} right={0} flexDirection="row" gap={0}>
                {SLOTS.filter(s => c.slots!.includes(s)).map(s => (
                  <Button
                    key={`time-${c.slug}-${s}`}
                    label={SLOT_ICON[s]}
                    {...(slotOf(c, picked) === s ? { variant: 'primary' as const } : { dimColor: true })}
                    onPress={() => void pickTime($, c.slug, s).catch(() => undefined)}
                  />
                ))}
              </Box>
            )}
          </Box>
        ))}
        <Box key="foot" flexDirection="row">
          <Button key="toggle-blur" label={blurLabel} dimColor={!isBlur} onPress={toggleBlur} />
        </Box>
      </Box>
    )
  })
}
