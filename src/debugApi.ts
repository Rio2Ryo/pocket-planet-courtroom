import { allRulings, applyEvent, createInitialState, serializeState, deserializeState, type PlanetEvent, type PlanetState, type Ruling } from './simulation'

export type DebugStateSetter = (next: PlanetState | ((previous: PlanetState) => PlanetState)) => void

export type DebugAPI = {
  getState: () => PlanetState
  dispatch: (event: PlanetEvent) => PlanetState
  rain: (amount?: number) => PlanetState
  rule: (ruling: Ruling | string) => PlanetState
  motion: (text: string) => PlanetState
  export: () => string
  import: (code: string) => PlanetState | null
  reset: (seed?: string) => PlanetState
}

export function makeDebugAPI(getState: () => PlanetState, setState: DebugStateSetter): DebugAPI {
  let current = getState()
  const sync = (next: PlanetState) => {
    current = next
    setState(next)
    return next
  }
  const dispatch = (event: PlanetEvent) => sync(applyEvent(current, event))
  return {
    getState: () => current,
    dispatch,
    rain: (amount = 8) => dispatch({ type: 'RAIN', amount }),
    rule: (ruling) => allRulings.includes(ruling as Ruling)
      ? dispatch({ type: 'RULE', ruling: ruling as Ruling })
      : dispatch({ type: 'WEIRD_MOTION', text: `invalid ruling motion: ${String(ruling).slice(0, 80)}` }),
    motion: (text) => dispatch({ type: 'WEIRD_MOTION', text }),
    export: () => serializeState(current),
    import: (code) => {
      const next = deserializeState(code)
      if (next) sync(next)
      return next
    },
    reset: (seed = 'debug-planet') => sync(createInitialState(seed)),
  }
}

declare global {
  interface Window {
    __PLANET_COURT__?: DebugAPI
  }
}
