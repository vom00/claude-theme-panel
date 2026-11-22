declare module 'claude-code' {
  interface PluginState {
    'theme-panel': {
      /** The slug of the theme on now ('' before the first is set). */
      current: string
      /** Which page of theme cards the panel shows. */
      page: number
      /** Whether the frosted blur behind the app's panels and messages is on. */
      blurOn: boolean
      /** The time of day picked on each theme's card ('day', 'sunset' or 'night'), by slug. */
      times: Record<string, string>
    }
  }
}
