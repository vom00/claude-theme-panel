// Sunfield's day (day.js): sunrise and sunset by the clock, and the scene written for a moment.
export declare function sunTimes(ms: number): { rise: number; set: number }
export declare function dayCss(ms: number): string
export declare function sceneAt(scene: string, ms: number, lead?: number): string
export declare function secondsOfDay(ms: number): number
export declare function clock(minutes: number): string
export type Pane = { dark: boolean; tint: string; opacity: number }
export declare function paneAt(ms: number): Pane
export declare const PANES: Record<string, Pane>
export declare const MOMENTS: Record<string, ['r' | 's', number]>
export declare const LOOKS: Record<string, Record<string, unknown>>
export declare const DAY_RULE: string
export declare const DAY_SAMPLE: number
export declare const T_MARK: string
