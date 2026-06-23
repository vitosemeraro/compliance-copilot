import Modal from './Modal.jsx'

const L = {
  it: {
    title: 'Architettura', flow: 'Flusso di una domanda',
    request: 'domanda  ·  risposta',
    steps: [
      'L’utente invia la domanda dalla UI all’orchestratore.',
      'L’orchestratore interroga il vector store tramite il server MCP (retrieval reale, non simulato).',
      'Le fonti recuperate + le regole di grounding vanno a Claude, che risponde con citazioni e confidenza.',
      'Il layer di governance applica soglia di escalation e guardrail anti-discriminazione.',
      'L’interazione è scritta nell’audit trail immutabile e torna alla UI.',
    ],
    fe: 'Frontend', feSub: 'React + Vite · 5 schermate',
    be: 'Orchestratore', beSub: 'FastAPI',
    retr: 'Retrieval via MCP', mcp: 'MCP server “corpus”', vec: 'Vector store Chroma',
    claude: 'Claude API', claudeSub: 'grounding · citazioni',
    gov: 'Governance', govSub: 'confidenza · escalation · HITL · guardrail',
    audit: 'Audit trail', auditSub: 'append-only · SHA-256',
  },
  en: {
    title: 'Architecture', flow: 'How a question flows',
    request: 'question  ·  answer',
    steps: [
      'The user sends the question from the UI to the orchestrator.',
      'The orchestrator queries the vector store via the MCP server (real retrieval, not simulated).',
      'Retrieved sources + grounding rules go to Claude, which answers with citations and confidence.',
      'The governance layer applies the escalation threshold and the anti-discrimination guardrail.',
      'The interaction is written to the immutable audit trail and returns to the UI.',
    ],
    fe: 'Frontend', feSub: 'React + Vite · 5 screens',
    be: 'Orchestrator', beSub: 'FastAPI',
    retr: 'Retrieval via MCP', mcp: 'MCP server “corpus”', vec: 'Chroma vector store',
    claude: 'Claude API', claudeSub: 'grounding · citations',
    gov: 'Governance', govSub: 'confidence · escalation · HITL · guardrail',
    audit: 'Audit trail', auditSub: 'append-only · SHA-256',
  },
}

function Badge({ n, color }) {
  return <span style={{ width: 19, height: 19, borderRadius: '50%', background: color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{n}</span>
}

const card = (bg, border) => ({
  background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 14px',
})

function DownArrow({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#B7A6D0' }}>
      {label && <span style={{ fontSize: 10.5, color: '#9A98A8', fontFamily: "'Geist Mono',monospace" }}>{label}</span>}
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none"><path d="M8 1v15m0 0l-5-5m5 5l5-5" stroke="#C9B6E0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  )
}

export default function Architecture({ t, lang, onClose }) {
  const a = L[lang]
  return (
    <Modal onClose={onClose} width={720}>
      <div style={{ padding: '20px 26px', borderBottom: '1px solid #ECEAF1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EFE7F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 7h7v6H3V7zm11 0h7v10h-7V7z" stroke="#5E2690" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E' }}>{a.title}</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #ECEAF1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#6B6B80" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="cc-scroll" style={{ overflowY: 'auto', padding: '22px 26px 24px' }}>
        {/* diagramma in HTML: i box si adattano al testo, niente overflow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ ...card('#FBFAFD', '#E2DEEA'), width: 280, textAlign: 'center' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1A2E' }}>{a.fe}</div>
            <div style={{ fontSize: 11, color: '#9A98A8', fontFamily: "'Geist Mono',monospace", marginTop: 2 }}>{a.feSub}</div>
          </div>

          <DownArrow label={a.request} />

          <div style={{ ...card('#EFE7F7', '#C9B6E0'), width: 300, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#5E2690' }}>{a.be}</div>
            <div style={{ fontSize: 11, color: '#9A7BBE', fontFamily: "'Geist Mono',monospace", marginTop: 2 }}>{a.beSub}</div>
          </div>

          <DownArrow />

          {/* dipendenze dell'orchestratore */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, width: '100%' }}>
            {/* retrieval via MCP → Chroma */}
            <div style={card('#fff', '#C9B6E0')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Badge n="2" color="#5E2690" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#5E2690' }}>{a.retr}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#3A3A4A', background: '#FBFAFD', border: '1px solid #EEE9F4', borderRadius: 8, padding: '6px 9px', marginBottom: 5 }}>{a.mcp}</div>
              <div style={{ textAlign: 'center', color: '#C9B6E0', fontSize: 12, lineHeight: 1 }}>↓</div>
              <div style={{ fontSize: 11.5, color: '#3A3A4A', background: '#FBFAFD', border: '1px solid #EEE9F4', borderRadius: 8, padding: '6px 9px', marginTop: 5 }}>{a.vec}</div>
            </div>

            {/* Claude */}
            <div style={card('#DBEAFE', '#A9C4F5')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Badge n="3" color="#1E50C8" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1E50C8' }}>{a.claude}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#3A5BA0', lineHeight: 1.5 }}>{a.claudeSub}</div>
            </div>

            {/* Governance */}
            <div style={card('#FFFBF0', '#F4E6C2')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Badge n="4" color="#B45309" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#92500A' }}>{a.gov}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#8A6516', lineHeight: 1.5 }}>{a.govSub}</div>
            </div>

            {/* Audit */}
            <div style={card('#2A2140', '#2E2747')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Badge n="5" color="#7B4FB0" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{a.audit}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#A99FC4', lineHeight: 1.5 }}>{a.auditSub}</div>
            </div>
          </div>
        </div>

        {/* flusso numerato */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5E2690', marginBottom: 10 }}>{a.flow}</div>
          {a.steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#EFE7F7', color: '#5E2690', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.6, color: '#3A3A4A' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
