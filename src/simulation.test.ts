import { describe, expect, it } from 'vitest'
import { applyEvent, createInitialState, deserializeState, runScenario, serializeState } from './simulation'

describe('planet court simulation', () => {
  it('is deterministic for a seed', () => {
    expect(createInitialState('ryo')).toEqual(createInitialState('ryo'))
  })

  it('turns rulings into precedents and future state', () => {
    const state = applyEvent(createInitialState('river-test'), { type: 'RULE', ruling: 'shared-custody' })
    expect(state.precedents[0]).toContain('Moisture')
    expect(state.turn).toBe(2)
    expect(state.transcript[0]).toContain('RULING')
  })

  it('parses weird apology motion into useful changes', () => {
    const before = createInitialState('sorry-seed')
    const after = applyEvent(before, { type: 'WEIRD_MOTION', text: 'make the river apologize but keep its job 月🌙' })
    expect(after.precedents[0]).toMatch(/Apologies|Lunar/)
    expect(after.villageTrust).toBeGreaterThanOrEqual(before.villageTrust)
  })

  it('serializes and deserializes URL-safe state', () => {
    const state = runScenario('export-seed', [{ type: 'RAIN', amount: 12 }, { type: 'RULE', ruling: 'community-service' }])
    const code = serializeState(state)
    expect(code).not.toContain('/')
    expect(deserializeState(code)?.precedents[0]).toContain('community service')
  })

  it('clamps weird numeric input', () => {
    const state = applyEvent(createInitialState('edge'), { type: 'RAIN', amount: Number.NaN })
    expect(state.wetness).toBeGreaterThanOrEqual(0)
    expect(state.wetness).toBeLessThanOrEqual(100)
  })
})
