export type Limit = { kind: string; pct: number; resetsAt: number | null }

export type Agent = {
  id: string
  type: string
  description: string
  /** The model the subagent runs on, as the engine resolved it (`claude-haiku-5-5`). */
  model: string
  status: 'running' | 'done' | 'failed'
  startedAt: number
  endedAt: number | null
  tools: number
  /** Gone from the Active Agents list: it finished a while ago (still counted as done). */
  isGone?: boolean
}

export type Hud = {
  ctxPct: number | null
  ctxTokens: number | null
  ctxWindow: number
  /** Share of the window by group, in percent of the window. */
  cats: { messages: number; system: number; other: number } | null
  /** Context % after each of the last turns, oldest first. */
  ctxHistory: number[]
  limits: Limit[]
  /** Tool calls in each of the last turns, oldest first. */
  toolsPerTurn: number[]
  toolCalls: number
  turns: number
  lastTurnMs: number | null
  failed: number
  startedAt: number
  curTools: number
  lastAnswer: string
  /** What the session has cost so far at API prices (USD), or null before a reading. */
  costUsd: number | null
  /** Subagents this session, newest last. */
  agents: Agent[]
  spawned: number
}

/** The theme the app is showing, as the last `$.theme.set` named it; null with none. */
export type Look = {
  /** The backdrop's scene name, which is the theme's slug for the themes palette.ts knows. */
  scene?: string
  /** The plugin that set it. */
  plugin?: string
  /** The glass tint over the scene, which names the moment of the day. */
  tint?: string
  dark?: boolean
} | null

declare module 'claude-code' {
  interface PluginState {
    'cyberpunk-hud': { hud: Hud; view: { data: Hud; now: number }; isHidden: boolean; look: Look; isWorking: boolean }
  }
}
