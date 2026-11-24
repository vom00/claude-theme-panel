import { expect, test } from 'claude-code/testing'

import type { Agent } from '../types'
import { AGENT_LINGER_MS, agentsSection, EMPTY, sweepAgents } from './core'

const agent = (id: string, over: Partial<Agent> = {}): Agent => ({
  id,
  type: 'EXPLORE',
  description: `job ${id}`,
  model: 'claude-haiku-5-5',
  status: 'running',
  startedAt: 0,
  endedAt: null,
  tools: 0,
  ...over,
})

test('a finished agent stays in the list a while, then goes, still counted as done', () => {
  const ended = 60_000
  const h = { ...EMPTY, spawned: 2, agents: [agent('a', { status: 'done', endedAt: ended }), agent('b')] }

  // Just finished: shown with its DONE time, beside the one still running.
  const soon = sweepAgents(h, ended + 5_000)
  expect(soon).toBe(h)
  const before = agentsSection(soon, ended + 5_000)
  expect(before).toContain('job a')
  expect(before).toContain('job b')
  expect(before).toContain('1 RUNNING · 1 DONE')

  // Past the linger: gone from the list, the running one stays, the counts keep it.
  const later = sweepAgents(h, ended + AGENT_LINGER_MS)
  expect(later.agents.find(a => a.id === 'a')?.isGone).toBe(true)
  const after = agentsSection(later, ended + AGENT_LINGER_MS)
  expect(after).not.toContain('job a')
  expect(after).toContain('job b')
  expect(after).toContain('1 RUNNING · 1 DONE')
  expect(after).toContain('2 SPAWNED')
  expect(after).not.toContain('MORE')
})

test('with every agent gone the list says none are running', () => {
  const h = { ...EMPTY, spawned: 1, agents: [agent('a', { status: 'failed', endedAt: 0 })] }
  const out = agentsSection(sweepAgents(h, AGENT_LINGER_MS), AGENT_LINGER_MS)
  expect(out).toContain('NO AGENTS RUNNING')
  expect(out).not.toContain('job a')
  expect(out).toContain('0 RUNNING · 0 DONE')
})
