// Sunfield, carried by the theme panel: one scene whose sky follows a 24-hour cycle, held here at
// the time of day the panel has picked for it (night unless the card's day or sunset button was
// pressed). day.js and scene.js are the BackdropKit theme's own, as unpacked into
// ~/.claude/backdropkit/sunfield; the colours are the kit's shared ones, which are Sunfield's.
import type { ThemeSetArgs } from 'claude-code'

import { BLUR, COLORS, NIGHT_COLORS } from '../kit/colors.js'
import { makeColors } from '../kit/make-colors.js'
import type { Slot } from '../slots'
import { MOMENTS, paneAt, sceneAt, secondsOfDay, sunTimes } from './day.js'
import { SCENE } from './scene.js'

export const SUNFIELD_SCENE = 'sunfield'
export const SUNFIELD_ALT =
  'A pixel-art sky over a sunflower field: a tall cloud, a plane drawing a contrail, and sunflowers swaying in the wind'

const DAY = makeColors(COLORS)
const NIGHT = makeColors(NIGHT_COLORS)

/** The scene's own moment each button shows. */
const MOMENT_OF: Record<Slot, keyof typeof MOMENTS> = { day: 'day', sunset: 'sunset', night: 'night' }

/**
 * The hour of the scene's moment for `slot` (night: well before dawn; day: mid-morning; sunset:
 * just before the sun sets) on the day of `ms`. The sky is drawn for that hour; the panel
 * rewrites the scene every few minutes, so its day cycle never runs on past it.
 */
export function skyTimeOf(ms: number, slot: Slot = 'night'): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  const [ref, offset] = (MOMENTS[MOMENT_OF[slot]] ?? ['r', -160]) as [string, number]
  const sun = sunTimes(ms)
  return d.getTime() + ((ref === 's' ? sun.set : sun.rise) + offset) * 60_000
}

/** The look at `ms`, held at `slot`: its colours, and the glass tinted from that sky. */
export function sunfieldLookAt(ms: number, slot: Slot = 'night'): ThemeSetArgs {
  const pane = paneAt(skyTimeOf(ms, slot))
  return {
    colors: (pane.dark ? NIGHT : DAY).theme,
    overrideColorScheme: pane.dark ? 'dark' : 'light',
    backdrop: { scene: SUNFIELD_SCENE, glass: { blur: BLUR, tint: pane.tint, opacity: pane.opacity } },
  }
}

/**
 * The scene written for `ms`: its sky set to `slot`, its motion (clouds, birds, the plane, the
 * swaying flowers) to the real time, so a rewrite carries on where it was instead of jumping back.
 */
export function sunfieldSvgAt(ms: number, slot: Slot = 'night'): string {
  const held = skyTimeOf(ms, slot)
  const svg = sceneAt(SCENE, held)
  // sceneAt writes '--t:-<sky>s;--m:-<motion>s', both counted from `held`: move the motion on by
  // the time between `held` and now.
  const t = Math.round((secondsOfDay(held) + 0.2) * 20) / 20
  const head = '--t:-' + t + 's;--m:'
  const at = svg.indexOf(head)
  if (at < 0) return svg
  const end = svg.indexOf('s', at + head.length)
  const motion = -Number(svg.slice(at + head.length, end))
  if (!Number.isFinite(motion)) return svg
  const real = Math.max(0, Math.round((motion + (ms - held) / 1000) * 20) / 20)
  return svg.slice(0, at + head.length) + -real + svg.slice(end)
}
