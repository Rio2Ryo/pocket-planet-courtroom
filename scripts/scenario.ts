import { applyEvent, runScenario, serializeState, type PlanetEvent } from '../src/simulation.ts'

const args = process.argv.slice(2)
const get = (name: string, fallback = '') => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] ?? fallback : fallback
}
const seed = get('seed', 'cli-ryo-court')
const motion = get('motion', 'make the river apologize but keep its job')
const ruling = get('ruling', 'shared-custody') as PlanetEvent extends { type: 'RULE'; ruling: infer R } ? R : never
const rain = Number(get('rain', '11'))
const events: PlanetEvent[] = [
  { type: 'RAIN', amount: rain },
  { type: 'WEIRD_MOTION', text: motion },
  { type: 'RULE', ruling },
]
let state = runScenario(seed, events)
if (args.includes('--next')) state = applyEvent(state, { type: 'NEXT_CASE' })
const summary = {
  seed,
  case: state.currentCase.title,
  weather: state.weather,
  meters: { wetness: state.wetness, moss: state.moss, river: state.river, villageTrust: state.villageTrust, appealRisk: state.appealRisk },
  latestPrecedent: state.precedents[0],
  latestTranscript: state.transcript[0],
  shareCodePrefix: serializeState(state).slice(0, 80),
}
console.log(JSON.stringify(summary, null, 2))
