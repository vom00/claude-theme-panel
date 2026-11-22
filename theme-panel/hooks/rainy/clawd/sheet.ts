// Clawd for the backdrop: the plain mascot, drawn the way clawdhouse draws his
// body and face (body.ts), with no hats, glasses or props on him. He's turned a little
// toward the conversation, typing on the laptop in front of him: a short
// script of poses that loops as a sprite sheet, stepped by SMIL.
//
// The scene turns each of his pixels into one round dot, so every pose here is
// plain pixels; the dots come from the scene's mask.

import * as E from './body'

// His canvas: 24 x 16 pixels and a pixel of room on each side.
export const SHEET_W = E.W0 + 2
export const SHEET_H = E.H0 + 2

// The scene's clock: everything that moves changes on a twelfth of a second,
// so the picture redraws at most twelve times a second.
export const FPS = 12
export const ticks = (secs: number) => Math.max(1, Math.round(secs * FPS))

export type Sheet = { css: string; body: string; width: number; height: number }
type Pose = { face: E.Face; arms: E.Arms }

const f = E.face
const look = (dx: number, dy: number) => ({ look: { dx, dy } })

// The loop, as [pose, seconds]: he types with his arms in turn, eyes on the
// screen, blinks, and now and then glances up at you with a little smile.
function script(): [Pose, number][] {
  const typing = (n: number): [Pose, number][] =>
    Array.from({ length: n }, (_, i) => [{ face: f('open', 'none', look(-1, 1)), arms: i % 2 ? { front: 'out', back: 'down' } : { front: 'down', back: 'out' } }, 0.17])
  const still = (face: E.Face, secs: number): [Pose, number] => [{ face, arms: { front: 'down', back: 'down' } }, secs]
  return [
    ...typing(10),
    still(f('closed'), 0.17),
    ...typing(8),
    still(f('open', 'none', look(-1, 1)), 0.9),
    ...typing(12),
    still(f('open', 'none', look(-1, 0)), 0.75),
    still(f('open', 'smile', { ...look(-1, 0), blush: true }), 0.9),
    still(f('closed'), 0.17),
    ...typing(6),
  ]
}

// One pose as pixels: his body, arms and legs in 2 x 2 blocks, then his face,
// as clawdhouse lays them out. Turned a little: his face sits a pixel toward
// his front, and his far side and far arm are in shade.
function paint(pose: Pose) {
  const px: (string | undefined)[] = new Array(SHEET_W * SHEET_H)
  const put = (x: number, y: number, c: string) => {
    if (x >= 0 && x < SHEET_W && y >= 0 && y < SHEET_H) px[y * SHEET_W + x] = c
  }
  const ox = 1
  const oy = 1
  const block = (x: number, y: number, c: string) => {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) put(ox + x * 2 + i, oy + y * 2 + j, c)
  }
  for (let y = 0; y < 6; y++) for (let x = 2; x < 10; x++) block(x, y, E.BODY)
  for (let y = 0; y < 12; y++) put(ox + 19, oy + y, E.BODY_DARK)
  // Facing left, his front arm is on the left and the far one on the right.
  for (const [x, y] of E.ARM_BLOCKS[pose.arms.front]) block(x, y, E.BODY)
  for (const [x, y] of E.ARM_BLOCKS[pose.arms.back]) block(11 - x, y, E.BODY_DARK)
  for (const x of E.LEGS) {
    const c = x > 5 ? E.BODY_DARK : E.BODY
    block(x, 6, c)
    block(x, 7, c)
  }
  E.drawFace(pose.face, (x, y, c) => put(ox + x - 1, oy + y, c))

  const byColor = new Map<string, string[]>()
  for (let y = 0; y < SHEET_H; y++) {
    let x = 0
    while (x < SHEET_W) {
      const c = px[y * SHEET_W + x]
      if (!c) {
        x++
        continue
      }
      let w = 1
      while (x + w < SHEET_W && px[y * SHEET_W + x + w] === c) w++
      const runs = byColor.get(c) ?? []
      runs.push(`M${x} ${y}h${w}v1h-${w}z`)
      byColor.set(c, runs)
      x += w
    }
  }
  return [...byColor].map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('')
}

let cached: Sheet | undefined

export function clawdSheet(): Sheet {
  if (cached) return cached

  // Each pose lasts a whole number of ticks, so the frames change on the
  // scene's clock.
  const frames = script().map(([pose, secs]) => [pose, ticks(secs)] as const)
  const total = frames.reduce((n, [, t]) => n + t, 0)
  const dur = (total / FPS).toFixed(4)
  // Each distinct pose is drawn once, shown in every stretch of the loop that
  // uses it.
  const spans = new Map<string, [number, number][]>()
  let t = 0
  for (const [pose, len] of frames) {
    const art = paint(pose)
    const list = spans.get(art) ?? []
    list.push([t, t + len])
    spans.set(art, list)
    t += len
  }
  // SMIL, not CSS: the desktop app's frame runs SVG's own animation elements.
  // Each pose's opacity flips on at the start of its stretches and off at
  // their ends; the first pose shows if nothing animates.
  const css = ''
  let body = ''
  ;[...spans].forEach(([art, list], i) => {
    const keys: [number, number][] = []
    if (list[0]?.[0] !== 0) keys.push([0, 0])
    for (const [from, to] of list) {
      keys.push([from / total, 1])
      if (to < total) keys.push([to / total, 0])
    }
    const times = keys.map(([t]) => t.toFixed(4)).join(';')
    const values = keys.map(([, v]) => v).join(';')
    body += `<g opacity="${i === 0 ? 1 : 0}"><animate attributeName="opacity" values="${values}" keyTimes="${times}" calcMode="discrete" dur="${dur}s" repeatCount="indefinite"/>${art}</g>`
  })
  cached = { css, body, width: SHEET_W, height: SHEET_H }
  return cached
}
