// The themes the panel offers, in the order its cards show them. Each BackdropKit theme is
// its theme.js from ~/.claude/backdropkit, scenes as they ship; Rainy Window
// is the rainy-window plugin's scene, and Sunfield its own one-scene theme (sunfield/). A theme's slug is also its scene's name, which is how the
// Cyberpunk HUD knows which theme is on and takes its colours.
import { THEME as CLOUD_SEA } from './kit/cloud-sea.js'
import { THEME as DEEP_REEF } from './kit/deep-reef.js'
import { THEME as GAS_STATION } from './kit/gas-station.js'
import { THEME as HILL_VILLAGE } from './kit/hill-village.js'
import { THEME as LAVENDER_SLOPE } from './kit/lavender-slope.js'
import { THEME as MIRROR_LAKE } from './kit/mirror-lake.js'
import { THEME as MOON_KEEP } from './kit/moon-keep.js'
import { THEME as SIDE_STREET } from './kit/side-street.js'
import { THEME as HARBOR } from './kit/harbor.js'
import { THEME as TIDE_LINE } from './kit/tide-line.js'
import { THEME as SUNBEAM_WOOD } from './kit/sunbeam-wood.js'
import { THEME as SNOWFALL_RIDGE } from './kit/snowfall-ridge.js'
import { THEME as RAINY_STUDIO } from './kit/rainy-studio.js'
import { THEME as LOW_ORBIT } from './kit/low-orbit.js'
import type { ThemeSetArgs } from 'claude-code'

import type { Theme } from './kit/types'
import { RAINY_ALT, RAINY_LOOK, RAINY_SCENE, rainySvg } from './rainy/look'
import { SUNFIELD_ALT, SUNFIELD_SCENE, sunfieldLookAt, sunfieldSvgAt } from './sunfield/look'

/**
 * A theme on the panel: `kit` for a BackdropKit theme, whose look follows the time of day;
 * otherwise one fixed look, drawn by `svg`.
 */
export type Entry = {
  slug: string
  name: string
  kit?: Theme
  look?: ThemeSetArgs
  svg?: () => string
  /** For a theme that follows the clock by itself (Sunfield): its look and scene at a moment. */
  lookAt?: (ms: number) => ThemeSetArgs
  svgAt?: (ms: number) => string
  alt?: string
  /** Whether the backdrop needs the sandboxed frame (CSS animation) rather than an image. */
  isInteractive?: boolean
  /** The card picture's body, for a theme not in thumbs.ts. */
  thumb?: string
}

const kit = (theme: Theme): Entry => ({ slug: theme.slug, name: theme.name, kit: theme })

export const CATALOG: readonly Entry[] = [
  { slug: RAINY_SCENE, name: 'Rainy Window', look: RAINY_LOOK, svg: rainySvg, alt: RAINY_ALT },
  kit(CLOUD_SEA),
  kit(DEEP_REEF),
  kit(GAS_STATION),
  kit(HILL_VILLAGE),
  kit(LAVENDER_SLOPE),
  kit(MIRROR_LAKE),
  kit(MOON_KEEP),
  kit(SIDE_STREET),
  { slug: SUNFIELD_SCENE, name: 'Sunfield', lookAt: sunfieldLookAt, svgAt: sunfieldSvgAt, alt: SUNFIELD_ALT, isInteractive: true },
  kit(HARBOR),
  kit(TIDE_LINE),
  kit(SUNBEAM_WOOD),
  kit(SNOWFALL_RIDGE),
  kit(RAINY_STUDIO),
  kit(LOW_ORBIT),
]

export const DEFAULT_SLUG = RAINY_SCENE

export const entryOf = (slug: string): Entry | undefined => CATALOG.find(e => e.slug === slug)

/** Finds a theme by what a person types: its slug or its name, any case, spaces or hyphens. */
export function findEntry(text: string): Entry | undefined {
  const key = text.trim().toLowerCase().replace(/[\s_]+/g, '-')
  return CATALOG.find(e => e.slug === key || e.name.toLowerCase().replace(/\s+/g, '-') === key)
}
