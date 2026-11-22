/**
 * Flightdeck colours. The HUD and the side panel take their colours from the theme the app is
 * showing: each known theme has three accent colours picked from its art and a dark ground in
 * its hue; the moment of the day (Day, Sunset, Night) tints the ground a little and gives the
 * theme card its colour strip. With no theme, or one this file doesn't know, the HUD keeps its
 * original amber, cyan and pink.
 */

import type { Look } from '../types'

export type Palette = {
  bg: string
  edge: string
  /** Labels, headers and the dashed rail (the original amber). */
  amber: string
  amberDim: string
  amberDeep: string
  muted: string
  /** Big numbers and the first legend group (the original cyan). */
  cyan: string
  cyanDeep: string
  /** The portrait frame and the third legend group (the original pink). */
  pink: string
  red: string
  redDeep: string
  text: string
  /** The portrait as a duotone, dark to light; absent keeps the purple portrait. */
  duo?: readonly [string, string]
}

/** The original Flightdeck colours, used with no theme. */
export const DEFAULT: Palette = {
  bg: '#0a0c14',
  edge: '#1b1f2e',
  amber: '#e8a33a',
  amberDim: '#7a5a24',
  amberDeep: '#2b220e',
  muted: '#c09a5c',
  cyan: '#3ee6ee',
  cyanDeep: '#10313a',
  pink: '#ff4fa3',
  red: '#ff5a72',
  redDeep: '#3a1424',
  text: '#f2eef8',
}

export type Moment = { name: string; tint: string; dark: boolean; wash: readonly string[] }

export type ThemeInfo = {
  name: string
  bg: string
  /** Labels and rails. */
  primary: string
  /** Big numbers. */
  secondary: string
  /** Portrait frame and highlights. */
  tertiary: string
  /** Each moment of the day, matched by its glass tint; the wash is its scene top to bottom. */
  moments: readonly Moment[]
  /** Keep the HUD's original neon colours (DEFAULT) under this theme rather than its own. */
  original?: true
}

export const THEMES: Readonly<Record<string, ThemeInfo>> = {
  'cloud-sea': {
    name: 'Cloud Sea',
    bg: '#0c1424',
    primary: '#8ec5ff',
    secondary: '#a4e886',
    tertiary: '#ffa8c8',
    moments: [
      { name: 'Day', tint: '#d7e3f4', dark: false, wash: ['#3358a7', '#3e74c1', '#84abd7', '#adbfda', '#8ea5b3'] },
      { name: 'Sunset', tint: '#3a182b', dark: true, wash: ['#342256', '#62326c', '#b36c73', '#7a4b6d', '#623c67'] },
      { name: 'Night', tint: '#142038', dark: true, wash: ['#0b1329', '#101e3a', '#283b5a', '#3c4b67', '#33405a'] },
    ],
  },
  'deep-reef': {
    name: 'Deep Reef',
    bg: '#04161e',
    primary: '#5fe6e6',
    secondary: '#ffb35c',
    tertiary: '#ff6fa5',
    moments: [{ name: 'All day', tint: '#053343', dark: true, wash: ['#84dde6', '#58bbd6', '#398ebb', '#266a9d', '#436d8d'] }],
  },
  'gas-station': {
    name: 'Gas Station',
    bg: '#110e1a',
    primary: '#ff5c7c',
    secondary: '#58d5ff',
    tertiary: '#ffc857',
    moments: [
      { name: 'Day', tint: '#dbe2ed', dark: false, wash: ['#2d6fbd', '#4689ce', '#7ea0bd', '#adb2b0', '#94918a'] },
      { name: 'Sunset', tint: '#411b23', dark: true, wash: ['#4e4288', '#86578c', '#b77f6a', '#a8785e', '#86584a'] },
      { name: 'Night', tint: '#272024', dark: true, wash: ['#0b132c', '#101e40', '#283857', '#404454', '#4e403a'] },
    ],
  },
  'hill-village': {
    name: 'Hill Village',
    bg: '#131722',
    primary: '#f4a65c',
    secondary: '#8fc7ff',
    tertiary: '#e76f5f',
    moments: [
      { name: 'Sunrise', tint: '#f4dad7', dark: false, wash: ['#814f96', '#d2818d', '#dba887', '#94655e', '#734948'] },
      { name: 'Day', tint: '#dae2ec', dark: false, wash: ['#518bd1', '#7caadc', '#9db0bf', '#817e75', '#6f6757'] },
      { name: 'Night', tint: '#161d30', dark: true, wash: ['#0d132b', '#17213d', '#293656', '#262d3c', '#25272c'] },
    ],
  },
  'lavender-slope': {
    name: 'Lavender Slope',
    bg: '#121229',
    primary: '#b9a0ff',
    secondary: '#9fd5ff',
    tertiary: '#ff9ec7',
    moments: [
      { name: 'Day', tint: '#dbe1f7', dark: false, wash: ['#5186d3', '#87a7da', '#b4bfd1', '#a19ec7', '#8371a9'] },
      { name: 'Sunset', tint: '#ecd9ed', dark: false, wash: ['#6f6099', '#b482a6', '#bd8ea2', '#a277a3', '#664a8d'] },
      { name: 'Night', tint: '#191c3c', dark: true, wash: ['#0f1434', '#2d3560', '#444c7d', '#32356d', '#2e2e64'] },
    ],
  },
  'mirror-lake': {
    name: 'Mirror Lake',
    bg: '#0a1322',
    primary: '#8db7ff',
    secondary: '#6fd8a2',
    tertiary: '#ff9d8e',
    moments: [
      { name: 'Day', tint: '#d4e2f7', dark: false, wash: ['#3a74d1', '#729ddc', '#6981ad', '#54759c', '#5279ac'] },
      { name: 'Sunset', tint: '#381b33', dark: true, wash: ['#483479', '#945a88', '#714c78', '#694975', '#71466f'] },
      { name: 'Night', tint: '#111d3b', dark: true, wash: ['#0e172d', '#2c3b5d', '#243258', '#1e2b4d', '#232f4b'] },
    ],
  },
  'moon-keep': {
    name: 'Moon Keep',
    bg: '#120f19',
    primary: '#ff6170',
    secondary: '#b5c4e3',
    tertiary: '#e9c47c',
    moments: [{ name: 'All day', tint: '#251f31', dark: true, wash: ['#2b344f', '#5b677e', '#4e5d7a', '#262f48', '#332538'] }],
  },
  'side-street': {
    name: 'Side Street',
    bg: '#14111a',
    primary: '#ffb86b',
    secondary: '#7fcbdc',
    tertiary: '#ff7d6b',
    moments: [
      { name: 'Day', tint: '#dbe1ea', dark: false, wash: ['#4277bc', '#6294bb', '#719896', '#9a998c', '#5c6e86'] },
      { name: 'Evening', tint: '#431d15', dark: true, wash: ['#7a6584', '#b5846f', '#936b54', '#89624e', '#dc9b70'] },
      { name: 'Night', tint: '#281e23', dark: true, wash: ['#111831', '#1a2441', '#1f2942', '#524a49', '#46434d'] },
    ],
  },
  'sunfield': {
    name: 'Sunfield',
    bg: '#0b1530',
    primary: '#ffd23f',
    secondary: '#7cc8ff',
    tertiary: '#93d86c',
    moments: [
      { name: 'Night', tint: '#0e1634', dark: true, wash: ['#040e47', '#07124e', '#081352', '#0b1755', '#101c52'] },
      { name: 'Predawn', tint: '#181d48', dark: true, wash: ['#040e47', '#07124e', '#081352', '#0b1755', '#101c52'] },
      { name: 'Dawn', tint: '#2a2452', dark: true, wash: ['#2e367b', '#4c4075', '#724b6d', '#996062', '#af6e4c'] },
      { name: 'Sunrise', tint: '#2e2648', dark: true, wash: ['#2e367b', '#4c4075', '#724b6d', '#996062', '#af6e4c'] },
      { name: 'Morning', tint: '#cfe3f7', dark: false, wash: ['#056ad2', '#1380e8', '#269afa', '#42b2fe', '#73c5eb'] },
      { name: 'Day', tint: '#cfe5f9', dark: false, wash: ['#056ad2', '#1380e8', '#269afa', '#42b2fe', '#73c5eb'] },
      { name: 'Golden hour', tint: '#efd6c0', dark: false, wash: ['#056ad2', '#1380e8', '#269afa', '#42b2fe', '#73c5eb'] },
      { name: 'Sunset', tint: '#3b2440', dark: true, wash: ['#2e367b', '#4c4075', '#724b6d', '#996062', '#af6e4c'] },
      { name: 'Dusk', tint: '#272450', dark: true, wash: ['#2e367b', '#4c4075', '#724b6d', '#996062', '#af6e4c'] },
      { name: 'Twilight', tint: '#171d46', dark: true, wash: ['#040e47', '#07124e', '#081352', '#0b1755', '#101c52'] },
    ],
  },
  'harbor': {
    name: 'Harbor',
    bg: '#0a1530',
    primary: '#ffc96b',
    secondary: '#7cc4ff',
    tertiary: '#ff7a6b',
    moments: [
      { name: 'Day', tint: '#d5e2f9', dark: false, wash: ['#396dcd', '#548fe1', '#86add9', '#799bb5', '#5a80a2'] },
      { name: 'Sunset', tint: '#3c192b', dark: true, wash: ['#382a69', '#7d487f', '#bc7477', '#a36865', '#936160'] },
      { name: 'Night', tint: '#171a39', dark: true, wash: ['#0f1431', '#1d264b', '#222d54', '#2c3456', '#222848'] },
    ],
  },
  'tide-line': {
    name: 'Tide Line',
    bg: '#140f24',
    primary: '#ffb38a',
    secondary: '#8fd3e8',
    tertiary: '#e58fd0',
    moments: [
      { name: 'Sunrise', tint: '#31203f', dark: true, wash: ['#303d78', '#5f5892', '#ad819c', '#736b97', '#574f7c'] },
      { name: 'Sunset', tint: '#3d1824', dark: true, wash: ['#2a1d4e', '#622f64', '#ba5e61', '#7a4863', '#6c3c55'] },
      { name: 'Night', tint: '#131b33', dark: true, wash: ['#080d24', '#101a38', '#162345', '#162034', '#0e1422'] },
    ],
  },
  'sunbeam-wood': {
    name: 'Sunbeam Wood',
    bg: '#0d1a12',
    primary: '#e6e48a',
    secondary: '#8fd6a0',
    tertiary: '#ffc27a',
    moments: [
      { name: 'Morning', tint: '#e3e2ce', dark: false, wash: ['#868861', '#aaa575', '#b1ae7f', '#cac291', '#787f4e'] },
      { name: 'Day', tint: '#dce5d2', dark: false, wash: ['#a3b68c', '#b5c79c', '#abc094', '#b9c99c', '#718550'] },
      { name: 'Night', tint: '#0d2237', dark: true, wash: ['#3c5169', '#475e7c', '#3d546f', '#445e77', '#2a3b3d'] },
    ],
  },
  'rainy-window': {
    name: 'Rainy Studio',
    bg: '#0e1116',
    primary: '#e9b55c',
    secondary: '#8db8da',
    tertiary: '#d4906a',
    moments: [{ name: 'Rain', tint: '', dark: true, wash: ['#2a3442', '#3b4a5c', '#55687a', '#3a3530', '#5a3f2c'] }],
    original: true,
  },
}

const rgb = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) as [number, number, number]
const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')

/** `a` moved toward `b` by `t` (0 keeps `a`, 1 is `b`). */
export function mix(a: string, b: string, t: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a
  const x = rgb(a)
  const y = rgb(b)
  return '#' + x.map((v, i) => hex2(v + ((y[i] ?? v) - v) * t)).join('')
}

/** The theme a look names, when this file knows it. */
export const themeOf = (look: Look | null): ThemeInfo | undefined => (look?.scene ? THEMES[look.scene] : undefined)

/** The moment a look's glass tint names, else the theme's first. */
export function momentOf(theme: ThemeInfo, look: Look | null): Moment {
  const tint = look?.tint?.toLowerCase()
  return theme.moments.find(m => m.tint !== '' && m.tint.toLowerCase() === tint) ?? theme.moments[0]!
}

/** The colours for a look: the theme's, its ground tinted by the moment; else the original. */
export function paletteOf(look: Look | null): Palette {
  const theme = themeOf(look)
  if (!theme || theme.original) return DEFAULT
  const moment = momentOf(theme, look)
  const bg = moment.tint ? mix(theme.bg, moment.tint, moment.dark ? 0.1 : 0.04) : theme.bg
  return {
    bg,
    edge: mix(bg, theme.primary, 0.16),
    amber: theme.primary,
    amberDim: mix(theme.primary, bg, 0.5),
    amberDeep: mix(theme.primary, bg, 0.82),
    muted: mix(theme.primary, '#e6e6e6', 0.4),
    cyan: theme.secondary,
    cyanDeep: mix(theme.secondary, bg, 0.8),
    pink: theme.tertiary,
    red: DEFAULT.red,
    redDeep: DEFAULT.redDeep,
    text: '#f2eef8',
    duo: [mix(bg, theme.secondary, 0.18), mix(theme.primary, '#ffffff', 0.35)],
  }
}

/** The theme card's words and colours for a look. */
export function cardOf(look: Look | null): { name: string; moment: string; wash: readonly string[] } {
  const theme = themeOf(look)
  if (theme) {
    const m = momentOf(theme, look)
    return { name: theme.name, moment: m.name, wash: m.wash }
  }
  if (look?.scene) {
    const tint = look.tint && /^#[0-9a-f]{6}$/i.test(look.tint) ? look.tint : '#3a3f55'
    return { name: look.scene.replace(/[-_]+/g, ' '), moment: look.plugin ?? '', wash: [mix(tint, '#000000', 0.3), tint, mix(tint, '#ffffff', 0.2)] }
  }
  return { name: 'App default', moment: 'No theme', wash: ['#1b1f2e', '#2b2f44', '#1b1f2e'] }
}
