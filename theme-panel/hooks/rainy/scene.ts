// The scene behind the conversation in the Desktop and mobile apps: Clawd's
// room on a rainy day, printed in halftone. Every object is round dots on one
// grid, big dots where a shape is solid and smaller ones toward its edges,
// over flat washes of color.
//
// It is mirrored around the conversation, which covers the middle, and each
// side has an outer and an inner group, so the margins look full whether the
// sidebar is open or closed and as the window widens. Right, outer: the rainy
// window, a radiator, a shelf with candles and a teapot, and Clawd at the desk,
// turned a little and typing on his laptop. Right, inner: a wall clock and an
// arc lamp. Left, inner: a leaf print, a shelf of records, a desk lamp and a
// record player. Left, outer: a hanging pothos, a guitar and a speaker. String
// lights run along the top and the desk along the bottom. Clawd is the only
// mascot.
//
// It's one drawing that never changes, animated with SMIL, SVG's own
// animation. The desktop app moves a backdrop only if it passes the app's
// check (see BASE_STYLE), and otherwise draws a still copy. The drawing has
// no viewBox: its units are the window's own pixels, anchored to the window's
// edges by nested svgs. Both palettes follow the app's text color (see
// `themed`). There are no words in it.

import { clawdSheet } from './clawd/sheet'

// The prompt box's bottom edge sits about this far above the window's bottom,
// and the desk's top this far.
const SILL = 31
const DESK = 64
// The dot grid: one dot every 6px, its radius set by density, from a full dot
// (0) to a speck (4).
const PITCH = 6
const RADII = [2.6, 2.1, 1.6, 1.15, 0.75]

// The right side keeps this much empty wall between it and the window's edge.
const PAD = 30
// The window's glass, in the top right, measured from the right edge.
const GX = -204
const GY = 112
const GW = 168
const GH = 220
// The two shelves, over Clawd and over the lamp, sit this far down the window.
const SHELF_AT = '62%'
// Rain falls through two tiles: near and far.
const NEAR = 192
const FAR = 144

const LIGHT: Record<string, string> = {
  top: '#F2ECE2', mid: '#EFE7DB', bottom: '#EEDFCA', cool: '#BCC8EE', rose: '#EFC9D6', warm: '#F7C48A', floor: '#F3D3B1',
  tex: '#DDD1BE', shade: '#D8C6AA',
  winTop: '#A9BEEC', winBot: '#E1E9F8', sky: '#5664D6', hill: '#7286D0', hill2: '#5464BE', tree: '#3E4B9E', sun: '#F2A35E', moon: '#F3ECD8', star: '#E9E1CE',
  rain: '#5E6BAE', glass: '#FFFFFF',
  frame: '#4A4E8C', curtain: '#E3A39B', curtainDark: '#C27C74', tie: '#F2A25C', leaf: '#4E8A52', leaf2: '#86B672', pot: '#C9765A',
  mat: '#F8F3EA', print: '#E8A3A6',
  deskTop: '#DCC6A2', deskDot: '#C4A67D', deskFront: '#C2A47C', deskLine: '#8E7048', drawer: '#E4CFAA',
  lamp: '#F2A25C', lampOff: '#B9A58C', metal: '#4A4E8C', bulb: '#FFD38A', box: '#A9815E', vinyl: '#2A2633', label: '#F2A25C', note: '#4A4E8C',
  wire: '#7A7488', puff: '#8E8AA6', mug: '#FFFDF8', rad: '#8E97C2', sleeveA: '#E8A3A6', sleeveB: '#7D92D8', wax: '#EFC7A8', flame: '#F29A4A', guitar: '#D7894E',
  ao: '#C9B596',
}
const DARK: Record<string, string> = {
  top: '#13152E', mid: '#181A35', bottom: '#221A35', cool: '#3B4AB8', rose: '#7A3F8C', warm: '#F2A25C', floor: '#C9704A',
  tex: '#20234A', shade: '#33284F',
  winTop: '#0B1030', winBot: '#28326E', sky: '#4552B8', hill: '#222A62', hill2: '#181E4C', tree: '#10153A', sun: '#F3ECD8', moon: '#F3ECD8', star: '#E9E1CE',
  rain: '#9AA6E8', glass: '#C9D2FF',
  frame: '#7D84CC', curtain: '#9A5E78', curtainDark: '#6E4058', tie: '#D98A4A', leaf: '#4C8058', leaf2: '#6FA06C', pot: '#A85E46',
  mat: '#1C1F3E', print: '#A06A88',
  deskTop: '#3A2D4C', deskDot: '#54436C', deskFront: '#241C35', deskLine: '#7C6AA2', drawer: '#43375C',
  lamp: '#F6B25E', lampOff: '#5A4E6E', metal: '#7D84CC', bulb: '#FFC774', box: '#6E5888', vinyl: '#0D0F22', label: '#F2A25C', note: '#F3E6CB',
  wire: '#4A4570', puff: '#D9D3F0', mug: '#F4E8D8', rad: '#535C99', sleeveA: '#A06A88', sleeveB: '#4E5FAE', wax: '#E9DCC8', flame: '#FFB25E', guitar: '#B5703F',
  ao: '#020208',
}

// The app checks a backdrop before it lets it move: no media queries but
// reduced motion's, no viewport units, a short list of CSS functions. So the
// scene can't ask `prefers-color-scheme` which palette to use. Instead it reads
// the app's text color, which the app sets on the drawing (`currentColor`):
// dark ink in light mode, cream in dark mode. Each palette color is a relative
// color from it, moving from its light value to its dark one as the text gets
// lighter.
function toOklch(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const [r, g, b] = [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const h = (Math.atan2(B, A) * 180) / Math.PI
  return [L, Math.hypot(A, B), h < 0 ? h + 360 : h]
}
// How dark the window is, from the text's lightness `l`: 0 in light mode, 1 in dark.
const NIGHT = 'clamp(0, (l - .35) / .45, 1)'
const f4 = (v: number) => (Math.round(v * 10000) / 10000).toString()
function themed(light: string, dark: string, alpha = '') {
  const [l1, c1, h0] = toOklch(light)
  const [l2, c2, h3] = toOklch(dark)
  // A pure gray has no hue of its own, so it borrows the other's.
  const h1 = c1 < 0.002 ? h3 : h0
  const h2 = c2 < 0.002 ? h0 : h3
  let dh = h2 - h1
  if (dh > 180) dh -= 360
  if (dh < -180) dh += 360
  const ch = (a: number, d: number) => (Math.abs(d) < 1e-4 ? f4(a) : `calc(${f4(a)} + ${f4(d)} * ${NIGHT})`)
  return `oklch(from currentColor ${ch(l1, l2 - l1)} ${ch(c1, c2 - c1)} ${ch(h1, dh)}${alpha ? ` / ${alpha}` : ''})`
}
const PALETTE = Object.keys(LIGHT)
  .map(k => `--${k}:${themed(LIGHT[k] as string, DARK[k] as string)}`)
  // The sun shows by day, the moon and stars by night.
  .concat([`--daySun:${themed('#F2A35E', '#F2A35E', `calc(1 - ${NIGHT})`)}`, `--moon:${themed('#F3ECD8', '#F3ECD8', NIGHT)}`, `--star:${themed('#E9E1CE', '#E9E1CE', NIGHT)}`])
  .join(';')
const PAINT = [
  'tex', 'shade', 'sky', 'hill', 'hill2', 'tree', 'sun', 'daySun', 'moon', 'star', 'rain', 'glass', 'frame', 'curtain', 'curtainDark', 'tie',
  'leaf', 'leaf2', 'pot', 'mat', 'print', 'deskTop', 'deskDot', 'deskFront', 'deskLine', 'drawer', 'lamp', 'lampOff', 'metal', 'bulb', 'box', 'vinyl',
  'label', 'note', 'wire', 'warm', 'puff', 'mug', 'rad', 'sleeveA', 'sleeveB', 'wax', 'flame', 'guitar', 'ao',
]
const STOPS = ['top', 'mid', 'bottom', 'winTop', 'winBot', 'cool', 'rose', 'warm', 'floor', 'bulb', 'ao']

// Everything that moves is SMIL, SVG's own animation elements: the desktop
// app's frame runs them and not CSS animation. Each helper wraps a group in a
// loop; a negative delay starts it partway through, so copies fall out of step.
const loop = (dur: number, delay = 0) => `dur="${dur}s" repeatCount="indefinite"${delay ? ` begin="${delay.toFixed(2)}s"` : ''}`
// Slide a group by (dx, dy) and jump back, optionally fading out as it goes.
const drift = (inner: string, dx: number, dy: number, dur: number, delay = 0, fade = false) =>
  `<g><animateTransform attributeName="transform" type="translate" from="0 0" to="${dx} ${dy}" ${loop(dur, delay)}/>` +
  (fade ? `<animate attributeName="opacity" from="1" to="0" ${loop(dur, delay)}/>` : '') +
  `${inner}</g>`
// Switch a group's opacity through values, evenly spaced.
const blink = (inner: string, values: string, dur: number, delay = 0) =>
  `<g><animate attributeName="opacity" values="${values}" calcMode="discrete" ${loop(dur, delay)}/>${inner}</g>`
// Turn a group about (cx, cy) through angles, smoothly or in ticks.
const turn = (inner: string, angles: number[], cx: number, cy: number, dur: number, discrete = false) =>
  `<g><animateTransform attributeName="transform" type="rotate" values="${angles.map(a => `${a} ${cx} ${cy}`).join(';')}"${discrete ? ' calcMode="discrete"' : ''} ${loop(dur)}/>${inner}</g>`
// Scale a group about (cx, cy) through factors.
const pulse = (inner: string, scales: string, cx: number, cy: number, dur: number, delay = 0) =>
  `<g transform="translate(${cx} ${cy})"><g><animateTransform attributeName="transform" type="scale" values="${scales}" calcMode="discrete" ${loop(dur, delay)}/><g transform="translate(${-cx} ${-cy})">${inner}</g></g></g>`

const BASE_STYLE = [
  `svg{${PALETTE}}`,
  PAINT.map(k => `.f-${k}{fill:var(--${k})}.s-${k}{stroke:var(--${k})}`).join(''),
  STOPS.map(k => `.s-${k}{stop-color:var(--${k})}`).join(''),
  '.o-cool{opacity:.43}.o-rose{opacity:.3}.o-floor{opacity:.4}.o-warm{opacity:.52}.o-tex{opacity:.5}',
].join('')

// A stable pseudo-random number in [0, 1) for index i.
function nz(i: number) {
  let n = Math.imul(i ^ 0x9e3779b9, 2654435761)
  n ^= n >>> 15
  return ((n >>> 0) % 10000) / 10000
}

const r = (x: number, y: number, w: number, h: number, cls: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"${extra ? ' ' + extra : ''}/>`
const c = (x: number, y: number, rad: number, cls: string, extra = '') =>
  `<circle cx="${x}" cy="${y}" r="${rad}"${cls ? ` class="${cls}"` : ''}${extra ? ' ' + extra : ''}/>`
const e = (x: number, y: number, rx: number, ry: number, cls: string) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="${cls}"/>`
// Anchors: a point on the window's edge that a group draws from.
const at = (x: string, y: string, inner: string) => `<svg x="${x}" y="${y}" width="1" height="1" overflow="visible">${inner}</svg>`
// Print shapes in the grid's dots at a density, from 0 (full dots) to 4. Each
// shape's paint becomes a pattern: a 6px tile holding one dot of that size in
// that paint. (Masks would do the same, but the app times each frame of a
// moving backdrop and holds a slow one still, and a hundred masks are slow.)
const DOTS = new Map<string, string>()
function dotPaint(density: number, paint: string) {
  const key = `${density}|${paint}`
  let id = DOTS.get(key)
  if (id === undefined) {
    id = `p${DOTS.size}`
    DOTS.set(key, id)
  }
  return `url(#${id})`
}
const dotted = (density: number, inner: string) =>
  inner
    .replace(/class="([fs])-([A-Za-z0-9]+)"/g, (_, kind: string, name: string) => `${kind === 'f' ? 'fill' : 'stroke'}="${dotPaint(density, `var(--${name})`)}"`)
    .replace(/style="fill:([^";]+)"/g, (_, paint: string) => `fill="${dotPaint(density, paint)}"`)
    .replace(/ fill="(#[0-9A-Fa-f]{3,8})"/g, (_, paint: string) => ` fill="${dotPaint(density, paint)}"`)
function dotPatterns() {
  let o = ''
  for (const [key, id] of DOTS) {
    const [density, paint] = key.split('|') as [string, string]
    o += `<pattern id="${id}" width="${PITCH}" height="${PITCH}" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="${RADII[Number(density)]}" style="fill:${paint}"/></pattern>`
  }
  return o
}
// A line of dots, one every grid step.
const dline = (d: string, cls: string, width = 4.6) => `<path d="${d}" class="${cls}" fill="none" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0 ${PITCH}"/>`
// A shape that dissolves at its edge: full dots at its heart, then smaller
// ones in rings around it. `shape(k)` draws it grown by a factor k, and each
// ring is [k, density], outermost first.
const halftone = (shape: (k: number) => string, rings: [number, number][] = [[1.5, 3], [1.25, 2], [1, 0]]) =>
  rings.map(([k, density]) => dotted(density, shape(k))).join('')

// Clawd's masks: his own grid of one dot per pixel, at the same pitch once he
// is drawn six times his size. His frames are many shapes in many colors, so
// one mask over them all is cheaper than a pattern for each.
function masks() {
  const own = 'maskUnits="userSpaceOnUse" x="-40" y="-40" width="110" height="80"'
  let o = ''
  RADII.forEach((rad, k) => {
    if (k === 1 || k === 4) return
    o += `<pattern id="pc${k}" width="1" height="1" patternUnits="userSpaceOnUse"><circle cx=".5" cy=".5" r="${(rad / PITCH).toFixed(3)}" fill="#fff"/></pattern>`
    o += `<mask id="c${k}" ${own}><rect x="-40" y="-40" width="110" height="80" fill="url(#pc${k})"/></mask>`
  })
  return o
}

// Rain: streaks of small dots, tiled so a pattern height of fall loops.
function rainPattern(id: string, w: number, h: number, n: number, len: number, width: number, gap: number, seed: number) {
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = Math.round(nz(seed + i) * w)
    const y = Math.round(nz(seed + 40 + i) * h)
    d += `M${x} ${y}v${len}`
    if (y + len > h) d += `M${x} ${y - h}v${len}`
  }
  return `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"><path d="${d}" class="s-rain" stroke-width="${width}" stroke-linecap="round" stroke-dasharray="0 ${gap}"/></pattern>`
}

function defs() {
  const radial = (id: string, stop: string, cx = 0.5, cy = 0.5, rad = 0.5) =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${rad}"><stop offset="0" class="${stop}"/><stop offset=".45" class="${stop}" stop-opacity=".42"/><stop offset="1" class="${stop}" stop-opacity="0"/></radialGradient>`
  return (
    '<defs>' +
    '<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s-top"/><stop offset=".55" class="s-mid"/><stop offset="1" class="s-bottom"/></linearGradient>' +
    '<linearGradient id="winSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s-winTop"/><stop offset="1" class="s-winBot"/></linearGradient>' +
    radial('gCool', 's-cool', 0.9, 0.2, 0.6) +
    radial('gRose', 's-rose', 0.12, 0.14, 0.55) +
    radial('gFloor', 's-floor', 0.5, 1.05, 0.7) +
    radial('gWarm', 's-warm') +
    radial('gBulb', 's-bulb') +
    `<pattern id="tex" width="${PITCH}" height="${PITCH}" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".8" class="f-tex"/></pattern>` +
    masks() +
    dotPatterns() +
    rainPattern('rainNear', 132, NEAR, 18, 18, 2.2, 5, 500) +
    rainPattern('rainFar', 96, FAR, 16, 10, 1.4, 4, 700) +
    `<clipPath id="glass"><rect x="${GX}" y="${GY}" width="${GW}" height="${GH}"/></clipPath>` +
    '</defs>'
  )
}


// The view through the window: a halftone sky, the sun or the moon and stars,
// a cloud, hills and trees, two layers of rain and drops on the glass.
function windowView() {
  let v = r(GX, GY, GW, GH, '', 'fill="url(#winSky)"')
  v += dotted(2, r(GX, GY, GW, 36, 'f-sky')) + dotted(3, r(GX, GY + 36, GW, 42, 'f-sky')) + dotted(4, r(GX, GY + 78, GW, 48, 'f-sky'))
  v += halftone(k => c(-150, 168, 18 * k, 'f-daySun'), [[1.9, 4], [1.45, 2], [1, 0]])
  let stars = ''
  for (let i = 0; i < 7; i++) {
    const x = GX + 12 + Math.floor(nz(600 + i) * (GW - 24))
    const y = GY + 10 + Math.floor(nz(620 + i) * 96)
    stars += blink(c(x, y, 1.6, 'f-star'), '1;.4', 3, -(i % 3))
  }
  const shooting =
    `<g opacity="0"><animate attributeName="opacity" values="0;1;0" keyTimes="0;.9;.97" calcMode="discrete" ${loop(18)}/>` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;-18 8;-36 16;-54 24" keyTimes="0;.917;.933;.95" calcMode="discrete" ${loop(18)}/>` +
    `${dline(`M-64 128l-18 8`, 's-star', 2.4)}</g>`
  v += halftone(k => c(-82, 156, 15 * k, 'f-moon'), [[1.9, 4], [1.45, 2], [1, 0]]) + stars + shooting
  v += `<g><animateTransform attributeName="transform" type="translate" values="0 0;24 0;0 0" ${loop(60)}/>${halftone(k => e(-128, 186, 46 * k, 13 * k, 'f-glass'), [[1.3, 4], [1.12, 3], [1, 2]])}</g>`
  v += dotted(1, `<path d="M${GX} ${GY + GH}V${GY + 168}Q-170 ${GY + 148} -136 ${GY + 160}T-72 ${GY + 154}T${GX + GW} ${GY + 164}V${GY + GH}Z" class="f-hill"/>`)
  v += dotted(0, `<path d="M${GX} ${GY + GH}V${GY + 192}Q-160 ${GY + 176} -112 ${GY + 190}T${GX + GW} ${GY + 184}V${GY + GH}Z" class="f-hill2"/>`)
  v += dotted(0, [[-188, GY + 186, 9], [-176, GY + 180, 7], [-64, GY + 172, 8], [-52, GY + 178, 6]].map(([x, y, rad]) => c(x as number, y as number, rad as number, 'f-tree')).join(''))
  const fall = (id: string, h: number, s: number, op: number) =>
    drift(`<rect x="${GX}" y="${GY - h}" width="${GW}" height="${GH + h}" fill="url(#${id})" opacity="${op}"/>`, 0, h, s)
  v += fall('rainFar', FAR, 3, 0.45) + fall('rainNear', NEAR, 1.5, 0.85)
  let drops = ''
  for (let i = 0; i < 12; i++) {
    const x = GX + 8 + Math.floor(nz(500 + i) * (GW - 16))
    const y = GY + 8 + Math.floor(nz(520 + i) * (GH - 48))
    const drop = c(x, y, nz(540 + i) < 0.35 ? 2.6 : 1.8, 'f-glass', 'opacity=".55"') + c(x - 0.7, y - 0.7, 0.8, 'f-glass')
    drops += i % 3 === 0 ? drift(drop, 0, 84, Math.round(8 + nz(560 + i) * 8), -Math.round(nz(580 + i) * 12)) : drop
  }
  return `<g clip-path="url(#glass)">${v}${drops}</g>`
}

// The window's frame, sill and a cactus on it, and the curtains.
function windowFrame() {
  let o = dotted(0, `<path d="M${GX - 12} ${GY - 12}h${GW + 24}v${GH + 24}h-${GW + 24}z M${GX} ${GY}v${GH}h${GW}v-${GH}z" fill-rule="evenodd" class="f-frame"/>`)
  o += dline(`M${GX + GW / 2} ${GY + 3}v${GH - 6}M${GX + 3} ${GY + GH / 2}h${GW - 6}`, 's-frame', 4.4)
  // The sill, and the shade under it.
  o += dotted(0, r(GX - 24, GY + GH + 12, GW + 48, 12, 'f-frame')) + dotted(3, r(GX - 18, GY + GH + 24, GW + 36, 12, 'f-frame'))
  // A cactus in a pot at one end of the sill.
  const base = GY + GH + 12
  o += dotted(0, `<rect x="${GX + 12}" y="${base - 46}" width="12" height="36" rx="6" class="f-leaf"/><rect x="${GX + 2}" y="${base - 36}" width="9" height="16" rx="4.5" class="f-leaf"/><rect x="${GX + 25}" y="${base - 40}" width="9" height="14" rx="4.5" class="f-leaf"/>`)
  o += dotted(0, `<path d="M${GX + 4} ${base - 12}h28l-4 12h-20z" class="f-pot"/>`)
  // The rod and two curtains gathered with ties.
  o += dline(`M${GX - 54} 92H-6`, 's-frame', 5) + dotted(0, c(GX - 58, 92, 6, 'f-frame'))
  // Each curtain: mid dots for the cloth, full dots down its folds.
  const curtain = (d: string, folds: string, tie: string) =>
    dotted(2, `<path d="${d}" class="f-curtain"/>`) +
    dotted(0, `<path d="${folds}" class="s-curtainDark" stroke-width="10" fill="none" stroke-linecap="round"/>`) +
    dotted(0, tie)
  const lx = GX - 4
  o += curtain(
    `M${lx - 46} 96H${lx + 6}Q${lx - 2} 216 ${lx - 18} 262Q${lx - 6} 316 ${lx - 12} 380H${lx - 46}Z`,
    `M${lx - 34} 100Q${lx - 34} 216 ${lx - 28} 260M${lx - 34} 274Q${lx - 36} 324 ${lx - 34} 374`,
    r(lx - 44, 256, 30, 12, 'f-tie'),
  )
  const rx = GX + GW + 4
  o += curtain(
    `M${rx - 6} 96H0V380H${rx + 12}Q${rx + 18} 316 ${rx + 24} 262Q${rx + 8} 216 ${rx - 6} 96Z`,
    `M${rx + 14} 100Q${rx + 14} 212 ${rx + 20} 260M${rx + 20} 274Q${rx + 22} 324 ${rx + 20} 374`,
    r(rx + 8, 256, 28, 12, 'f-tie'),
  )
  return o
}

// Under the window: a radiator, warm air rising off it.
function radiator() {
  const y = GY + GH + 34
  const x0 = GX - 2
  const w = GW + 4
  let fins = ''
  for (let x = x0 + 4; x + 10 <= x0 + w; x += 14) fins += `<rect x="${x}" y="${y}" width="10" height="50" rx="5" class="f-rad"/>`
  let o = dotted(1, fins) + dotted(0, r(x0, y + 6, w, 6, 'f-rad') + r(x0, y + 38, w, 6, 'f-rad')) + dotted(0, r(x0 + 6, y + 50, 8, 8, 'f-rad') + r(x0 + w - 14, y + 50, 8, 8, 'f-rad'))
  o += [0, 1, 2].map(i => drift(dline(`M${x0 + 30 + i * 52} ${y - 6}q6 -8 0 -16q-6 -8 0 -16`, 's-warm', 2.6), 0, -18, 3, -i, true)).join('')
  return o
}

// Above Clawd: a shelf with two candles and a teapot letting off steam.
function candleShelf() {
  const y = 0
  let o = dotted(0, r(-226, y, 190, 8, 'f-box')) + dline(`M-212 ${y + 10}l10 14M-50 ${y + 10}l-10 14`, 's-box', 3.6)
  const candle = (x: number, h: number, delay: number) =>
    dotted(0, r(x, y - h, 14, h, 'f-wax')) +
    dotted(3, r(x - 3, y - h, 20, 4, 'f-wax')) +
    dotted(4, c(x + 7, y - h - 10, 16, 'f-flame')) +
    pulse(dotted(0, `<path d="M${x + 7} ${y - h - 18}q-5 8 0 12q5 -4 0 -12z" class="f-flame"/>`), '1 1;1 .8;1 1.15', x + 7, y - h - 6, 1, delay)
  o += candle(-208, 30, 0) + candle(-186, 20, -0.33)
  // The teapot.
  const tx = -108
  o += dline(`M${tx - 18} ${y - 16}L${tx - 34} ${y - 30}`, 's-sleeveB', 5) + dline(`M${tx + 16} ${y - 26}q14 6 0 20`, 's-sleeveB', 4)
  o += halftone(k => e(tx, y - 16, 20 * k, 15 * k, 'f-sleeveB'), [[1.15, 3], [1, 0]])
  o += dotted(1, e(tx, y - 31, 9, 4, 'f-sleeveB')) + dotted(0, c(tx, y - 37, 3.5, 'f-label'))
  o += [0, 1].map(i => drift(dline(`M${tx - 36} ${y - 36}q-5 -7 0 -13q5 -7 0 -13`, 's-puff', 2.4), 0, -18, 2.5, -i * 1.25, true)).join('')
  return o
}

// The right margin's inner side, which shows as the margin widens, centered
// between the window and the conversation: a wall clock, its hands moving,
// over a standing lamp.
const IX = -380
// A hand's sixty steps around the dial.
const TICKS = Array.from({ length: 60 }, (_, i) => i * 6)
function clock() {
  const x = IX
  const y = 178
  let o = dotted(2, c(x, y, 46, 'f-mat')) + dotted(0, `<circle cx="${x}" cy="${y}" r="48" fill="none" class="s-frame" stroke-width="9"/>`)
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2
    o += c(Math.round(x + Math.sin(a) * 34), Math.round(y - Math.cos(a) * 34), h % 3 ? 1.8 : 3, 'f-frame')
  }
  const hand = (len: number, deg: number, period: number, cls: string, width: number) =>
    `<g transform="translate(${x} ${y}) rotate(${deg})">${turn(dline(`M0 0V${-len}`, cls, width), TICKS, 0, 0, period, true)}</g>`
  o += hand(22, 300, 43200, 's-frame', 4.6) + hand(32, 60, 3600, 's-frame', 4)
  o += `<g transform="translate(${x} ${y})">${turn('<path d="M0 6V-38" class="s-flame" stroke-width="1.6"/>', TICKS, 0, 0, 60, true)}</g>` + c(x, y, 3.5, 'f-flame')
  return o
}

// A standing lamp under the clock, its drum shade lit, on a stand behind the
// desk; a pencil cup on the desk beside it.
function floorLamp() {
  let o = dline(`M${IX} -40V-404`, 's-metal', 5) + dotted(0, e(IX, -44, 24, 6, 'f-metal'))
  o += dotted(4, `<path d="M${IX - 30} -384L${IX + 30} -384L${IX + 62} -60L${IX - 62} -60Z" class="f-lamp"/>`) + dotted(3, `<path d="M${IX - 20} -384L${IX + 20} -384L${IX + 34} -60L${IX - 34} -60Z" class="f-lamp"/>`)
  o += halftone(k => `<path transform="translate(${IX} -404) scale(${k})" d="M-24 -22H24L32 20H-32Z" class="f-lamp"/>`, [[1.16, 3], [1, 0]])
  o += dotted(0, c(IX, -380, 6, 'f-bulb'))
  return o
}

function pencilCup() {
  const x = -334
  return (
    dline(`M${x + 6} -30L${x + 2} -58`, 's-lamp', 3.6) +
    dline(`M${x + 12} -30L${x + 14} -64`, 's-sleeveB', 3.6) +
    dline(`M${x + 18} -30L${x + 24} -54`, 's-print', 3.6) +
    dotted(0, r(x, -32, 26, 32, 'f-rad')) +
    dotted(2, r(x, -36, 26, 4, 'f-rad'))
  )
}

// The print on the left wall, across from the window and the same size as
// its frame: a big leaf over a pink sun.
const PX = 302
const PY = GY - 12
const PW = GW + 24
const PH = GH + 24
function leafPrint() {
  let o = dotted(0, `<path d="M${PX} ${PY}h${PW}v${PH}h-${PW}z M${PX + 12} ${PY + 12}v${PH - 24}h${PW - 24}v-${PH - 24}z" fill-rule="evenodd" class="f-frame"/>`)
  o += r(PX + 12, PY + 12, PW - 24, PH - 24, 'f-mat')
  const aw = PW - 52
  const ah = PH - 52
  o += `<svg x="${PX + 26}" y="${PY + 26}" width="${aw}" height="${ah}">`
  o += halftone(k => c(aw * 0.68, ah * 0.27, 26 * k, 'f-print'), [[1.6, 4], [1.3, 2], [1, 1]])
  // The leaf, a broad heart shape split by its veins, on a stem. The tilt is
  // on each shape, so its dots stay on the grid.
  const tilt = `translate(${aw * 0.44} ${ah * 0.6}) rotate(-18)`
  const leaf = (k: number) =>
    `<path transform="${tilt} scale(${k})" d="M0 -52C30 -52 46 -27 43 0C41 27 20 45 0 52C-20 45 -41 27 -43 0C-46 -27 -30 -52 0 -52Z" class="f-leaf"/>`
  o += halftone(leaf, [[1.14, 3], [1, 1], [0.6, 0]])
  o += `<path transform="${tilt}" d="M0 -50V52M0 -24L32 -38M0 -2L40 -6M0 20L32 30M0 -24L-32 -38M0 -2L-40 -6M0 20L-32 30" class="s-mat" stroke-width="3.6" fill="none"/>`
  o += dline(`M${aw * 0.5} ${ah * 0.86}L${aw * 0.53} ${ah}`, 's-leaf2', 3.6)
  o += '</svg>'
  return o
}

// Under the print, level with the shelf across the room: two record sleeves
// leaning on a shelf, and a few more lying flat.
function recordShelf() {
  const y = 0
  let o = dotted(0, r(PX + 4, y, PW - 8, 8, 'f-box')) + dline(`M${PX + 18} ${y + 10}l10 14M${PX + PW - 18} ${y + 10}l-10 14`, 's-box', 3.6)
  const sleeve = (x: number, deg: number, cls: string, disc: string) =>
    dotted(1, `<rect transform="rotate(${deg} ${x + 25} ${y})" x="${x}" y="${y - 50}" width="50" height="50" class="${cls}"/>`) +
    dotted(0, `<circle transform="rotate(${deg} ${x + 25} ${y})" cx="${x + 25}" cy="${y - 25}" r="13" class="${disc}"/>`)
  o += sleeve(PX + 18, -8, 'f-sleeveA', 'f-vinyl') + sleeve(PX + 64, 5, 'f-sleeveB', 'f-sun')
  const fx = PX + PW - 60
  o += dotted(1, r(fx, y - 6, 48, 6, 'f-print') + r(fx + 3, y - 12, 44, 6, 'f-rad')) + dotted(0, r(fx - 2, y - 18, 46, 6, 'f-lamp'))
  return o
}

// The left of the desk, under the print: a desk lamp throwing a cone of warm
// dots, and a record player sending notes up.
const LX = 304
function deskLeft() {
  let o = speaker()
  // The lamp.
  o += dotted(4, `<path d="M${LX + 22} -150L${LX + 88} -150L${LX + 120} -2L${LX - 14} -2Z" class="f-lamp"/>`) + dotted(3, `<path d="M${LX + 34} -150L${LX + 76} -150L${LX + 94} -2L${LX + 14} -2Z" class="f-lamp"/>`)
  o += dotted(0, e(LX + 24, -3, 22, 6, 'f-metal'))
  o += dline(`M${LX + 24} -8L${LX + 12} -78L${LX + 44} -136`, 's-metal', 5)
  o += halftone(k => `<path transform="translate(${LX + 56} -160) scale(${k})" d="M-14 -16h28l18 26h-64z" class="f-lamp"/>`, [[1.18, 3], [1, 0]])
  o += dotted(0, c(LX + 56, -148, 6, 'f-bulb'))
  // The record player.
  const rx = LX + 112
  o += dotted(0, r(rx, -30, 96, 30, 'f-box')) + dotted(2, r(rx, -36, 96, 6, 'f-box'))
  o += dotted(0, c(rx + 82, -15, 4.5, 'f-label'))
  o += dotted(0, e(rx + 42, -40, 34, 8, 'f-vinyl')) + dotted(0, e(rx + 42, -40, 9, 3, 'f-label'))
  o += dline(`M${rx + 86} -34L${rx + 82} -52L${rx + 62} -47`, 's-metal', 3.8)
  o += `<g transform="translate(${rx + 42} -40) scale(1 .24)">${turn(c(25, 0, 3.6, 'f-mat'), [0, 360], 0, 0, 1.5)}</g>`
  const NOTE = ['..x', '..x', '..x', 'xxx', 'xx.']
  const note = (k: number) => {
    let d = ''
    NOTE.forEach((row, y) => [...row].forEach((ch, x) => (d += ch === 'x' ? c(x * 3.2, y * 3.2, 1.5, 'f-note') : '')))
    return `<g transform="translate(${rx + 30 + k * 14} -60)">${drift(d, 14, -66, 4, -k * 1.33, true)}</g>`
  }
  return o + note(0) + note(1) + note(2)
}

// A trailing vine: a dotted stem curving down with small leaves on alternate
// sides.
function vine(x: number, y: number, len: number, bend: number, seed: number) {
  let leaves = ''
  for (let k = 10; k < len; k += 12) {
    const t = k / len
    const lx = x + Math.sin(t * Math.PI) * bend + (Math.floor(k / 12) % 2 ? 5 : -5)
    leaves += c(Math.round(lx), y + k, 4.4 + nz(seed + k) * 1.4, Math.floor(k / 12) % 3 === 1 ? 'f-leaf2' : 'f-leaf')
  }
  return dline(`M${x} ${y}Q${x + bend * 2} ${y + len / 2} ${x} ${y + len}`, 's-leaf', 2.2) + dotted(0, leaves)
}

// The left margin's outer side, which is the whole margin when the sidebar is
// closed: a pothos hanging from the ceiling, a guitar leaning on the wall
// behind the desk, and a speaker on the desk. With the sidebar open they sit
// under it and show through its glass as soft color.
function hangingPlant() {
  const x = 150
  let o = dline(`M${x} 0V112M${x} 112L${x - 22} 152M${x} 112L${x + 22} 152M${x} 112L${x} 152`, 's-wire', 2.4)
  o += dotted(0, c(x, 110, 4, 'f-wire'))
  o += dotted(0, `<path d="M${x - 26} 150h52l-8 36h-36z" class="f-pot"/>`) + dotted(2, r(x - 24, 158, 48, 8, 'f-pot'))
  o += dotted(0, [[-16, 144, 9], [0, 140, 10], [16, 144, 9], [-8, 132, 7], [9, 131, 7]].map(([dx, y, rad]) => c(x + (dx as number), y as number, rad as number, 'f-leaf')).join(''))
  o += dotted(1, [[-22, 136, 6], [22, 137, 6], [0, 126, 6]].map(([dx, y, rad]) => c(x + (dx as number), y as number, rad as number, 'f-leaf2')).join(''))
  const vines = vine(x - 24, 160, 150, -10, 11) + vine(x + 22, 162, 112, 9, 31) + vine(x - 6, 184, 74, 6, 51)
  return o + turn(vines, [-1.5, 1.5, -1.5], x, 160, 6)
}

// The guitar, leaning a little. The tilt is inside each masked group, so its
// dots stay on the grid.
function guitar() {
  const tilt = (inner: string) => `<g transform="translate(118 ${-DESK + 14}) rotate(-12) scale(.92)">${inner}</g>`
  const body = (k: number) =>
    `<g transform="translate(0 -84) scale(${k}) translate(0 84)"><ellipse cx="0" cy="-46" rx="46" ry="48" class="f-guitar"/><ellipse cx="0" cy="-124" rx="35" ry="36" class="f-guitar"/><rect x="-30" y="-100" width="60" height="30" class="f-guitar"/></g>`
  let o = dotted(3, tilt(body(1.07))) + dotted(0, tilt(body(1)))
  o += dotted(0, tilt('<circle cx="0" cy="-104" r="14" class="f-vinyl"/><rect x="-17" y="-52" width="34" height="8" class="f-vinyl"/>'))
  o += dotted(0, tilt('<rect x="-8" y="-330" width="16" height="196" class="f-box"/><rect x="-12" y="-374" width="24" height="44" rx="5" class="f-box"/>'))
  o += dotted(0, tilt([-366, -352, -338].map(y => `<circle cx="-16" cy="${y}" r="3.5" class="f-label"/><circle cx="16" cy="${y}" r="3.5" class="f-label"/>`).join('')))
  o += tilt(dline('M-4 -48V-330M4 -48V-330', 's-mat', 1.6))
  return o
}

// A speaker on the desk in that corner, its cone pulsing with the music.
function speaker() {
  const x = 196
  let o = dotted(0, r(x, -70, 54, 70, 'f-box')) + dotted(2, r(x + 4, -66, 46, 62, 'f-vinyl'))
  o += dotted(0, c(x + 27, -48, 7, 'f-vinyl')) + dotted(3, c(x + 27, -48, 10, 'f-metal'))
  const cone = dotted(0, c(x + 27, -20, 14, 'f-vinyl')) + dotted(2, c(x + 27, -20, 18, 'f-metal')) + dotted(0, c(x + 27, -20, 4, 'f-label'))
  return o + pulse(cone, '1;1.1', x + 27, -20, 0.5)
}

// String lights along the top, a run from each side.
function stringLights() {
  const span = 560
  const lights = (dir: 1 | -1) => {
    const pts: [number, number][] = []
    for (let i = 0; i <= 14; i++) {
      const t = i / 14
      pts.push([dir * -span + dir * t * span, 4 + Math.sin(t * Math.PI * 3) ** 2 * 20])
    }
    const d = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')
    const colors = ['fill:var(--bulb)', 'fill:#F7A1B5', 'fill:#BFD3FF']
    let bulbs = ''
    pts.forEach(([x, y], i) => {
      if (i === 0 || i === pts.length - 1) return
      const bx = Math.round(x)
      const by = Math.round(y) + 7
      bulbs += blink(dotted(3, c(bx, by, 11, '', `style="${colors[i % 3]}"`)) + c(bx, by, 3.4, '', `style="${colors[i % 3]}"`), '1;.4', 4, -(i % 3) * 1.33)
    })
    return dline(d, 's-wire', 2.2) + bulbs
  }
  return at('100%', '44', lights(1)) + at('0', '44', lights(-1))
}

// The wall as a surface in a room: soft shadow gathers at each side, where
// the wall turns the corner, so it sits back between them.
function wallSurface() {
  const fade = (id: string) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="s-ao" stop-opacity=".6"/><stop offset=".45" class="s-ao" stop-opacity=".21"/><stop offset="1" class="s-ao" stop-opacity="0"/></linearGradient>`
  return (
    `<defs>${fade('aoLeft')}${fade('aoRight')}</defs>` +
    at('0', '0', r(0, 0, 170, 6000, '', 'fill="url(#aoLeft)"')) +
    at('100%', '0', `<g transform="scale(-1 1)">${r(0, 0, 170, 6000, '', 'fill="url(#aoRight)"')}</g>`)
  )
}

// The desk along the bottom: a top the prompt box rests on, and a front of
// drawers under it, so the box always has something beneath it. Each drawer
// is a plain lighter front, shaded in small dots toward its bottom edge, with
// one round brass knob, and thin dark seams between them.
function desk() {
  const W = 240
  let fronts = ''
  let shade = ''
  let knobs = ''
  let shine = ''
  for (let x = 0; x < 6000; x += W) {
    fronts += `<rect x="${x + 5}" y="${-SILL + 5}" width="${W - 10}" height="${SILL - 5}"/>`
    shade += `<rect x="${x + 5}" y="${-12}" width="${W - 10}" height="12"/>`
    knobs += `<circle cx="${x + W / 2}" cy="${-SILL + 15}" r="4.5"/>`
    shine += `<circle cx="${x + W / 2 - 1.5}" cy="${-SILL + 13.5}" r="1.4"/>`
  }
  return at(
    '0',
    '100%',
    r(0, -DESK, 6000, DESK - SILL, 'f-deskTop') +
      dotted(4, r(0, -DESK + 6, 6000, 18, 'f-deskDot')) +
      dotted(2, r(0, -SILL - 9, 6000, 9, 'f-deskDot')) +
      dline(`M3 ${-DESK + 3}H6000`, 's-deskDot', 3.6) +
      r(0, -SILL, 6000, SILL, 'f-deskFront') +
      `<g class="f-drawer">${fronts}</g>` +
      dotted(3, `<g class="f-deskLine">${shade}</g>`) +
      `<g class="f-lamp">${knobs}</g><g class="f-mug">${shine}</g>`,
  )
}

// Clawd at the desk, one dot per pixel, turned a little and typing on the
// laptop in front of him. Its screen lights his face, and his mug steams.
function corner() {
  const sheet = clawdSheet()
  const H = sheet.height
  // A run of pixels in a fixed color, or in one of the palette's (`f-` classes).
  const p = (x: number, y: number, w: number, h: number, fill: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${fill.startsWith('f-') ? `class="${fill}"` : `fill="${fill}"`}/>`
  const glow = `<g mask="url(#c3)" opacity=".7">${c(10.5, 7, 9, '', 'fill="#8FA8FF"')}</g>`
  const laptop = p(5, 10, 12, 6, '#8E95A8') + p(6, 11, 10, 4, '#A3AABC') + p(10, 12, 2, 2, '#E9ECF4') + p(3, 16, 16, 1, '#5E6372')
  const steam = [0, 1].map(i => drift(p(29 + i, H - 9, 1, 1, 'f-puff') + p(30 - i, H - 11, 1, 1, 'f-puff'), 1, -6, 2, -i, true)).join('')
  const mug = p(27, H - 7, 5, 6, 'f-mug') + p(27, H - 5, 5, 1, '#F2A25C') + p(27, H - 7, 5, 1, '#6B4630') + p(32, H - 5, 1, 2, 'f-mug')
  return (
    `<svg x="100%" y="100%" width="1" height="1" overflow="visible"><g class="corner" transform="translate(${-(214 + PAD)} -47) scale(6)"><g transform="translate(0 ${-H})">` +
    glow +
    `<g mask="url(#c0)">${sheet.body}${laptop}${mug}${steam}</g>` +
    '</g></g></svg>'
  )
}

let SCENE: string | undefined

export function sceneSvg(): string {
  if (SCENE) return SCENE
  let o = ''

  // Color first: the wall, cool light from the window, a rose glow, warmth
  // rising from the desk, and the paper's own fine dots.
  o += '<rect width="100%" height="100%" fill="url(#wall)"/>'
  o += '<rect width="100%" height="100%" fill="url(#gCool)" class="o-cool"/>'
  o += '<rect width="100%" height="100%" fill="url(#gRose)" class="o-rose"/>'
  o += '<rect width="100%" height="100%" fill="url(#gFloor)" class="o-floor"/>'
  o += '<rect width="100%" height="100%" fill="url(#tex)" class="o-tex"/>'
  o += wallSurface()
  // Shade on the wall above the desk, in dots that grow toward it.
  o += at('0', '100%', dotted(4, r(0, -DESK - 132, 6000, 60, 'f-shade')) + dotted(3, r(0, -DESK - 72, 6000, 72, 'f-shade')))
  // The lamps' warmth on the wall, one each side.
  o += at('0', '100%', `<circle cx="${LX + 56}" cy="-160" r="250" fill="url(#gWarm)" class="o-warm"/>`)
  o += at('100%', '100%', `<circle cx="${IX}" cy="-390" r="230" fill="url(#gWarm)" class="o-warm" opacity=".8"/>`)

  // Right: the window and radiator, the clock, the shelf over Clawd, and the
  // standing lamp. Left: the hanging pothos and guitar, the print, the records.
  o += at('100%', '0', `<g transform="translate(${-PAD} 0)">${windowView() + windowFrame() + radiator()}</g>${clock()}`)
  o += at('100%', SHELF_AT, `<g transform="translate(${-PAD} 0)">${candleShelf()}</g>`)
  o += at('100%', '100%', floorLamp())
  o += hangingPlant()
  o += at('0', '100%', guitar())
  o += leafPrint()
  o += at('0', SHELF_AT, recordShelf())
  o += stringLights()

  // The desk, with the speaker, lamp and record player on its left, a pencil
  // cup by the standing lamp, and Clawd on its right.
  o += desk()
  o += at('0', '100%', `<g transform="translate(0 ${-DESK + 18})">${deskLeft()}</g>`)
  o += at('100%', '100%', `<g transform="translate(0 ${-DESK + 18})">${pencilCup()}</g>`)
  o += corner()
  SCENE = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><style>${BASE_STYLE}</style>${defs()}${o}</svg>`
  return SCENE
}

export const SCENE_ALT = 'Clawd typing on a laptop at his desk in a cozy room, rain at the window, a record playing'
