// The times of day a theme card offers: a button for each, in this order.
import type { Moment, Theme } from './kit/types'

export type Slot = 'day' | 'sunset' | 'night'
export const SLOTS: readonly Slot[] = ['day', 'sunset', 'night']
export const isSlot = (s: unknown): s is Slot => s === 'day' || s === 'sunset' || s === 'night'

/** The buttons' icons: a sun, a sun going down behind buildings, a crescent moon. */
export const SLOT_ICON: Record<Slot, string> = { day: '☀️', sunset: '\u{1F307}', night: '\u{1F319}' }
export const SLOT_NAME: Record<Slot, string> = { day: 'Day', sunset: 'Sunset', night: 'Night' }

/** A BackdropKit theme's night: the moment named night, else its last dark one, else its last. */
export function nightMoment(theme: Theme): Moment {
  const ms = theme.moments
  return ms.find(m => m.id === 'night') ?? [...ms].reverse().find(m => m.dark) ?? ms[ms.length - 1] ?? ms[0]!
}

// For the sunset button, the scene's warm moment nearest a sunset: its sunset or evening, else
// the golden light of its sunrise or morning.
const WARM = ['sunset', 'evening', 'golden', 'dusk', 'sunrise', 'morning']

/** The moment of a BackdropKit theme that a button shows, or undefined where it has none. */
export function kitMoment(theme: Theme, slot: Slot): Moment | undefined {
  const ms = theme.moments
  const night = nightMoment(theme)
  if (slot === 'night') return night
  // Its moment named day first, so an earlier light sunrise or morning is left for the sunset
  // button; else its first light one; else (Tide Line, all dark) its sunrise, the scene by morning.
  const day =
    ms.find(m => m !== night && m.id === 'day') ??
    ms.find(m => m !== night && !m.dark) ??
    ms.find(m => m !== night && (m.id === 'sunrise' || m.id === 'morning'))
  if (slot === 'day') return day
  return WARM.map(id => ms.find(m => m.id === id)).find(m => m !== undefined && m !== night && m !== day)
}

/** The buttons a BackdropKit theme gets: none for a scene with a single look. */
export function kitSlots(theme: Theme): Slot[] {
  const s = SLOTS.filter(slot => kitMoment(theme, slot) !== undefined)
  return s.length > 1 ? s : []
}
