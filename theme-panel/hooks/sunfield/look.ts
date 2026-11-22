// Sunfield, carried by the theme panel: one scene whose sky follows a 24-hour cycle, held here at
// its night. day.js and scene.js are the BackdropKit theme's own, as unpacked into
// ~/.claude/backdropkit/sunfield; the colours are the kit's shared ones, which are Sunfield's.
import type { ThemeSetArgs } from 'claude-code'

import { BLUR, COLORS, NIGHT_COLORS } from '../kit/colors.js'
import { makeColors } from '../kit/make-colors.js'
import { MOMENTS, paneAt, sceneAt, secondsOfDay, sunTimes } from './day.js'
import { SCENE } from './scene.js'

export const SUNFIELD_SCENE = 'sunfield'
export const SUNFIELD_ALT =
  'A pixel-art night sky over a sunflower field: stars and a moon, a tall cloud, a plane drawing a contrail, and sunflowers swaying in the wind'

const DAY = makeColors(COLORS)
const NIGHT = makeColors(NIGHT_COLORS)

/**
 * Night, always: the hour of the scene's own night moment (well before dawn) on the day of `ms`.
 * The sky is drawn for that hour; the panel rewrites the scene every few minutes, so its day
 * cycle never runs on toward dawn.
 */
export function nightOf(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  const offset = MOMENTS.night?.[1] ?? -160
  return d.getTime() + (sunTimes(ms).rise + offset) * 60_000
}

/** The look at `ms`, held at night: night colours, and the glass tinted from the night sky. */
export function sunfieldLookAt(ms: number): ThemeSetArgs {
  const pane = paneAt(nightOf(ms))
  return {
    colors: (pane.dark ? NIGHT : DAY).theme,
    overrideColorScheme: pane.dark ? 'dark' : 'light',
    backdrop: { scene: SUNFIELD_SCENE, glass: { blur: BLUR, tint: pane.tint, opacity: pane.opacity } },
  }
}

/**
 * The scene written for `ms`: its sky set to night, its motion (clouds, birds, the plane, the
 * swaying flowers) to the real time, so a rewrite carries on where it was instead of jumping back.
 */
export function sunfieldSvgAt(ms: number): string {
  const night = nightOf(ms)
  const svg = sceneAt(SCENE, night)
  // sceneAt writes '--t:-<sky>s;--m:-<motion>s', both counted from `night`: move the motion on by
  // the time between `night` and now.
  const t = Math.round((secondsOfDay(night) + 0.2) * 20) / 20
  const head = '--t:-' + t + 's;--m:'
  const at = svg.indexOf(head)
  if (at < 0) return svg
  const end = svg.indexOf('s', at + head.length)
  const motion = -Number(svg.slice(at + head.length, end))
  if (!Number.isFinite(motion)) return svg
  const real = Math.max(0, Math.round((motion + (ms - night) / 1000) * 20) / 20)
  return svg.slice(0, at + head.length) + -real + svg.slice(end)
}
