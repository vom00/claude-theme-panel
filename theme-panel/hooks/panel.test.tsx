import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'
import type { ThemeSetArgs } from 'claude-code'

import { PAGE_BUDGET, PAGES, pictureSize } from './register'

const PANE = {
  plugin: 'theme-panel',
  component: 'Pane',
  requestId: 'theme-panel',
  props: {
    title: 'Themes',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

/** Answers what the panel asks of the engine and records each theme it sets. */
function engine(on: Parameters<TestBody>[1], stored: Record<string, unknown> = {}, panes = true) {
  const sets: ThemeSetArgs[] = []
  mock.store(on, stored)
  mock.clock(on, { now: Date.UTC(2026, 10, 19, 12) })
  on('command.register', () => ({ value: { command: 'theme-panel' } }))
  if (panes) on('ui.open', () => ({ value: { isPlaced: true } }))
  if (panes) on('ui.panes', () => ({ value: [] }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('theme.set', (_, e) => {
    sets.push(e)
    return { value: { isDrawn: true, requestId: 'x' } }
  })
  return sets
}

test('a new session starts on Rainy Window', async ($, on) => {
  const sets = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.at(-1)?.backdrop?.scene).toBe('rainy-window')
})

test('a kept theme comes back in a new session', async ($, on) => {
  const sets = engine(on, { current: 'moon-keep' })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.at(-1)?.backdrop?.scene).toBe('moon-keep')
})

test('pressing a card puts that theme on, on every surface', async ($, on) => {
  const sets = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const [surface, slug] of [['desktop', 'cloud-sea'], ['terminal', 'gas-station']] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    await ui.press({ key: `pick-${slug}` })
    expect(sets.at(-1)?.backdrop?.scene).toBe(slug)
    await ui.unmount()
  }
})

test('the desktop panel counts sixteen themes and pages through them', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /16 themes/ }))?.text).toBe('16 themes')
  expect((await ui.find({ type: 'Text', text: /Deep Reef/ }))?.text).toBe('Deep Reef')
  // Four cards to a page, so the ninth is two pages down.
  expect(await ui.find({ type: 'Text', text: /Side Street/ })).toBeUndefined()
  await ui.press({ key: 'down' })
  // Page two holds the next four.
  expect((await ui.find({ type: 'Text', text: /Moon Keep/ }))?.text).toBe('Moon Keep')
  await ui.press({ key: 'down' })
  expect((await ui.find({ type: 'Text', text: /Side Street/ }))?.text).toBe('Side Street')
  await ui.press({ key: 'up' })
  expect(await ui.find({ type: 'Text', text: /Side Street/ })).toBeUndefined()
  await ui.unmount()
})

test('/theme-panel <name> switches by name', async ($, on) => {
  const sets = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  // The engine stamps origin and presentation on a typed command; the test leaves them out.
  const r = await $.command.run({ command: 'theme-panel', args: 'lavender slope' } as Parameters<typeof $.command.run>[0])
  expect(sets.at(-1)?.backdrop?.scene).toBe('lavender-slope')
  expect(JSON.stringify(r)).toContain('Lavender Slope is on')
})

const blurOf = (look: ThemeSetArgs | undefined) => {
  const glass = look?.backdrop?.glass
  return glass === false || glass === undefined ? undefined : glass.blur
}

test('the blur switch in the panel takes the blur off and puts it back', async ($, on) => {
  const sets = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(blurOf(sets.at(-1))).toBeGreaterThan(0)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'toggle-blur' })
  expect(blurOf(sets.at(-1))).toBe(0)
  expect((await ui.find({ key: 'toggle-blur' }))?.props.label).toBe('○ Blur off')
  // A theme picked while it is off stays unblurred.
  await ui.press({ key: 'pick-deep-reef' })
  expect(sets.at(-1)?.backdrop?.scene).toBe('deep-reef')
  expect(blurOf(sets.at(-1))).toBe(0)
  await ui.press({ key: 'toggle-blur' })
  expect(blurOf(sets.at(-1))).toBeGreaterThan(0)
  await ui.unmount()
})

test('blur kept off comes back off in a new session, and /theme-panel blur on turns it on', async ($, on) => {
  const sets = engine(on, { blurOff: true })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(blurOf(sets.at(-1))).toBe(0)
  const r = await $.command.run({ command: 'theme-panel', args: 'blur on' } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(r)).toContain('Blur behind messages on')
  expect(blurOf(sets.at(-1))).toBeGreaterThan(0)
})

test('on desktop the whole card takes the press, over the picture', async ($, on) => {
  const sets = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const hit = await ui.find({ type: 'Box', key: 'hit-deep-reef' })
  expect(hit?.props.position).toBe('absolute')
  await ui.press({ key: 'pick-deep-reef' })
  expect(sets.at(-1)?.backdrop?.scene).toBe('deep-reef')
  await ui.unmount()
})

test('every page of four stays small enough for the app to draw', () => {
  expect(PAGES.map(p => p.length)).toEqual([4, 4, 4, 4])
  for (const p of PAGES) expect(p.reduce((n, c) => n + pictureSize(c), 0)).toBeLessThanOrEqual(PAGE_BUDGET)
})

test('Sunfield follows the clock: its look and its scene are worked out for the time', async ($, on) => {
  const sets = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const r = await $.command.run({ command: 'theme-panel', args: 'sunfield' } as Parameters<typeof $.command.run>[0])
  expect(JSON.stringify(r)).toContain('Sunfield is on')
  const look = sets.at(-1)
  expect(look?.backdrop?.scene).toBe('sunfield')
  // The mocked clock reads noon UTC: the glass is tinted for that moment of the day.
  const glass = look?.backdrop?.glass
  expect(typeof (glass === false ? undefined : glass?.tint)).toBe('string')
  const ui = await $.ui.mount({ plugin: 'theme-panel', component: 'Backdrop', surface: 'desktop', props: { plugin: 'theme-panel', scene: 'sunfield', glass: look!.backdrop!.glass! } } as never)
  const svg = await ui.find({ type: 'Svg' })
  expect(String(svg?.props.source).length).toBeLessThanOrEqual(131072)
  await ui.unmount()
})

test('the new themes switch by name', async ($, on) => {
  const sets = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  for (const [name, slug] of [['harbor', 'harbor'], ['tide line', 'tide-line'], ['sunbeam wood', 'sunbeam-wood']]) {
    await $.command.run({ command: 'theme-panel', args: name } as Parameters<typeof $.command.run>[0])
    expect(sets.at(-1)?.backdrop?.scene).toBe(slug)
  }
})

test('the footer button opens and closes the panel without a command', async ($, on) => {
  engine(on, {}, false)
  let open = false
  const opened: string[] = []
  on('ui.open', (_, e) => {
    open = true
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => {
    open = false
    return { value: undefined }
  })
  on('ui.panes', () => ({ value: open ? [{ id: 'theme-panel', title: 'Themes', isShown: true, isFocused: false, isPlaced: true }] : [] }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(open).toBe(true)

  const ui = await $.ui.mount({ plugin: 'theme-panel', component: 'SessionMode', surface: 'desktop', props: { modes: [] } })
  await ui.press({ key: 'toggle-theme-panel' })
  expect(open).toBe(false)
  await ui.press({ key: 'toggle-theme-panel' })
  expect(open).toBe(true)
  expect(opened.length).toBe(2)
  await ui.unmount()
})

test('the footer button shows its sun-over-hills icon', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'theme-panel', component: 'SessionMode', surface: 'desktop', props: { modes: [] } })
  expect(JSON.stringify(await ui.drawn())).toContain('\u{1F304}')
  await ui.unmount()
})

test('every theme is on its night look, even at noon', async ($, on) => {
  const sets = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  for (const slug of ['rainy-window', 'cloud-sea', 'deep-reef', 'gas-station', 'hill-village', 'lavender-slope', 'mirror-lake', 'moon-keep', 'side-street', 'sunfield', 'harbor', 'tide-line', 'sunbeam-wood', 'snowfall-ridge', 'rainy-studio', 'low-orbit']) {
    await $.command.run({ command: 'theme-panel', args: slug } as Parameters<typeof $.command.run>[0])
    expect(sets.at(-1)?.backdrop?.scene).toBe(slug)
    expect(sets.at(-1)?.overrideColorScheme).toBe('dark')
  }
})
