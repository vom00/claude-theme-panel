// Sunfield's day: the scene follows the clock, from night through dawn, day and sunset.
//
// The scene carries one 24-hour CSS cycle, started at local midnight by a negative delay: the
// root's --t is minus the seconds since midnight. Every other motion counts the same way from
// a fixed moment with --m, so a scene written a minute later shows exactly what the earlier one
// shows a minute on, and swapping one for the other moves nothing. This module writes that
// cycle for the day's sunrise and sunset, and gives each part the moment's values as its
// resting style, which is what the app's still frame and reduced motion show. It also says
// how the app's panels look over the scene at each moment (PANES).

// Sunrise and sunset come from the date and the clock's time zone: the sun is taken to cross
// the middle of the zone at noon (an hour later under daylight saving), at latitude LAT,
// north unless the clock keeps daylight saving in January. Off by half an hour at most for
// most places, which a sky does not show.
const LAT = 35
const RAD = Math.PI / 180

// Minutes after local midnight of sunrise and sunset, on the local date of `ms`.
export function sunTimes(ms) {
  const d = new Date(ms)
  const y = d.getFullYear()
  const day = Math.round((new Date(y, d.getMonth(), d.getDate()).getTime() - new Date(y, 0, 1).getTime()) / 864e5)
  const g = (2 * Math.PI * day) / 365
  const eqt =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g)
  const jan = -new Date(y, 0, 1).getTimezoneOffset()
  const jul = -new Date(y, 6, 1).getTimezoneOffset()
  const lat = (jan > jul ? -LAT : LAT) * RAD
  const saving = -d.getTimezoneOffset() - Math.min(jan, jul)
  const noon = 720 + saving - eqt
  const cosH = Math.cos(90.833 * RAD) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl)
  const half = (Math.acos(Math.max(-1, Math.min(1, cosH))) / RAD) * 4
  return { rise: noon - half, set: noon + half }
}

// The parts the day changes, by their class in the scene, and what each animates:
// N, a multiply layer over the sky (fill, opacity); St, the stars and the moon; A, a colour
// layer over the sky and clouds (its opacity), whose gradient runs A0 (top), A1, A2 (horizon);
// Fc and Fg, the colours the clouds and the field are multiplied by; Su, the sun (x and y in
// cells, opacity), which moves a whole cell at a time.
const PROPS = {
  N: ['fill', 'opacity'],
  St: ['opacity'],
  A: ['opacity'],
  A0: ['stop-color'],
  A1: ['stop-color'],
  A2: ['stop-color'],
  Fc: ['flood-color'],
  Fg: ['flood-color'],
  Su: ['transform', 'opacity'],
}
// The scene's own CSS runs every part but the sun on this rule, each by its own keyframes:
// 24 hours from local midnight, each change between two looks cut into 40 steps, about a
// minute each.
export const DAY_RULE =
  Object.keys(PROPS)
    .filter(p => p !== 'Su')
    .map(p => '.' + p)
    .join(',') + '{animation:86400s steps(40) var(--t) infinite}'

// The look at each point of the day. The sun waits below the horizon on the left, unseen,
// from twilight to dawn.
export const LOOKS = {
  night: { N: ['#18234e', 1], St: 1, A: 0.5, A0: '#1c2160', A1: '#262c74', A2: '#353c86', Fc: '#4a5688', Fg: '#323c68', Su: [-80, 30, 0] },
  predawn: { N: ['#3b4680', 1], St: 0.65, A: 0.55, A0: '#262c74', A1: '#5a4c90', A2: '#b4789a', Fc: '#7c7cac', Fg: '#585c8c', Su: [-80, 30, 0] },
  dawn: { N: ['#a898c4', 1], St: 0, A: 0.7, A0: '#3c3f9c', A1: '#b884b8', A2: '#ffa88c', Fc: '#e4b8c4', Fg: '#b49cb4', Su: [-80, 20, 0] },
  sunrise: { N: ['#fbe8dc', 1], St: 0, A: 0.75, A0: '#3f6fd0', A1: '#c8a2d0', A2: '#ffc48a', Fc: '#ffe4d0', Fg: '#f6dcc0', Su: [-80, -8, 1] },
  morning: { N: ['#ffffff', 0], St: 0, A: 0.3, A0: '#3f78d8', A1: '#a8c4f0', A2: '#ffe0a8', Fc: '#fff6ec', Fg: '#fff4e6', Su: [-80, -36, 0] },
  day: { N: ['#ffffff', 0], St: 0, A: 0, A0: '#3f78d8', A1: '#a8c4f0', A2: '#ffe0a8', Fc: '#ffffff', Fg: '#ffffff', Su: [0, -44, 0] },
  golden: { N: ['#fff0e2', 1], St: 0, A: 0.7, A0: '#3a6ad0', A1: '#b0a0dc', A2: '#ffb870', Fc: '#ffe6c8', Fg: '#ffdcb0', Su: [0, -30, 1] },
  sunset: { N: ['#f4b48c', 1], St: 0, A: 0.75, A0: '#4c4ca4', A1: '#e47c8c', A2: '#ff8c4c', Fc: '#f6a684', Fg: '#d08470', Su: [0, -6, 1] },
  dusk: { N: ['#86709c', 1], St: 0.25, A: 0.65, A0: '#323686', A1: '#9a5890', A2: '#e47c6c', Fc: '#a688b0', Fg: '#6c6490', Su: [0, 10, 0] },
  twilight: { N: ['#38407a', 1], St: 0.8, A: 0.55, A0: '#242a6c', A1: '#3c3680', A2: '#7c5288', Fc: '#68689a', Fg: '#464a7a', Su: [-80, 30, 0] },
}

// The app's panels over the scene at each look: dark or light words, and the frosted glass's
// tint and opacity, taken from that look's sky so the panels sit in it. The glass stays
// smoky, never milky: when the sky behind the chat is mid-toned or dark (sunset through
// sunrise) it is a dark tint of that sky with pale words; only the bright morning-to-golden
// sky gets a pale tint, and a blue or warm one, not white. Between two looks of the same kind
// the glass moves from one to the next; between a light look and a dark one it switches
// halfway.
export const PANES = {
  night: { dark: true, tint: '#0e1634', opacity: 0.55 },
  predawn: { dark: true, tint: '#181d48', opacity: 0.55 },
  dawn: { dark: true, tint: '#2a2452', opacity: 0.55 },
  sunrise: { dark: true, tint: '#2e2648', opacity: 0.6 },
  morning: { dark: false, tint: '#cfe3f7', opacity: 0.5 },
  day: { dark: false, tint: '#cfe5f9', opacity: 0.5 },
  golden: { dark: false, tint: '#efd6c0', opacity: 0.5 },
  sunset: { dark: true, tint: '#3b2440', opacity: 0.55 },
  dusk: { dark: true, tint: '#272450', opacity: 0.55 },
  twilight: { dark: true, tint: '#171d46', opacity: 0.55 },
}

// When each look is reached, in minutes from sunrise (r) or sunset (s); between two the scene
// moves from one to the next.
const KEYS = [
  ['r', -100, 'night'],
  ['r', -55, 'predawn'],
  ['r', -18, 'dawn'],
  ['r', 10, 'sunrise'],
  ['r', 50, 'morning'],
  ['r', 110, 'day'],
  ['s', -110, 'day'],
  ['s', -55, 'golden'],
  ['s', -10, 'sunset'],
  ['s', 15, 'dusk'],
  ['s', 45, 'twilight'],
  ['s', 95, 'night'],
]

// What /sunfield-sky can show, as minutes from sunrise or sunset.
export const MOMENTS = {
  night: ['r', -160],
  dawn: ['r', -18],
  sunrise: ['r', 10],
  morning: ['r', 50],
  day: ['r', 240],
  golden: ['s', -55],
  sunset: ['s', -10],
  dusk: ['s', 15],
  twilight: ['s', 45],
}

const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const rgbHex = c => {
  const h = c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
  return '#' + (h[0] === h[1] && h[2] === h[3] && h[4] === h[5] ? h[0] + h[2] + h[4] : h)
}
const num = v => {
  const s = String(Math.round(v * 1000) / 1000)
  return s.startsWith('0.') ? s.slice(1) : s
}

// A look's values for one part, as a flat list: colours as [r, g, b], numbers as they are.
function values(look, part) {
  const v = LOOKS[look][part]
  return (Array.isArray(v) ? v : [v]).flatMap(x => (typeof x === 'string' ? hexRgb(x) : [x]))
}

// The values as CSS declarations.
function decl(part, vals) {
  const out = []
  let i = 0
  for (const p of PROPS[part]) {
    if (p === 'transform') {
      out.push('transform:translate(' + Math.round(vals[i]) + 'px,' + Math.round(vals[i + 1]) + 'px)')
      i += 2
    } else if (p === 'opacity') {
      out.push('opacity:' + num(vals[i]))
      i += 1
    } else {
      out.push(p + ':' + rgbHex(vals.slice(i, i + 3)))
      i += 3
    }
  }
  return out.join(';')
}

// The day's keys as [minute, look], in order, within the day.
function keys(ms) {
  const { rise, set } = sunTimes(ms)
  const at = KEYS.map(([a, m, look]) => [Math.min(1439, Math.max(1, Math.round((a === 'r' ? rise : set) + m))), look])
  for (let i = 1; i < at.length; i++) if (at[i][0] <= at[i - 1][0]) at[i][0] = Math.min(1439, at[i - 1][0] + 1)
  return at
}

// One part's values at minute m of the day, the keys taken as a loop.
function valuesAt(ks, part, m) {
  const loop = [[ks[ks.length - 1][0] - 1440, ks[ks.length - 1][1]], ...ks, [ks[0][0] + 1440, ks[0][1]]]
  for (let i = 0; i < loop.length - 1; i++) {
    const [ma, la] = loop[i]
    const [mb, lb] = loop[i + 1]
    if (m >= ma && m <= mb) {
      const t = mb === ma ? 0 : (m - ma) / (mb - ma)
      const a = values(la, part)
      const b = values(lb, part)
      return a.map((v, j) => v + (b[j] - v) * t)
    }
  }
  return values(ks[0][1], part)
}

// The panels at the moment `ms`: { dark, tint, opacity }.
export function paneAt(ms) {
  const d = new Date(ms)
  const m = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  const ks = keys(ms)
  const loop = [[ks[ks.length - 1][0] - 1440, ks[ks.length - 1][1]], ...ks, [ks[0][0] + 1440, ks[0][1]]]
  let i = 0
  while (i < loop.length - 2 && m > loop[i + 1][0]) i++
  const [ma, la] = loop[i]
  const [mb, lb] = loop[i + 1]
  const t = mb === ma ? 0 : Math.max(0, Math.min(1, (m - ma) / (mb - ma)))
  const a = PANES[la]
  const b = PANES[lb]
  if (a.dark !== b.dark) return { ...(t < 0.5 ? a : b) }
  const ca = hexRgb(a.tint)
  const cb = hexRgb(b.tint)
  const tint = '#' + ca.map((v, j) => Math.round(v + (cb[j] - v) * t).toString(16).padStart(2, '0')).join('')
  return { dark: a.dark, tint, opacity: Math.round((a.opacity + (b.opacity - a.opacity) * t) * 100) / 100 }
}

// The CSS of the day of `ms` at the moment `ms`: each part's resting values, its 24-hour
// animation and the keyframes for the day's sunrise and sunset.
export function dayCss(ms) {
  const d = new Date(ms)
  const minute = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  const ks = keys(ms)
  let css = ''
  for (const part of Object.keys(PROPS)) {
    // The points where this part's values change, with midnight at both ends.
    const pts = [[0, valuesAt(ks, part, 0)], ...ks.map(([m, look]) => [m, values(look, part)]), [1440, valuesAt(ks, part, 1440)]]
    const kept = pts.filter((p, i) => {
      if (i === 0 || i === pts.length - 1) return true
      const same = q => q[1].every((v, j) => v === p[1][j])
      return !(same(pts[i - 1]) && same(pts[i + 1]))
    })
    const moves = part === 'Su'
    // Keyframes with the same values share one block: "0%,17.08%{...}".
    const blocks = new Map()
    for (let i = 0; i < kept.length; i++) {
      const [m, vals] = kept[i]
      let step = ''
      // The sun moves a cell at a time: as many steps as cells in each stretch.
      if (moves && i < kept.length - 1) {
        const next = kept[i + 1][1]
        step = ';animation-timing-function:steps(' + Math.max(1, Math.abs(next[0] - vals[0]), Math.abs(next[1] - vals[1])) + ')'
      }
      const body = decl(part, vals) + step
      blocks.set(body, (blocks.get(body) ?? []).concat(num(Math.round((m / 14.4) * 100) / 100) + '%'))
    }
    const frames = [...blocks].map(([body, at]) => at.join(',') + '{' + body + '}').join('')
    const run = moves ? ';animation:Su 86400s var(--t) infinite' : ';animation-name:' + part
    css += '.' + part + '{' + decl(part, valuesAt(ks, part, minute)) + run + '}@keyframes ' + part + '{' + frames + '}'
  }
  return css
}

// What the scene file holds where the day goes: the cycle of a fixed summer day, and --t at
// its noon, both replaced by sceneAt. --m is the clock of all the other motion: seconds since
// MOTION_EPOCH, which unlike the time of day runs on through midnight and clock changes.
export const T_MARK = '--t:-43200s;--m:0s'
const MOTION_EPOCH = Date.UTC(2026, 0, 1)
export const DAY_SAMPLE = new Date(2026, 5, 21, 12).getTime()
const DAY_MARK = /\/\*D\*\/[^]*?\/\*D\*\//

// The seconds since local midnight at `ms`.
export function secondsOfDay(ms) {
  const d = new Date(ms)
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000
}

// The scene as it should be at `ms`, milliseconds since the epoch. `lead` is how long the app
// takes to start the picture after this runs, in seconds.
export function sceneAt(scene, ms, lead = 0.2) {
  const t = Math.round((secondsOfDay(ms) + lead) * 20) / 20
  const m = Math.round(((ms - MOTION_EPOCH) / 1000 + lead) * 20) / 20
  return scene.replace(T_MARK, '--t:-' + t + 's;--m:' + -m + 's').replace(DAY_MARK, () => dayCss(ms))
}

// "HH:MM" for minutes after midnight.
export function clock(m) {
  const t = ((Math.round(m) % 1440) + 1440) % 1440
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0')
}
