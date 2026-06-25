import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import ChatScreen from './screens/ChatScreen.jsx'
import AuditScreen from './screens/AuditScreen.jsx'
import DashboardScreen from './screens/DashboardScreen.jsx'
import AdoptionScreen from './screens/AdoptionScreen.jsx'
import ReviewQueueScreen from './screens/ReviewQueueScreen.jsx'
import Onboarding from './components/Onboarding.jsx'
import DocsModal from './components/DocsModal.jsx'
import Architecture from './components/Architecture.jsx'
import Gate from './components/Gate.jsx'
import PoolModal from './components/PoolModal.jsx'
import { STRINGS, SCREEN_META } from './i18n.js'
import { api } from './api.js'

const ASSISTANT = ['chat']
const THREAD_KEY = 'cc_thread'

// Normalizza un'interazione dell'audit nello stesso formato di una risposta /ask,
// così può essere mostrata e revalidata nel thread.
function rowToTurn(row, threshold) {
  return {
    id: row.id,
    question: row.question,
    lang: row.lang,
    segments: row.answer_segments || [],
    confidence: row.confidence,
    threshold,
    grounded: row.grounded,
    out_of_corpus: row.out_of_corpus,
    needs_review: row.needs_review,
    guardrail: { triggered: !!row.guardrail, terms: row.guardrail_terms || [] },
    sources: row.sources_full || [],
    engine: row.engine,
    rationale: row.rationale || '',
    verdict: row.outcome || null,
    vote: row.vote || null,
    reopened: true,
  }
}

const footerBtn = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#7A6A92', fontSize: 11,
  fontWeight: 600, padding: '3px 7px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
}

export default function App() {
  const [lang, setLang] = useState('it')
  const [screen, setScreen] = useState('chat')
  const [navTick, setNavTick] = useState(0)
  const [cfg, setCfg] = useState({ engine: 'fallback', model: null, mcp_tools: [], confidence_threshold: 60 })
  const [modal, setModal] = useState(null) // 'onboarding' | 'docs' | 'arch' | 'pool' | null
  const [authed, setAuthed] = useState(null) // null = verifica in corso
  const [injected, setInjected] = useState(null) // domanda inserita da pool/comando
  const [thread, setThread] = useState(() => {
    try { return JSON.parse(localStorage.getItem(THREAD_KEY) || '[]') } catch { return [] }
  })
  const [focusId, setFocusId] = useState(null) // turno su cui posizionarsi (apertura da audit)

  // Persistenza del thread: non si perde con navigazione o uscita accidentale.
  useEffect(() => {
    try { localStorage.setItem(THREAD_KEY, JSON.stringify(thread.slice(-20))) } catch { /* quota */ }
  }, [thread])

  // Bootstrap: carica config e verifica se serve la password.
  useEffect(() => {
    api.config().then((c) => {
      setCfg(c)
      if (!c.auth_required) { setAuthed(true); return }
      api.check().then(() => setAuthed(true)).catch(() => setAuthed(false))
    }).catch(() => setAuthed(true))
  }, [])

  // Onboarding automatico al primo accesso (dopo l'autenticazione).
  useEffect(() => {
    if (authed && !localStorage.getItem('cc_onboarded')) setModal('onboarding')
  }, [authed])

  function closeModal() {
    if (modal === 'onboarding') localStorage.setItem('cc_onboarded', '1')
    setModal(null)
  }

  function openOnboarding() {
    // Il tour evidenzia elementi della schermata Chat: assicuriamoci di essere lì.
    if (!ASSISTANT.includes(screen)) { setScreen('chat'); setNavTick((n) => n + 1) }
    setModal('onboarding')
  }

  const t = STRINGS[lang]
  const meta = SCREEN_META[screen][lang]

  function onNav(next) {
    setInjected(null) // navigazione manuale → chat pulita
    setScreen(next)
    if (ASSISTANT.includes(next)) setNavTick((n) => n + 1)
  }

  // Domanda scelta dal pannello "Domande demo": va in Chat, pronta da inviare.
  function pickFromPool(q) {
    setInjected(q)
    setScreen('chat')
    setNavTick((n) => n + 1)
    setModal(null)
  }

  // Apertura di un'interazione dal trail: la porta nel thread (per rileggere
  // risposta e fonti e cambiarne l'esito). Se è una riga legacy senza risposta
  // salvata, ripropone la domanda nell'input.
  async function onOpenInteraction(id) {
    try {
      const row = await api.interaction(id)
      setScreen('chat')
      setNavTick((n) => n + 1)
      if (row.answer_segments && row.answer_segments.length) {
        const turn = rowToTurn(row, cfg.confidence_threshold)
        setInjected(null)
        setThread((prev) => (prev.some((tt) => tt.id === turn.id)
          ? prev.map((tt) => (tt.id === turn.id ? turn : tt))
          : [...prev, turn]))
        setFocusId(id)
      } else {
        setInjected(row.question) // legacy/seed → riproponi la domanda
      }
    } catch { /* 404 / rete */ }
  }

  const presetKey = `${screen}-${lang}-${navTick}`
  // Cosa preriempire nell'input (mai inviata in automatico):
  //  · domanda dal pool → quella; · "Confidenza bassa" → una low; · "Guardrail" → una guardrail; · Chat → vuoto.
  const preset = useMemo(() => injected || null, [presetKey]) // eslint-disable-line react-hooks/exhaustive-deps

  let content
  if (screen === 'audit') content = <AuditScreen t={t} onOpenInteraction={onOpenInteraction} />
  else if (screen === 'dashboard') content = <DashboardScreen t={t} lang={lang} />
  else if (screen === 'adoption') content = <AdoptionScreen t={t} lang={lang} />
  else if (screen === 'review') content = <ReviewQueueScreen t={t} onOpenInteraction={onOpenInteraction} />
  else content = (
    <ChatScreen
      t={t} lang={lang} preset={preset} presetKey={presetKey}
      thread={thread} setThread={setThread} threshold={cfg.confidence_threshold}
      focusId={focusId} onFocusDone={() => setFocusId(null)}
      onShowPool={() => setModal('pool')}
    />
  )

  if (authed === null) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="cc-spinner" /></div>
  }
  if (authed === false) {
    return <Gate t={t} onAuthed={() => setAuthed(true)} />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <Sidebar t={t} screen={screen} onNav={onNav} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar title={meta[0]} sub={meta[1]} lang={lang} onLang={setLang} engine={cfg.engine} model={cfg.model} t={t} onHelp={openOnboarding} />
        <div className="cc-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {content}
        </div>
        <footer style={{
          flex: 'none', minHeight: 30, borderTop: '1px solid #ECEAF1', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 0 20px',
          fontSize: 11, color: '#9A98A8', gap: 12,
        }}>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.demoData}</span>
          <div data-tour="footer" style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
            <button onClick={() => setModal('pool')} style={footerBtn} title={t.poolTitle}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3l1.9 4.6L19 9l-3.5 3.6L16.5 18 12 15.4 7.5 18l1-5.4L5 9l5.1-1.4L12 3z" stroke="#7A6A92" strokeWidth="1.6" strokeLinejoin="round" /></svg>
              {t.poolTitle}
            </button>
            <button onClick={() => setModal('docs')} style={footerBtn} title={t.footerDocs}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" stroke="#7A6A92" strokeWidth="1.7" strokeLinejoin="round" /><path d="M13 3v5h5" stroke="#7A6A92" strokeWidth="1.7" strokeLinejoin="round" /></svg>
              {t.footerDocs}
            </button>
            <button onClick={() => setModal('arch')} style={footerBtn} title={t.footerArch}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 7h7v6H3V7zm11 0h7v10h-7V7z" stroke="#7A6A92" strokeWidth="1.6" strokeLinejoin="round" /></svg>
              {t.footerArch}
            </button>
            <span style={{ width: 1, height: 14, background: '#E7E5EC' }} />
            <span style={{ fontFamily: "'Geist Mono',monospace", color: '#A7A4B5' }}>MCP · {cfg.mcp_tools.length ? cfg.mcp_tools.join(' · ') : '—'}</span>
          </div>
        </footer>
      </main>

      {modal === 'onboarding' && <Onboarding t={t} lang={lang} onClose={closeModal} />}
      {modal === 'docs' && <DocsModal t={t} lang={lang} onClose={closeModal} />}
      {modal === 'arch' && <Architecture t={t} lang={lang} onClose={closeModal} />}
      {modal === 'pool' && <PoolModal t={t} lang={lang} onPick={pickFromPool} onClose={closeModal} />}
    </div>
  )
}
