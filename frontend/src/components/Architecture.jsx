import Modal from './Modal.jsx'

const L = {
  it: {
    title: 'Architettura', flow: 'Flusso di una domanda',
    steps: [
      'L’utente invia la domanda dalla UI all’orchestratore.',
      'L’orchestratore interroga il vector store tramite il server MCP (retrieval reale, non simulato).',
      'Le fonti recuperate + le regole di grounding vanno a Claude, che risponde con citazioni e confidenza.',
      'Il layer di governance applica soglia di escalation e guardrail anti-discriminazione.',
      'L’interazione è scritta nell’audit trail immutabile e torna alla UI.',
    ],
    fe: 'Frontend', feSub: 'React + Vite · 5 schermate',
    be: 'Orchestratore', beSub: 'FastAPI',
    claude: 'Claude API', claudeSub: 'grounding',
    mcp: 'MCP server “corpus”', mcpSub: 'stdio · search/get/list',
    vec: 'Vector store', vecSub: 'Chroma · embedding locale',
    gov: 'Governance', govSub: 'confidenza · escalation · HITL · guardrail',
    audit: 'Audit trail', auditSub: 'JSONL append-only · SHA-256',
  },
  en: {
    title: 'Architecture', flow: 'How a question flows',
    steps: [
      'The user sends the question from the UI to the orchestrator.',
      'The orchestrator queries the vector store via the MCP server (real retrieval, not simulated).',
      'Retrieved sources + grounding rules go to Claude, which answers with citations and confidence.',
      'The governance layer applies the escalation threshold and the anti-discrimination guardrail.',
      'The interaction is written to the immutable audit trail and returns to the UI.',
    ],
    fe: 'Frontend', feSub: 'React + Vite · 5 screens',
    be: 'Orchestrator', beSub: 'FastAPI',
    claude: 'Claude API', claudeSub: 'grounding',
    mcp: 'MCP server “corpus”', mcpSub: 'stdio · search/get/list',
    vec: 'Vector store', vecSub: 'Chroma · local embedding',
    gov: 'Governance', govSub: 'confidence · escalation · HITL · guardrail',
    audit: 'Audit trail', auditSub: 'append-only JSONL · SHA-256',
  },
}

function Box({ x, y, w, h, title, sub, fill, stroke, color, subColor, badge }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="12" fill={fill} stroke={stroke} strokeWidth="1.5" />
      {badge != null && (
        <g>
          <circle cx={x + 16} cy={y + 16} r="9" fill={color} />
          <text x={x + 16} y={y + 19.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{badge}</text>
        </g>
      )}
      <text x={x + w / 2} y={y + h / 2 - 2} textAnchor="middle" fontSize="13.5" fontWeight="600" fill={color}>{title}</text>
      <text x={x + w / 2} y={y + h / 2 + 15} textAnchor="middle" fontSize="10.5" fill={subColor} fontFamily="'Geist Mono',monospace">{sub}</text>
    </g>
  )
}

export default function Architecture({ t, lang, onClose }) {
  const a = L[lang]
  return (
    <Modal onClose={onClose} width={760}>
      <div style={{ padding: '20px 26px', borderBottom: '1px solid #ECEAF1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EFE7F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 7h7v6H3V7zm11 0h7v10h-7V7zM3 17h7v0M7 13v4" stroke="#5E2690" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E' }}>{a.title}</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #ECEAF1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#6B6B80" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="cc-scroll" style={{ overflowY: 'auto', padding: '18px 22px 24px' }}>
        <svg viewBox="0 0 700 330" style={{ width: '100%', display: 'block' }}>
          <defs>
            <marker id="arr" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0 0L8 4.5L0 9z" fill="#B7A6D0" />
            </marker>
          </defs>

          {/* connettori */}
          <g stroke="#C9B6E0" strokeWidth="1.8" fill="none" markerEnd="url(#arr)">
            <path d="M180 60 H250" />
            <path d="M450 60 H520" />
            <path d="M350 92 V150" />
            <path d="M450 180 H520" />
            <path d="M250 180 H180" />
            <path d="M120 210 V250" />
          </g>

          <Box x={40} y={36} w={140} h={48} title={a.fe} sub={a.feSub} fill="#FBFAFD" stroke="#E2DEEA" color="#1A1A2E" subColor="#9A98A8" badge="1" />
          <Box x={250} y={36} w={200} h={48} title={a.be} sub={a.beSub} fill="#EFE7F7" stroke="#C9B6E0" color="#5E2690" subColor="#9A7BBE" />
          <Box x={520} y={36} w={150} h={48} title={a.claude} sub={a.claudeSub} fill="#DBEAFE" stroke="#A9C4F5" color="#1E50C8" subColor="#5E82CC" badge="3" />

          <Box x={250} y={150} w={200} h={48} title={a.mcp} sub={a.mcpSub} fill="#fff" stroke="#C9B6E0" color="#5E2690" subColor="#9A7BBE" badge="2" />
          <Box x={520} y={150} w={150} h={48} title={a.vec} sub={a.vecSub} fill="#FBFAFD" stroke="#E2DEEA" color="#1A1A2E" subColor="#9A98A8" />

          <Box x={40} y={150} w={140} h={48} title={a.gov} sub={a.govSub} fill="#FFFBF0" stroke="#F4E6C2" color="#92500A" subColor="#B08A4A" badge="4" />
          <Box x={40} y={250} w={200} h={48} title={a.audit} sub={a.auditSub} fill="#2A2140" stroke="#2E2747" color="#fff" subColor="#A99FC4" badge="5" />
        </svg>

        <div style={{ marginTop: 14 }}>
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
