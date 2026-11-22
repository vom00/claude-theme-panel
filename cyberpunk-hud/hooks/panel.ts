/**
 * Cyberpunk side panel: the HUD stood on end for the pane docked right of the chat. The same
 * sections as the band (context, plan limits, agents, the session's stats), with a theme card
 * on top showing the theme the app is on, its moment of the day and its colours.
 */

import type { Hud } from '../types'
import {
  agentsSection,
  contextSection,
  DAYS,
  hhmm,
  inPhase,
  limitsSection,
  MONTHS,
  pad,
  portraitBlock,
  sharedDefs,
  text,
  usePalette,
} from './core'
import type { PortraitArt } from './core'
import { DEFAULT } from './palette'
import type { Palette } from './palette'

export const PANEL_W = 360
export const PANEL_H = 852
export const MINI_W = 360
export const MINI_H = 132

export type Card = { name: string; moment: string; wash: readonly string[] }

type PanelOpts = PortraitArt & { now: number; phaseNow?: number; isWorking: boolean; palette?: Palette; card: Card }

const rail = (y: number, p: Palette, isWorking: boolean, w = PANEL_W) =>
  `<line x1="18" y1="${y}" x2="${w - 18}" y2="${y}" stroke="${p.amber}" stroke-width="2.5" stroke-dasharray="16 11">${
    isWorking ? '<animate attributeName="stroke-dashoffset" from="0" to="-54" dur="1.6s" repeatCount="indefinite"/>' : ''
  }</line>`

const rule = (y: number, p: Palette, w = PANEL_W) =>
  `<line x1="18" y1="${y}" x2="${w - 18}" y2="${y}" stroke="${p.amberDim}" stroke-width="1" stroke-dasharray="2 4" opacity="0.7"/>`

/** The scene's colours as a strip, left to right, with scanlines and a frame. */
function washStrip(id: string, x: number, y: number, w: number, h: number, card: Card, p: Palette): string {
  const stops = card.wash.length > 1 ? card.wash : [card.wash[0] ?? p.bg, card.wash[0] ?? p.bg]
  const grad = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops
    .map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(3)}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`
  return [
    `<defs>${grad}</defs>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="url(#${id})"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="url(#scan)" opacity="0.6"/>`,
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="5" fill="none" stroke="${p.amberDim}" stroke-width="1"/>`,
  ].join('')
}

function themeCard(o: PanelOpts, p: Palette): string {
  const x0 = 132
  const x1 = PANEL_W - 20
  const name = o.card.name.toUpperCase()
  const size = name.length > 13 ? 16 : name.length > 10 ? 18 : 21
  const out: string[] = []
  out.push(text(x0, 42, 'THEME', { weight: 700, ls: 1.6 }))
  out.push(text(x1, 42, 'LIVE', { size: 10, fill: p.muted, anchor: 'end', ls: 1 }))
  out.push(`<circle cx="${x1 - 32}" cy="38.5" r="3" fill="${p.cyan}"><animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite"/></circle>`)
  out.push(text(x0, 70, name, { size, fill: p.text, weight: 700, ls: 0.6 }))
  out.push(text(x0, 88, o.card.moment.toUpperCase(), { size: 11, fill: p.cyan, weight: 700, ls: 1.2 }))
  out.push(washStrip('wash', x0, 98, x1 - x0, 52, o.card, p))
  // the palette the HUD took from the theme
  const sw: Array<[string, string]> = [
    [p.amber, 'A'],
    [p.cyan, 'B'],
    [p.pink, 'C'],
  ]
  sw.forEach(([c], i) => {
    out.push(`<rect x="${x0 + i * 20}" y="160" width="14" height="14" rx="2" fill="${c}"/>`)
  })
  out.push(text(x0 + 66, 171.5, 'HUD MATCHES THEME', { size: 9.5, fill: p.muted, ls: 0.6 }))
  return out.join('')
}

function stats(h: Hud, now: number, isWorking: boolean, p: Palette, y0: number): string {
  const out: string[] = []
  const up = h.startedAt > 0 ? Math.max(0, now - h.startedAt) : 0
  const upS = `${pad(Math.floor(up / 3600_000))}:${pad(Math.floor((up % 3600_000) / 60_000))}`
  const lastS =
    h.lastTurnMs === null
      ? '--'
      : h.lastTurnMs < 60_000
        ? `${Math.round(h.lastTurnMs / 1000)}s`
        : `${Math.floor(h.lastTurnMs / 60_000)}m${pad(Math.round((h.lastTurnMs % 60_000) / 1000))}s`
  const cells: Array<[string, string, string?]> = [
    ['TOOL CALLS', String(h.toolCalls)],
    ['TURNS', String(h.turns)],
    ['LAST TURN', lastS],
    ['FAILED', String(h.failed), h.failed > 0 ? p.red : undefined],
    ['UPTIME', upS],
    ['API COST', h.costUsd === null ? '--' : `$${h.costUsd.toFixed(2)}`, p.cyan],
  ]
  cells.forEach(([k, v, col], i) => {
    const colX = i % 2 === 0 ? 20 : 192
    const colEnd = i % 2 === 0 ? 170 : PANEL_W - 20
    const y = y0 + Math.floor(i / 2) * 24
    out.push(text(colX, y, k, { size: 12, fill: p.muted, ls: 0.6 }))
    out.push(text(colEnd, y, v, { size: 12.5, fill: col ?? p.amber, weight: 700, anchor: 'end', ls: 0.4 }))
  })
  const d = new Date(now)
  const yClock = y0 + 3 * 24 + 8
  out.push(rule(yClock - 18, p))
  out.push(
    text(20, yClock, `${hhmm(now)}  ${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`, {
      size: 13,
      fill: p.amber,
      weight: 700,
      ls: 0.8,
      extra: ' xml:space="preserve"',
    }),
  )
  const stateCol = isWorking ? p.cyan : p.amberDim
  out.push(
    `<circle cx="${PANEL_W - 94}" cy="${yClock - 4.5}" r="4" fill="${stateCol}">${
      isWorking ? '<animate attributeName="opacity" values="1;0.25;1" dur="1.2s" repeatCount="indefinite"/>' : ''
    }</circle>`,
  )
  out.push(text(PANEL_W - 20, yClock, isWorking ? 'ACTIVE' : 'STANDBY', { size: 13, fill: stateCol, weight: 700, anchor: 'end', ls: 1 }))
  return out.join('')
}

/** The side panel as one SVG document, PANEL_W by PANEL_H. */
export function renderPanel(h: Hud, o: PanelOpts): string {
  const p = o.palette ?? DEFAULT
  usePalette(p)
  const W = PANEL_W
  const H = PANEL_H
  // each band section is drawn from y=24 down; `at` moves it to its place
  const at = (y: number, body: string) => `<g transform="translate(0 ${y - 24})">${body}</g>`
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMin meet" style="display:block">`,
    `<defs>${sharedDefs()}</defs>`,
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="${p.bg}" stroke="${p.edge}" stroke-width="2"/>`,
    rail(13, p, o.isWorking),
    portraitBlock(20, 32, 96, 130, o),
    themeCard(o, p),
    rule(196, p),
    at(204, contextSection(h, 20, W - 20)),
    rule(378, p),
    at(386, limitsSection(h, o.now, 20, W - 20)),
    rule(540, p),
    at(548, agentsSection(h, o.now, 20, W - 20)),
    rule(728, p),
    stats(h, o.now, o.isWorking, p, 752),
    `</svg>`,
  ].join('')
  return o.phaseNow === undefined ? svg : inPhase(svg, o.phaseNow)
}

/** The panel minimised to a widget: theme strip, context and the 5-hour limit at a glance. */
export function renderMini(h: Hud, o: PanelOpts): string {
  const p = o.palette ?? DEFAULT
  usePalette(p)
  const W = MINI_W
  const H = MINI_H
  const pct = h.ctxPct === null ? '--%' : `${Math.round(h.ctxPct)}%`
  const five = h.limits.find(l => l.kind === 'five_hour')
  const fiveS = five ? `${Math.round(five.pct)}%` : '--'
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block">`,
    `<defs>${sharedDefs()}</defs>`,
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="${p.bg}" stroke="${p.edge}" stroke-width="2"/>`,
    rail(13, p, o.isWorking, W),
    washStrip('wash', 18, 26, 70, 88, o.card, p),
    text(102, 44, o.card.name.toUpperCase(), { size: 13, fill: p.text, weight: 700, ls: 0.6 }),
    text(102, 60, o.card.moment.toUpperCase(), { size: 10, fill: p.cyan, weight: 700, ls: 1 }),
    text(102, 84, 'CONTEXT', { size: 10.5, fill: p.amber, weight: 700, ls: 1.2 }),
    text(102, 108, pct, { size: 24, fill: p.cyan, weight: 700, ls: 0 }),
    text(W - 20, 84, '5-HOUR', { size: 10.5, fill: p.amber, weight: 700, anchor: 'end', ls: 1.2 }),
    text(W - 20, 108, fiveS, { size: 24, fill: p.amber, weight: 700, anchor: 'end', ls: 0 }),
    `</svg>`,
  ].join('')
  return o.phaseNow === undefined ? svg : inPhase(svg, o.phaseNow)
}
