import { useEffect, useState } from 'react'
import './App.css'
import { allRulings, applyEvent, createInitialState, deserializeState, serializeState, type PlanetState, type Ruling } from './simulation'
import { makeDebugAPI } from './debugApi'

function loadInitial(): PlanetState {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('state')
  const seed = params.get('seed') ?? 'ryo-planet-0200'
  if (encoded) return deserializeState(encoded) ?? createInitialState(seed)
  return createInitialState(seed)
}

const factionEmoji: Record<string, string> = {
  moss: '🟩', river: '💧', village: '🏘️', cloud: '☁️', volcano: '🌋', moon: '🌙'
}

function Planet({ state }: { state: PlanetState }) {
  const wet = state.wetness
  const moss = state.moss
  const heat = state.heat
  const storm = state.weather.includes('storm')
  return <div className="planet-wrap" role="img" aria-label="animated pocket planet courtroom diorama showing weather, river, moss, village, volcano, moon, and court scale">
    <div className={`wig ${storm ? 'storm' : ''}`}>⚖️</div>
    <div className="planet" style={{ ['--wet' as string]: `${wet}%`, ['--moss' as string]: `${moss}%`, ['--heat' as string]: `${heat}%` }}>
      <span className="river">〰〰</span>
      <span className="moss moss-a">苔</span>
      <span className="moss moss-b">moss</span>
      <span className="village">⌂⌂</span>
      <span className="volcano">▲</span>
    </div>
    <div className="orbit moon">🌙</div>
    <div className="orbit cloud">☁️</div>
    <div className="weather-label">{state.weather.replace('-', ' ')}</div>
  </div>
}

function Meter({ label, value, icon }: { label: string; value: number; icon: string }) {
  return <div className="meter"><span>{icon} {label}</span><b>{Math.round(value)}</b><div><i style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></div></div>
}

function App() {
  const [state, setState] = useState<PlanetState>(loadInitial)
  const [motion, setMotion] = useState('make the river apologize but keep its job')
  const [importText, setImportText] = useState('')

  useEffect(() => {
    const debugApi = makeDebugAPI(() => state, setState)
    window.__PLANET_COURT__ = debugApi
    return () => { delete window.__PLANET_COURT__ }
  }, [state])

  useEffect(() => {
    try {
      const code = serializeState(state)
      const url = new URL(window.location.href)
      url.searchParams.set('state', code)
      window.history.replaceState(null, '', url)
    } catch {
      // URL state is best-effort; debug export still works.
    }
  }, [state])

  const dispatch = (event: Parameters<typeof applyEvent>[1]) => setState((s) => applyEvent(s, event))
  const exportCode = serializeState(state)

  const importState = () => {
    const parsed = deserializeState(importText.trim())
    if (parsed) setState(parsed)
    else dispatch({ type: 'WEIRD_MOTION', text: `invalid import evidence: ${importText.slice(0, 60)}` })
  }

  return <main>
    <header className="hero">
      <div>
        <p className="eyebrow">Pocket Planet Courtroom · deterministic ecology court</p>
        <h1>小さな惑星に判決を下す。判例は物理法則になる。</h1>
        <p className="lead">苔・川・雲・村がくだらないけど深刻な訴訟を起こします。雨を降らせ、川を曲げ、判決スタンプを押すと、次の事件と惑星の憲法が変わります。</p>
      </div>
      <div className="case-card" aria-live="polite">
        <span>CASE {String(state.turn).padStart(3, '0')}</span>
        <h2>{state.currentCase.title}</h2>
        <p>Charge: “{state.currentCase.charge}”</p>
        <small>{factionEmoji[state.currentCase.plaintiff]} plaintiff · {factionEmoji[state.currentCase.defendant]} defendant · {factionEmoji[state.currentCase.witness]} witness</small>
      </div>
    </header>

    <section className="court-grid">
      <article className="planet-panel">
        <Planet state={state} />
        <div className="controls" aria-label="planet interventions">
          <button onClick={() => dispatch({ type: 'RAIN', amount: 9 })}>☁️ Squeeze cloud / 雨を証言させる</button>
          <button onClick={() => dispatch({ type: 'DRAG_RIVER', direction: 'toward-moss' })}>💧 Drag river toward moss</button>
          <button onClick={() => dispatch({ type: 'DRAG_RIVER', direction: 'toward-village' })}>🏘️ Redirect river to village</button>
          <button onClick={() => dispatch({ type: 'RAISE_TERRAIN', amount: 12 })}>⛰️ Raise Exhibit Hill</button>
        </div>
      </article>

      <aside className="docket">
        <h3>Live ecology meters</h3>
        <Meter label="wetness" value={state.wetness} icon="💦" />
        <Meter label="moss power" value={state.moss} icon="🟩" />
        <Meter label="river ego" value={state.river} icon="💧" />
        <Meter label="village trust" value={state.villageTrust} icon="🏘️" />
        <Meter label="cloud mood" value={state.cloudMood} icon="☁️" />
        <Meter label="appeal risk" value={state.appealRisk} icon="📜" />
      </aside>
    </section>

    <section className="rulings">
      <h3>判決スタンプ</h3>
      <div className="stamp-row">
        {allRulings.map((ruling: Ruling) => <button key={ruling} className="stamp" onClick={() => dispatch({ type: 'RULE', ruling })}>{ruling.replaceAll('-', ' ')}</button>)}
      </div>
    </section>

    <section className="motion-box">
      <div>
        <h3>Weird motion parser</h3>
        <p>変な入力を「判例」と「物理変化」に変換します。日本語・絵文字・長文も切り詰めて扱います。</p>
      </div>
      <label>Motion text<textarea value={motion} onChange={(e) => setMotion(e.target.value)} /></label>
      <button onClick={() => dispatch({ type: 'WEIRD_MOTION', text: motion })}>File motion as living precedent</button>
    </section>

    <section className="history-grid">
      <article>
        <h3>Planet constitution / precedents</h3>
        <ol>{state.precedents.map((p, i) => <li key={`${p}-${i}`}>{p}</li>)}</ol>
      </article>
      <article>
        <h3>Wet transcript</h3>
        <ul className="transcript">{state.transcript.map((line, i) => <li key={`${line}-${i}`}>{line}</li>)}</ul>
      </article>
    </section>

    <section className="debug-panel">
      <h3>AI control surface</h3>
      <p>CLI/API/browser debug: <code>window.__PLANET_COURT__.rain(12)</code>, <code>.rule('shared-custody')</code>, <code>.motion('月が川を謝らせたい')</code>, <code>.export()</code></p>
      <div className="debug-actions">
        <button onClick={() => navigator.clipboard?.writeText(exportCode).catch(() => setImportText(exportCode))}>Copy export code</button>
        <button onClick={() => dispatch({ type: 'NEXT_CASE' })}>Next case</button>
        <button onClick={() => setState(createInitialState(`ryo-${Date.now().toString(36)}`))}>New seeded planet</button>
      </div>
      <label>Import/export JSON-safe state code<textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={exportCode.slice(0, 90) + '…'} /></label>
      <button onClick={importState}>Import as evidence</button>
    </section>
  </main>
}

export default App
