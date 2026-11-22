import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'cyberpunk-hud',
  component: 'AbovePrompt',
  surface: 'desktop',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 20, bodyColumns: 100, scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

test('HIDE minimizes the HUD to its strip and a press on the strip brings it back', async ($, on) => {
  mock.store(on)
  const ui = await $.ui.mount(BAND as never)
  expect(await ui.find({ key: 'hud-restore' })).toBeUndefined()

  await ui.press({ key: 'hud-minimize' })
  expect(await ui.find({ key: 'hud-minimize' })).toBeUndefined()
  expect((await ui.find({ type: 'Svg' }))?.props.alt).toBe('Cyberpunk HUD, minimized')

  await ui.press({ key: 'hud-restore' })
  expect(await ui.find({ key: 'hud-restore' })).toBeUndefined()
  expect(await ui.find({ key: 'hud-minimize' })).toBeDefined()
  await ui.unmount()
})
