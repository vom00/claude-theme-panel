/**
 * Cyberpunk HUD: pure drawing. Takes the session's numbers and returns one SVG
 * document, the retro HUD drawn above the prompt.
 */

import type { Agent, Hud, Limit } from '../types'
import { DEFAULT, mix } from './palette'
import type { Palette } from './palette'

export const EMPTY: Hud = {
  ctxPct: null,
  ctxTokens: null,
  ctxWindow: 0,
  cats: null,
  ctxHistory: [],
  limits: [],
  toolsPerTurn: [],
  toolCalls: 0,
  turns: 0,
  lastTurnMs: null,
  failed: 0,
  startedAt: 0,
  curTools: 0,
  lastAnswer: '',
  costUsd: null,
  agents: [],
  spawned: 0,
}

/** Fills fields an older stored shape lacks. */
export const normalize = (x: Partial<Hud> | null | undefined): Hud => ({ ...EMPTY, ...(x ?? {}) })

/** The colours of the drawing being made: set from the theme at the start of each render. */
let C: Palette = DEFAULT

/** Sets the colours the next drawing uses (renderHud and renderPanel call it themselves). */
export function usePalette(p: Palette) {
  C = p
}

export const MONO = "'Share Tech Mono','Cascadia Mono','Consolas','Menlo',monospace"
const SANS = "'Segoe UI','Inter',system-ui,sans-serif"

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const kTok = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
export const pad = (n: number) => String(n).padStart(2, '0')
export const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export const hhmm = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const left = (ms: number) => {
  const m = Math.max(0, Math.floor(ms / 60_000))
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  const mm = m % 60
  return d > 0 ? `${d}D ${h}H` : h > 0 ? `${h}H ${mm}M` : `${mm}M`
}

const SPANS: Record<string, number> = { five_hour: 5 * 3600_000, seven_day: 7 * 86400_000 }

export const text = (x: number, y: number, s: string, o: { size?: number; fill?: string; weight?: number; anchor?: string; font?: string; ls?: number; extra?: string } = {}) =>
  `<text x="${x}" y="${y}" font-family="${o.font ?? MONO}" font-size="${o.size ?? 11}" fill="${o.fill ?? C.amber}"${o.weight ? ` font-weight="${o.weight}"` : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''} letter-spacing="${o.ls ?? 1}"${o.extra ?? ''}>${esc(s)}</text>`

export function contextSection(h: Hud, x0 = 164, x1 = 478): string {
  const w = x1 - x0
  const out: string[] = []
  out.push(text(x0, 42, 'CONTEXT', { weight: 700, ls: 1.6 }))
  if (h.ctxTokens !== null && h.ctxWindow > 0) {
    out.push(text(x1, 42, `${kTok(h.ctxTokens)} OF ${kTok(h.ctxWindow)} TOKENS`, { size: 11, fill: C.muted, anchor: 'end', ls: 0.6 }))
  }
  const pct = h.ctxPct === null ? null : Math.round(h.ctxPct)
  const big = pct === null ? '--%' : `${pct}%`
  out.push(text(x0, 84, big, { size: 32, fill: C.cyan, weight: 700, ls: 0 }))
  out.push(text(x0 + big.length * 19 + 22, 79, 'USED', { size: 11, fill: C.cyan, weight: 700, ls: 1.8 }))

  // stacked bar
  const by = 93
  const bh = 14
  out.push(`<rect x="${x0}" y="${by}" width="${w}" height="${bh}" fill="${C.amberDeep}"/>`)
  out.push(`<rect x="${x1 - 14}" y="${by}" width="14" height="${bh}" fill="url(#hatch)"/>`)
  const total = pct ?? 0
  const cats = h.cats
  const sum = cats ? cats.messages + cats.system + cats.other : 0
  const parts: Array<[number, string]> =
    cats && sum > 0
      ? [
          [(cats.messages / sum) * total, C.cyan],
          [(cats.system / sum) * total, C.amber],
          [(cats.other / sum) * total, C.pink],
        ]
      : [[total, C.cyan]]
  let cx = x0
  for (const [p, fill] of parts) {
    const pw = Math.max(0, (p / 100) * (w - 14))
    if (pw > 0.2) out.push(`<rect x="${cx.toFixed(1)}" y="${by}" width="${Math.max(pw, 3).toFixed(1)}" height="${bh}" fill="${fill}"/>`)
    cx += Math.max(pw, pw > 0.2 ? 3 : 0)
  }
  // legend
  if (cats) {
    const items: Array<[string, number, string]> = [
      ['MESSAGES', cats.messages, C.cyan],
      ['SYSTEM', cats.system, C.amber],
      ['OTHER', cats.other, C.pink],
    ]
    let lx = x0
    for (const [name, v, fill] of items) {
      const label = `${name} ${Math.round(v)}%`
      out.push(`<rect x="${lx}" y="116" width="9" height="9" fill="${fill}"/>`)
      out.push(text(lx + 13, 125, label, { size: 11, fill: C.text, ls: 0.4 }))
      lx += 13 + label.length * 7 + 16
    }
  }
  // sparkline of the last 4 turns
  const hist = h.ctxHistory.slice(-4)
  const sy0 = 172
  const sy1 = 146
  out.push(`<line x1="${x0}" y1="${sy0}" x2="${x1}" y2="${sy0}" stroke="${C.amberDeep}" stroke-width="1"/>`)
  if (hist.length > 0) {
    const pts = hist.map((v, i) => {
      const px = hist.length === 1 ? x1 : x0 + (i / (hist.length - 1)) * w
      const py = sy0 - (Math.min(100, v) / 100) * (sy0 - sy1)
      return [px, py] as const
    })
    if (pts.length > 1) out.push(`<polyline points="${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')}" fill="none" stroke="${C.cyan}" stroke-width="1.5" opacity="0.75"/>`)
    const [lx, ly] = pts[pts.length - 1]!
    out.push(`<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="3.2" fill="${C.cyan}"/>`)
  }
  out.push(text(x0, 188, `CONTEXT AFTER EACH OF THE LAST ${Math.max(4, hist.length)} TURNS`, { size: 10.5, fill: C.muted, ls: 0.5 }))
  return out.join('')
}

function limitRow(l: Limit | undefined, label: string, y0: number, now: number, x0 = 502, x1 = 788): string {
  const w = x1 - x0
  const out: string[] = []
  out.push(text(x0, y0, label, { weight: 700, ls: 1.4 }))
  if (!l) {
    out.push(text(x0, y0 + 22, 'NO READING YET', { size: 11, fill: C.muted }))
    return out.join('')
  }
  const pct = Math.round(l.pct)
  const hot = pct >= 80
  const fill = hot ? C.red : pct >= 60 ? C.amber : C.cyan
  const deep = hot ? C.redDeep : pct >= 60 ? C.amberDeep : C.cyanDeep
  out.push(text(x1, y0 + 2, `${pct}%`, { size: 19, fill, weight: 700, anchor: 'end', ls: 0 }))
  const n = 20
  const gap = 2
  const sw = (w - gap * (n - 1)) / n
  const on = Math.min(n, Math.round((pct / 100) * n))
  for (let i = 0; i < n; i++) {
    const sx = x0 + i * (sw + gap)
    const isLast = i === on - 1 && hot
    out.push(
      `<rect x="${sx.toFixed(1)}" y="${y0 + 10}" width="${sw.toFixed(1)}" height="13" rx="1.5" fill="${i < on ? fill : deep}">${
        isLast ? '<animate attributeName="opacity" values="1;0.35;1" dur="1.4s" repeatCount="indefinite"/>' : ''
      }</rect>`,
    )
  }
  const span = SPANS[l.kind]
  const parts: string[] = []
  if (l.resetsAt !== null) {
    const d = new Date(l.resetsAt)
    parts.push(l.kind === 'five_hour' ? `RESET ${hhmm(l.resetsAt)}` : `RESET ${DAYS[d.getDay()]} ${hhmm(l.resetsAt)}`)
    parts.push(`${left(l.resetsAt - now)} LEFT`)
    if (span) {
      const gone = Math.min(1, Math.max(0, 1 - (l.resetsAt - now) / span))
      const mx = x0 + gone * w
      out.push(`<rect x="${(mx - 1).toFixed(1)}" y="${y0 + 7}" width="2" height="19" rx="1" fill="${C.text}" opacity="0.85"/>`)
      const diff = pct - gone * 100
      parts.push(diff > 3 ? 'AHEAD OF PACE' : diff < -3 ? 'UNDER PACE' : 'ON PACE')
    }
  }
  out.push(text(x0, y0 + 37, parts.join(' · '), { size: 10.5, fill: C.text, ls: 0 }))
  return out.join('')
}

export function limitsSection(h: Hud, now: number, x0 = 502, x1 = 788): string {
  const out: string[] = []
  out.push(text(x0, 42, 'PLAN LIMITS', { weight: 700, ls: 1.6 }))
  out.push(text(x1, 42, '│ TIME GONE', { size: 10.5, fill: C.muted, anchor: 'end', ls: 0.6 }))
  out.push(limitRow(h.limits.find(l => l.kind === 'five_hour'), '5-HOUR', 68, now, x0, x1))
  out.push(limitRow(h.limits.find(l => l.kind === 'seven_day'), 'WEEKLY', 136, now, x0, x1))
  return out.join('')
}

export const dur = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m${pad(s % 60)}s` : `${Math.floor(s / 3600)}h${pad(Math.floor((s % 3600) / 60))}m`
}

/** Elapsed for a running agent, in whole minutes: the panel redraws at most once a minute while idle. */
export const mins = (ms: number) => (ms < 60_000 ? "<1M" : ms < 3600_000 ? `${Math.floor(ms / 60_000)}M` : `${Math.floor(ms / 3600_000)}H${pad(Math.floor((ms % 3600_000) / 60_000))}M`)

export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/** A model id as a short label: claude-opus-5-5 -> OPUS 5.5, claude-sonnet-4-5-20250929 -> SONNET 4.5, haiku -> HAIKU. */
export const modelLabel = (id: string) => {
  const parts = id
    .replace(/^.*?claude-/i, '')
    .replace(/\[.*\]$/, '')
    .split(/[-_.@]/)
    .filter(p => p && !/^\d{6,}$/.test(p))
  const name = parts.find(p => /[a-z]/i.test(p)) ?? ''
  const ver = parts.filter(p => /^\d{1,2}$/.test(p)).slice(0, 2).join('.')
  return `${name.toUpperCase()}${ver ? ` ${ver}` : ''}`.trim()
}

/** How long a finished agent stays in the Active Agents list, showing DONE or FAILED, before it goes. */
export const AGENT_LINGER_MS = 30_000

/** Marks the agents that finished at least AGENT_LINGER_MS before `now` as gone from the list. */
export function sweepAgents(h: Hud, now: number): Hud {
  const isStale = (a: Agent) => a.status !== 'running' && !a.isGone && a.endedAt !== null && now - a.endedAt >= AGENT_LINGER_MS - 1000
  if (!h.agents.some(isStale)) return h
  return { ...h, agents: h.agents.map(a => (isStale(a) ? { ...a, isGone: true } : a)) }
}

export function agentsSection(h: Hud, now: number, x0 = 812, x1 = 1060): string {
  const out: string[] = []
  const running = h.agents.filter(a => a.status === 'running')
  // The counts are the session's; the list shows the running ones and those just finished.
  const finished = h.agents.filter(a => a.status !== 'running')
  const recent = finished.filter(a => !a.isGone)
  out.push(text(x0, 42, 'ACTIVE AGENTS', { weight: 700, ls: 1.4 }))
  out.push(text(x0, 55, `${running.length} RUNNING · ${finished.filter(a => a.status === 'done').length} DONE`, { size: 10, fill: C.muted, ls: 0.6 }))
  if (running.length > 0) {
    out.push(`<circle cx="${x1 - 4}" cy="38" r="4" fill="${C.cyan}"><animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/></circle>`)
  }
  out.push(`<line x1="${x0}" y1="66" x2="${x1}" y2="66" stroke="${C.amberDim}" stroke-dasharray="2 4" opacity="0.6"/>`)
  const rows: Agent[] = [...running.slice(-4), ...recent.slice(-4).reverse()].slice(0, 4)
  if (rows.length === 0) {
    out.push(text(x0, 104, 'NO AGENTS RUNNING', { size: 11, fill: C.muted }))
    out.push(text(x0, 120, 'SUBAGENTS SHOW UP HERE', { size: 10, fill: C.amberDim, ls: 0.5 }))
  }
  rows.forEach((a, i) => {
    const y = 84 + i * 25
    const isRun = a.status === 'running'
    const col = isRun ? C.cyan : a.status === 'failed' ? C.red : C.amber
    out.push(
      `<circle cx="${x0 + 4}" cy="${y - 4}" r="3.5" fill="${col}">${isRun ? `<animate attributeName="opacity" values="1;0.25;1" dur="1.1s" begin="${(i * 0.25).toFixed(2)}s" repeatCount="indefinite"/>` : ''}</circle>`,
    )
    const model = a.model ? modelLabel(a.model) : ''
    const type = clip(a.type, model ? 10 : 15)
    out.push(text(x0 + 14, y, type, { size: 11.5, fill: col, weight: 700, ls: 0.4 }))
    if (model) out.push(text(x0 + 14 + type.length * 7.4 + 6, y, `· ${model}`, { size: 10.5, fill: C.pink, weight: 700, ls: 0.2 }))
    const right = isRun ? mins(now - a.startedAt) : a.status === 'failed' ? 'FAILED' : `DONE ${dur((a.endedAt ?? now) - a.startedAt)}`
    out.push(text(x1, y, right, { size: 10.5, fill: isRun ? C.cyan : C.muted, anchor: 'end', ls: 0.2 }))
    const sub = `${clip(a.description || '—', 32)}${a.tools ? ` · ${a.tools} TOOLS` : ''}`
    out.push(text(x0 + 14, y + 12, sub, { size: 10, fill: C.muted, ls: 0 }))
    if (isRun) {
      out.push(
        `<line x1="${x0 + 14}" y1="${y + 16}" x2="${x1}" y2="${y + 16}" stroke="${C.cyan}" stroke-width="1" stroke-dasharray="10 14" opacity="0.45"><animate attributeName="stroke-dashoffset" from="0" to="-48" dur="1.2s" repeatCount="indefinite"/></line>`,
      )
    }
  })
  out.push(`<line x1="${x0}" y1="176" x2="${x1}" y2="176" stroke="${C.amberDim}" stroke-width="1"/>`)
  const shown = running.length + recent.length
  const more = shown > rows.length ? ` · +${shown - rows.length} MORE` : ''
  out.push(text(x0, 188, `THIS SESSION · ${h.spawned} SPAWNED${more}`, { size: 10.5, fill: C.amber, ls: 0.5 }))
  return out.join('')
}

function footer(h: Hud, now: number, isWorking: boolean, name: string): string {
  const out: string[] = []

  // stats row
  const up = h.startedAt > 0 ? Math.max(0, now - h.startedAt) : 0
  const upS = `${pad(Math.floor(up / 3600_000))}:${pad(Math.floor((up % 3600_000) / 60_000))}`
  const lastS = h.lastTurnMs === null ? '--' : h.lastTurnMs < 60_000 ? `${Math.round(h.lastTurnMs / 1000)}s` : `${Math.floor(h.lastTurnMs / 60_000)}m${pad(Math.round((h.lastTurnMs % 60_000) / 1000))}s`
  const stats: Array<[string, string, string?]> = [
    ['TOOL CALLS', String(h.toolCalls)],
    ['TURNS', String(h.turns)],
    ['LAST TURN', lastS],
    ['FAILED', String(h.failed), h.failed > 0 ? C.red : undefined],
    ['UPTIME', upS],
    ['API COST', h.costUsd === null ? '--' : `$${h.costUsd.toFixed(2)}`, C.cyan],
  ]
  let sx = 22
  for (const [k, v, col] of stats) {
    out.push(text(sx, 222, k, { size: 13, fill: C.muted, ls: 0.8 }))
    const kx = sx + k.length * 8.6 + 8
    out.push(text(kx, 222, v, { size: 13, fill: col ?? C.amber, weight: 700, ls: 0.6 }))
    sx = kx + v.length * 8.6 + 26
  }
  const d = new Date(now)
  const date = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  out.push(text(936, 222, `${hhmm(now)}   ${date}`, { size: 13, fill: C.amber, weight: 700, ls: 0.8, anchor: 'end', extra: ' xml:space="preserve"' }))
  const stateCol = isWorking ? C.cyan : C.amberDim
  out.push(
    `<circle cx="${960}" cy="217.5" r="4" fill="${stateCol}">${isWorking ? '<animate attributeName="opacity" values="1;0.25;1" dur="1.2s" repeatCount="indefinite"/>' : ''}</circle>`,
  )
  out.push(text(1060, 222, isWorking ? 'ACTIVE' : 'STANDBY', { size: 13, fill: stateCol, weight: 700, anchor: 'end', ls: 1 }))
  return out.join('')
}

export type PortraitArt = { portrait: string; portraitW: number; portraitH: number }

/** The defs the portrait and the context bar use: scanlines, hatching, tint, sweep, duotone. */
export function sharedDefs(): string {
  // scanlines over the portrait
  const scan = `<pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.32"/></pattern>`
  const hatch = `<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="5" fill="${C.amber}"/></pattern>`
  const [t0, t1] = C.duo ? [C.cyan, C.pink] : ['#7b3cff', '#ff4fa3']
  const [o0, o1] = C.duo ? ['0.08', '0.12'] : ['0.18', '0.22']
  const tint = `<linearGradient id="tint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t0}" stop-opacity="${o0}"/><stop offset="1" stop-color="${t1}" stop-opacity="${o1}"/></linearGradient>`
  const glow = C.duo ? mix(C.pink, '#ffffff', 0.7) : '#ffd0f0'
  const sweep = `<linearGradient id="sweep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${glow}" stop-opacity="0"/><stop offset="0.5" stop-color="${glow}" stop-opacity="0.35"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></linearGradient>`
  // the purple portrait recoloured to the theme: grey first, then mapped from dark to light,
  // the darks held down so the face keeps its contrast
  const duo = C.duo
    ? (() => {
        const [lo, hi] = C.duo
        const steps = [lo, lo, mix(lo, hi, 0.3), mix(lo, hi, 0.7), hi]
        const ch = (i: number) => steps.map(c => (parseInt(c.slice(1 + i * 2, 3 + i * 2), 16) / 255).toFixed(3)).join(' ')
        return `<filter id="duo" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="${ch(0)}"/><feFuncG type="table" tableValues="${ch(1)}"/><feFuncB type="table" tableValues="${ch(2)}"/></feComponentTransfer></filter>`
      })()
    : ''
  return scan + hatch + tint + sweep + duo
}

/** The portrait in its frame, its picture `w` by `h` at (`x`, `y`), with a stand under it. */
export function portraitBlock(x: number, y: number, w: number, h: number, art: PortraitArt): string {
  const cx = x + w / 2
  return [
    `<clipPath id="pclip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/></clipPath>`,
    `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="10" fill="none" stroke="${C.pink}" stroke-width="5" opacity="0.18"/>`,
    `<g clip-path="url(#pclip)">`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.duo ? C.duo[0] : '#1a0b3a'}"/>`,
    `<g transform="translate(${x} ${y}) scale(${(w / art.portraitW).toFixed(4)} ${(h / art.portraitH).toFixed(4)})" shape-rendering="crispEdges"${C.duo ? ' filter="url(#duo)"' : ''}>${art.portrait}</g>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#tint)"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#scan)"/>`,
    `<rect x="${x}" y="${y - 18}" width="${w}" height="22" fill="url(#sweep)"><animate attributeName="y" values="${y - 18};${y + h + 4};${y - 18}" dur="5s" repeatCount="indefinite"/></rect>`,
    `</g>`,
    `<rect x="${x - 1}" y="${y - 1}" width="${w + 2}" height="${h + 2}" rx="8" fill="none" stroke="${C.pink}" stroke-width="2"/>`,
    `<ellipse cx="${cx}" cy="${y + h + 10}" rx="${w * 0.3}" ry="5" fill="${C.pink}" opacity="0.25"/>`,
    `<rect x="${cx - w * 0.23}" y="${y + h + 6}" width="${w * 0.46}" height="5" rx="2.5" fill="${C.pink}"/>`,
  ].join('')
}

/**
 * The minimize button at the HUD's top-right, in the HUD's 1080-wide units: a bead at the end
 * of the top rail, centred on it (the rail runs at y 13).
 */
export const HIDE_CHIP = { x: 1036, y: 2, w: 22, h: 22 }

/** The rail's dash period (16 on, 11 off), so it can stop on a whole dash. */
const DASH = 27

/** A round button's disc: the fill, and a thin dark rim inside it so it reads as a button. */
function disc(cx: number, cy: number, r: number, fill: string): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="none" stroke="#000000" stroke-opacity="0.28" stroke-width="2"/>`
  )
}

/** The round minimize button: a disc in the HUD's pink (not the amber of its rails) with a dark minus. */
function minimizeButton(x: number, y: number, d: number): string {
  const r = d / 2
  const cx = x + r
  const cy = y + r
  return (
    disc(cx, cy, r, C.pink) +
    `<line x1="${(cx - r * 0.48).toFixed(1)}" y1="${cy}" x2="${(cx + r * 0.48).toFixed(1)}" y2="${cy}" stroke="${C.bg}" stroke-width="${(d * 0.14).toFixed(1)}" stroke-linecap="round" opacity="0.9"/>`
  )
}

/** The round maximize button: a disc in the HUD's cyan with two dark corner arrows, up-right and down-left. */
function maximizeButton(cx: number, cy: number, r: number): string {
  const a = r * 0.5
  const g = r * 0.1
  return (
    disc(cx, cy, r, C.cyan) +
    `<path d="M${(cx - a * 0.35 + g).toFixed(1)} ${(cy - a).toFixed(1)}H${(cx + a).toFixed(1)}V${(cy + a * 0.35 - g).toFixed(1)}Z` +
    `M${(cx + a * 0.35 - g).toFixed(1)} ${(cy + a).toFixed(1)}H${(cx - a).toFixed(1)}V${(cy - a * 0.35 + g).toFixed(1)}Z" fill="${C.bg}" opacity="0.9"/>`
  )
}

/**
 * The HUD's mark: a rune of a long blade with a zigzag crossing it, drawn in the given colour and
 * fitted into a box `h` tall with its top-left at x, y.
 */
function rune(x: number, y: number, h: number, fill: string): string {
  // drawn on a 640 x 1140 field (the shape's own bounds)
  const w = (h * 640) / 1140
  return (
    `<svg x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h}" viewBox="280 30 640 1140" fill="${fill}">` +
    `<path d="M584 40Q624 600 584 1150Q544 600 584 40Z"/>` +
    `<polyline points="567,207 348,272 536,392 352,503 818,810 668,910" fill="none" stroke="${fill}" stroke-width="58" stroke-linejoin="miter" stroke-miterlimit="12"/>` +
    `<polygon points="632,908 702,908 898,1160"/>` +
    `</svg>`
  )
}

/** The HUD minimized: one slim strip with its name, three readings and a SHOW chip. */
export const STRIP_W = 1080
export const STRIP_H = 46
export function renderStrip(h: Hud, o: { palette?: Palette }): string {
  usePalette(o.palette ?? DEFAULT)
  const W = STRIP_W
  const H = STRIP_H
  const cy = H / 2
  const pctOf = (kind: string) => h.limits.find(l => l.kind === kind)?.pct
  const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '--' : `${Math.round(n)}%`)
  const colourOf = (n: number | null | undefined) => (n !== null && n !== undefined && n >= 80 ? C.red : C.cyan)
  const reading = (x: number, label: string, n: number | null | undefined) =>
    text(x, cy + 5.5, label, { size: 15, fill: C.muted, ls: 1.5 }) + text(x + label.length * 11.5 + 14, cy + 6, fmt(n), { size: 17, fill: colourOf(n), weight: 700 })
  const ctx = h.ctxPct
  const five = pctOf('five_hour')
  const week = pctOf('seven_day')
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block">`,
    `<defs>${sharedDefs()}</defs>`,
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="${C.bg}" stroke="${C.edge}" stroke-width="2"/>`,
    `<line x1="18" y1="4" x2="${W - 18}" y2="4" stroke="${C.amber}" stroke-width="2" stroke-dasharray="16 11" opacity="0.8"/>`,
    rune(20, 6, 34, C.cyan),
    text(52, cy + 6, 'CYBERPUNK HUD', { size: 17, fill: C.amber, weight: 700, ls: 2.5 }),
    `<line x1="252" y1="12" x2="252" y2="${H - 12}" stroke="${C.amberDim}" stroke-dasharray="2 4" opacity="0.7"/>`,
    reading(276, 'CONTEXT', ctx),
    reading(480, '5-HOUR', five),
    reading(670, 'WEEKLY', week),
    maximizeButton(W - 32, cy, 12),
    `</svg>`,
  ].join('')
}

/** The whole HUD as one SVG document. */
export function renderHud(h: Hud, o: { now: number; phaseNow?: number; isWorking: boolean; portrait: string; portraitW: number; portraitH: number; name: string; palette?: Palette; hideChip?: boolean }): string {
  usePalette(o.palette ?? DEFAULT)
  const W = 1080
  const H = 236
  const { now, isWorking } = o
  // with the minimize button, the rail stops on a whole dash a clear gap before it
  const railEnd = o.hideChip ? 18 + Math.floor((HIDE_CHIP.x - 14 - 18 + 11) / DASH) * DASH - 11 : 1062
  const dashes = `<line x1="18" y1="13" x2="${railEnd}" y2="13" stroke="${C.amber}" stroke-width="2.5" stroke-dasharray="16 11">${
    isWorking ? '<animate attributeName="stroke-dashoffset" from="0" to="-54" dur="1.6s" repeatCount="indefinite"/>' : ''
  }</line>`
  const divider = (x: number) => `<line x1="${x}" y1="30" x2="${x}" y2="186" stroke="${C.amberDim}" stroke-width="1" stroke-dasharray="2 4" opacity="0.7"/>`
  const portrait = portraitBlock(20, 28, 112, 152, o)

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block">`,
    `<defs>${sharedDefs()}</defs>`,
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="${C.bg}" stroke="${C.edge}" stroke-width="2"/>`,
    dashes,
    portrait,
    divider(150),
    divider(492),
    divider(800),
    contextSection(h),
    limitsSection(h, now),
    agentsSection(h, now),
    `<line x1="18" y1="198" x2="1062" y2="198" stroke="${C.amberDim}" stroke-width="1" stroke-dasharray="3 5" opacity="0.7"/>`,
    footer(h, now, isWorking, o.name),
    o.hideChip ? minimizeButton(HIDE_CHIP.x, HIDE_CHIP.y, HIDE_CHIP.w) : '',
    `</svg>`,
  ].join('')
  return o.phaseNow === undefined ? svg : inPhase(svg, o.phaseNow)
}

/**
 * Starts each looping animation partway through, as if it had been running since time zero, so a
 * redraw (which rebuilds the frame) picks every loop up where it was instead of jumping to its start.
 */
export function inPhase(svg: string, phaseNow: number): string {
  return svg.replace(/<animate ([^>]*?)\/>/g, (tag, attrs: string) => {
    const d = /dur="([\d.]+)s"/.exec(attrs)
    if (!d || !/repeatCount="indefinite"/.test(attrs)) return tag
    const dur = Number(d[1])
    const offset = /begin="([\d.]+)s"/.exec(attrs)
    const shift = offset ? Number(offset[1]) : 0
    const phase = ((phaseNow / 1000 - shift) % dur + dur) % dur
    const rest = attrs.replace(/\s*begin="[^"]*"/, '')
    return `<animate ${rest} begin="-${phase.toFixed(3)}s"/>`
  })
}

/** Groups a /context breakdown into the three legend groups, in percent of its window. */
export function groupCategories(
  cats: ReadonlyArray<{ name: string; tokens: number; kind: string }>,
  windowTokens: number,
): Hud['cats'] {
  if (!(windowTokens > 0)) return null
  let messages = 0
  let system = 0
  let other = 0
  for (const c of cats) {
    if (c.kind !== 'used') continue
    if (/message/i.test(c.name)) messages += c.tokens
    else if (/system/i.test(c.name)) system += c.tokens
    else other += c.tokens
  }
  const p = (n: number) => (n * 100) / windowTokens
  return { messages: p(messages), system: p(system), other: p(other) }
}
