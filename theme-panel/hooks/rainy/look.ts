// Rainy Window, carried by the theme panel so it can switch to it like any other theme. The
// scene (scene.ts and clawd/) and these colours are copied from the rainy-window plugin by
// Ishu Agrawal (https://github.com/ishuagrawal/claude-code-themes), MIT licence in LICENSE.
import type { ThemeSetArgs } from 'claude-code'

import { makeColors } from '../kit/make-colors.js'
import { SCENE_ALT, sceneSvg, sunsetSceneSvg } from './scene'

export const RAINY_SCENE = 'rainy-window'
export const RAINY_ALT = SCENE_ALT

// Cream paper and ink by day, a lamp-lit navy by night, to match the scene.
const { theme } = makeColors({
  label: 'Rainy window',
  roles: { accent: '#5562C9', danger: '#C9553E', success: '#4E8B62', warning: '#D9892F', pro: '#7E5FC0' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#E9E3D6',
        'surface-1': '#F0EBE1',
        'surface-2': '#F6F2EA',
        'text-primary': '#1F1F26',
        'text-secondary': '#45444F',
        'text-muted': '#5F5D68',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#12142A',
        'surface-1': '#181B33',
        'surface-2': '#1D2140',
        'surface-3': '#22264A',
        'text-primary': '#EDE6D6',
        'text-secondary': '#CBC3B3',
        'text-muted': '#A8A192',
      },
    },
  },
})

// Held at night: the dark scheme, which the scene reads to draw its lamp-lit night with the moon.
export const RAINY_LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'dark',
  backdrop: { scene: RAINY_SCENE, glass: { blur: 18, opacity: 0.62 } },
}

// The scene is one drawing that animates on its own: made once, drawn as often as asked.
let svg: string | undefined
export const rainySvg = (): string => (svg ??= sceneSvg())

// By day: the light scheme, which the scene reads to draw the window in daylight, with the sun.
export const RAINY_DAY_LOOK: ThemeSetArgs = { ...RAINY_LOOK, overrideColorScheme: 'light' }

// At sunset: the dark scheme for the app, over the scene drawn in its fixed sunset palette
// (rainySunsetSvg), the glass tinted a warm dusk.
export const RAINY_SUNSET_LOOK: ThemeSetArgs = {
  ...RAINY_LOOK,
  backdrop: { scene: RAINY_SCENE, glass: { blur: 18, tint: '#2A1A33', opacity: 0.62 } },
}
let sunset: string | undefined
export const rainySunsetSvg = (): string => (sunset ??= sunsetSceneSvg())
