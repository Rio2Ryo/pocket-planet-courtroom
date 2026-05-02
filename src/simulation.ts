export type Faction = 'moss' | 'river' | 'village' | 'cloud' | 'volcano' | 'moon'
export type Ruling = 'shared-custody' | 'guilty-river' | 'guilty-moss' | 'trial-by-weather' | 'community-service' | 'appeal-to-moon'

export type CaseFile = {
  id: string
  title: string
  charge: string
  plaintiff: Faction
  defendant: Faction
  witness: Faction
}

export type PlanetState = {
  seed: string
  turn: number
  wetness: number
  moss: number
  river: number
  villageTrust: number
  cloudMood: number
  heat: number
  currentCase: CaseFile
  precedents: string[]
  transcript: string[]
  interventions: string[]
  weather: 'clear' | 'drizzle' | 'storm' | 'constitutional-storm'
  appealRisk: number
}

export type PlanetEvent =
  | { type: 'RAIN'; amount: number }
  | { type: 'DRAG_RIVER'; direction: 'toward-moss' | 'toward-village' | 'toward-volcano' }
  | { type: 'RAISE_TERRAIN'; amount: number }
  | { type: 'RULE'; ruling: Ruling }
  | { type: 'WEIRD_MOTION'; text: string }
  | { type: 'NEXT_CASE' }
  | { type: 'RESET'; seed: string }

const cases: CaseFile[] = [
  { id: 'moss-river-004', title: 'The Moss Union v. The River', charge: 'Unauthorized Wetness Distribution', plaintiff: 'moss', defendant: 'river', witness: 'cloud' },
  { id: 'village-volcano-011', title: 'Seed Village v. The Volcano', charge: 'Hoarding Warmth During Public Germination', plaintiff: 'village', defendant: 'volcano', witness: 'moss' },
  { id: 'cloud-mountain-019', title: 'Cloud Wig Guild v. Mountain Shadow', charge: 'Custody Interference With Afternoon Shade', plaintiff: 'cloud', defendant: 'moon', witness: 'river' },
  { id: 'moon-tide-023', title: 'The Moon v. The Tide', charge: 'Plagiarism by Repetition', plaintiff: 'moon', defendant: 'river', witness: 'village' },
  { id: 'frog-brief-031', title: 'Amicus Frogae v. Everyone', charge: 'Failure To Consider Amphibious Feelings', plaintiff: 'moss', defendant: 'village', witness: 'cloud' },
]

export function hashSeed(seed: string) {
  let h = 2166136261
  for (const ch of seed) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function seeded(seed: string) {
  let t = hashSeed(seed) || 1
  return () => {
    t += 0x6D2B79F5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min))
const signed = (n: number) => `${n >= 0 ? '+' : ''}${Math.round(n)}`

export function createInitialState(seed = 'ryo-planet-0200'): PlanetState {
  const rnd = seeded(seed)
  const currentCase = cases[Math.floor(rnd() * cases.length)] ?? cases[0]
  const wetness = Math.round(34 + rnd() * 28)
  const moss = Math.round(28 + rnd() * 35)
  const river = Math.round(42 + rnd() * 36)
  const heat = Math.round(30 + rnd() * 40)
  return {
    seed,
    turn: 1,
    wetness,
    moss,
    river,
    villageTrust: Math.round(45 + rnd() * 25),
    cloudMood: Math.round(35 + rnd() * 40),
    heat,
    currentCase,
    precedents: ['The court recognizes tiny weather as testimony.'],
    transcript: [
      `Gavel impact detected. ${currentCase.title} opens.`,
      `Charge: ${currentCase.charge}. The planet wiggles under oath.`,
    ],
    interventions: [],
    weather: wetness > 70 ? 'drizzle' : 'clear',
    appealRisk: Math.round(rnd() * 20),
  }
}

function nextCase(state: PlanetState): CaseFile {
  const rnd = seeded(`${state.seed}:${state.turn}:${state.precedents.join('|')}:${state.wetness}:${state.heat}`)
  return cases[Math.floor(rnd() * cases.length)] ?? cases[0]
}

function caseMutation(state: PlanetState): Partial<PlanetState> {
  const constitutionalTension = state.precedents.length > 4 && state.appealRisk > 42
  return {
    currentCase: nextCase(state),
    weather: constitutionalTension ? 'constitutional-storm' : state.wetness > 72 ? 'storm' : state.wetness > 52 ? 'drizzle' : 'clear',
  }
}

export function applyEvent(state: PlanetState, event: PlanetEvent): PlanetState {
  switch (event.type) {
    case 'RAIN': {
      const amount = clamp(event.amount, 0, 30)
      const wetness = clamp(state.wetness + amount)
      const cloudMood = clamp(state.cloudMood - amount / 3 + 4)
      const moss = clamp(state.moss + amount * 0.55)
      const river = clamp(state.river + amount * 0.35)
      return {
        ...state,
        turn: state.turn + 1,
        wetness,
        moss,
        river,
        cloudMood,
        weather: amount > 16 ? 'storm' : 'drizzle',
        interventions: [`cloud squeezed for ${Math.round(amount)}mm testimony`, ...state.interventions].slice(0, 8),
        transcript: [`The cloud wig leaks ${Math.round(amount)}mm. Moss cheers ${signed(amount * 0.55)}; river swells ${signed(amount * 0.35)}.`, ...state.transcript].slice(0, 14),
      }
    }
    case 'DRAG_RIVER': {
      const delta = event.direction === 'toward-moss' ? 13 : event.direction === 'toward-village' ? -7 : -12
      const trustDelta = event.direction === 'toward-village' ? 12 : event.direction === 'toward-volcano' ? -10 : -3
      return {
        ...state,
        turn: state.turn + 1,
        river: clamp(state.river + delta),
        wetness: clamp(state.wetness + delta * 0.4),
        villageTrust: clamp(state.villageTrust + trustDelta),
        moss: clamp(state.moss + (event.direction === 'toward-moss' ? 10 : -5)),
        interventions: [`river redirected ${event.direction.replace('-', ' ')}`, ...state.interventions].slice(0, 8),
        transcript: [`Bailiff redraws the river ${event.direction}. Trust ${signed(trustDelta)}; wetness ${signed(delta * 0.4)}.`, ...state.transcript].slice(0, 14),
      }
    }
    case 'RAISE_TERRAIN': {
      const amount = clamp(event.amount, -20, 20)
      return {
        ...state,
        turn: state.turn + 1,
        river: clamp(state.river - amount * 0.45),
        heat: clamp(state.heat + amount * 0.25),
        appealRisk: clamp(state.appealRisk + Math.abs(amount) * 0.7),
        interventions: [`terrain altered by ${Math.round(amount)} legal cubits`, ...state.interventions].slice(0, 8),
        transcript: [`Terrain motion entered as Exhibit Hill. River ${signed(-amount * 0.45)}; appeal risk ${signed(Math.abs(amount) * 0.7)}.`, ...state.transcript].slice(0, 14),
      }
    }
    case 'RULE': {
      const effects: Record<Ruling, Partial<PlanetState> & { precedent: string; line: string }> = {
        'shared-custody': { wetness: clamp(state.wetness + 9), moss: clamp(state.moss + 8), river: clamp(state.river - 3), villageTrust: clamp(state.villageTrust + 7), precedent: 'Moisture is a public utility when frogs are present.', line: 'Shared custody creates a glittering wetland exhibit.' },
        'guilty-river': { river: clamp(state.river - 16), moss: clamp(state.moss + 6), appealRisk: clamp(state.appealRisk + 18), precedent: 'Rivers may apologize through tributaries but must keep flowing.', line: 'The river sulks into two apologetic tributaries.' },
        'guilty-moss': { moss: clamp(state.moss - 15), river: clamp(state.river + 9), villageTrust: clamp(state.villageTrust - 6), precedent: 'Moss picket lines require drainage permits.', line: 'Moss files a damp dissent in green ink.' },
        'trial-by-weather': { cloudMood: clamp(state.cloudMood + 18), wetness: clamp(state.wetness + 14), appealRisk: clamp(state.appealRisk + 9), precedent: 'Weather may serve as temporary jury if everyone is already wet.', line: 'The jury box fills with thunder and refuses direct questioning.' },
        'community-service': { villageTrust: clamp(state.villageTrust + 16), heat: clamp(state.heat - 4), appealRisk: clamp(state.appealRisk - 8), precedent: 'Natural forces may do community service by watering seedlings.', line: 'The defendant is sentenced to three rotations of helpful chores.' },
        'appeal-to-moon': { appealRisk: clamp(state.appealRisk + 25), cloudMood: clamp(state.cloudMood - 7), precedent: 'Shadows may testify only during eclipses.', line: 'The moon accepts appeal and stamps everything silver.' },
      }
      const chosen = effects[event.ruling]
      const updated = {
        ...state,
        ...chosen,
        turn: state.turn + 1,
        precedents: [chosen.precedent, ...state.precedents].slice(0, 7),
        transcript: [`RULING: ${event.ruling.replaceAll('-', ' ')}. ${chosen.line}`, ...state.transcript].slice(0, 14),
      }
      return { ...updated, ...caseMutation(updated) }
    }
    case 'WEIRD_MOTION': {
      const raw = event.text.trim().slice(0, 160)
      const funny = raw || 'silent motion filed by an embarrassed pebble'
      const apology = /sorry|apolog|謝|すみ|ごめん/i.test(funny)
      const moon = /moon|月|eclipse|shadow/i.test(funny)
      const wet = /rain|river|wet|水|雨|川|frog/i.test(funny)
      const precedent = apology
        ? 'Apologies are valid when expressed as small deltas.'
        : moon
          ? 'Lunar witnesses must disclose their phase before testimony.'
          : wet
            ? 'Wet evidence may drip but must not intimidate seedlings.'
            : 'Nonsense motions become folklore after one full rotation.'
      const updated = {
        ...state,
        turn: state.turn + 1,
        wetness: clamp(state.wetness + (wet ? 7 : 0)),
        appealRisk: clamp(state.appealRisk + (moon ? 12 : 5)),
        villageTrust: clamp(state.villageTrust + (apology ? 6 : -2)),
        precedents: [precedent, ...state.precedents].slice(0, 7),
        interventions: [`weird motion: “${funny}”`, ...state.interventions].slice(0, 8),
        transcript: [`Clerk translates “${funny}” into precedent: ${precedent}`, ...state.transcript].slice(0, 14),
      }
      return { ...updated, ...caseMutation(updated) }
    }
    case 'NEXT_CASE': {
      const updated = { ...state, turn: state.turn + 1, transcript: ['The clerk wheels in a new tiny dispute.', ...state.transcript].slice(0, 14) }
      return { ...updated, ...caseMutation(updated) }
    }
    case 'RESET':
      return createInitialState(event.seed)
    default:
      return state
  }
}

export function serializeState(state: PlanetState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

const factions: Faction[] = ['moss', 'river', 'village', 'cloud', 'volcano', 'moon']
const weathers: PlanetState['weather'][] = ['clear', 'drizzle', 'storm', 'constitutional-storm']

function isFaction(value: unknown): value is Faction {
  return typeof value === 'string' && factions.includes(value as Faction)
}

function isCaseFile(value: unknown): value is CaseFile {
  const candidate = value as CaseFile
  return Boolean(candidate)
    && typeof candidate.id === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.charge === 'string'
    && isFaction(candidate.plaintiff)
    && isFaction(candidate.defendant)
    && isFaction(candidate.witness)
}

function validateImportedState(parsed: PlanetState): PlanetState | null {
  if (!parsed.seed || typeof parsed.seed !== 'string' || !isCaseFile(parsed.currentCase)) return null
  if (!Array.isArray(parsed.precedents) || !Array.isArray(parsed.transcript) || !Array.isArray(parsed.interventions)) return null
  return {
    ...parsed,
    seed: parsed.seed.slice(0, 80),
    turn: Math.max(1, Math.min(999, Math.round(Number(parsed.turn) || 1))),
    wetness: clamp(parsed.wetness),
    moss: clamp(parsed.moss),
    river: clamp(parsed.river),
    villageTrust: clamp(parsed.villageTrust),
    cloudMood: clamp(parsed.cloudMood),
    heat: clamp(parsed.heat),
    appealRisk: clamp(parsed.appealRisk),
    weather: weathers.includes(parsed.weather) ? parsed.weather : 'clear',
    precedents: parsed.precedents.filter((p): p is string => typeof p === 'string').slice(0, 7).map((p) => p.slice(0, 220)),
    transcript: parsed.transcript.filter((p): p is string => typeof p === 'string').slice(0, 14).map((p) => p.slice(0, 280)),
    interventions: parsed.interventions.filter((p): p is string => typeof p === 'string').slice(0, 8).map((p) => p.slice(0, 200)),
  }
}

export function deserializeState(code: string): PlanetState | null {
  try {
    const padded = code.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((code.length + 3) % 4)
    const parsed = JSON.parse(decodeURIComponent(escape(atob(padded)))) as PlanetState
    return validateImportedState(parsed)
  } catch {
    return null
  }
}

export function runScenario(seed: string, events: PlanetEvent[]) {
  return events.reduce(applyEvent, createInitialState(seed))
}

export const allRulings: Ruling[] = ['shared-custody', 'guilty-river', 'guilty-moss', 'trial-by-weather', 'community-service', 'appeal-to-moon']
