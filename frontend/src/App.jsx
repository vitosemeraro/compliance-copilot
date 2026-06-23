import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import ChatScreen from './screens/ChatScreen.jsx'
import AuditScreen from './screens/AuditScreen.jsx'
import DashboardScreen from './screens/DashboardScreen.jsx'
import Onboarding from './components/Onboarding.jsx'
import DocsModal from './components/DocsModal.jsx'
import Architecture from './components/Architecture.jsx'
import Gate from './components/Gate.jsx'
import { STRINGS, SCREEN_META, DEMO_QUESTIONS } from './i18n.js'
import { api } from './api.js'

const ASSISTANT = ['chat', 'escalation', 'guardrail']

const footerBtn = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#7A6A92', fontSize: 11,
  fontWeight: 600, padding: '3px 7px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
}

export default function App() {
  const [lang, setLang] = useState('it')
  const [screen, setScreen] = useState('chat')
  const [navTick, setNavTick] = useState(0)
  const [cfg, setCfg] = useState({ engine: 'fallback', model: null, mcp_tools: [], confidence_threshold: 60 })
  const [modal, setModal] = useState(null) // 'onboarding' | 'docs' | 'arch' | null
  const [authed, setAuthed] = useState(null) // null = verifica in corso

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
    setScreen(next)
    if (ASSISTANT.includes(next)) setNavTick((n) => n + 1)
  }

  const preset = ASSISTANT.includes(screen) ? DEMO_QUESTIONS[screen]?.[lang] : null
  const presetKey = `${screen}-${lang}-${navTick}`

  const content = useMemo(() => {
    if (screen === 'audit') return <AuditScreen t={t} />
    if (screen === 'dashboard') return <DashboardScreen t={t} lang={lang} />
    return <ChatScreen t={t} lang={lang} preset={preset} presetKey={presetKey} />
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, lang, presetKey])

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
    </div>
  )
}
