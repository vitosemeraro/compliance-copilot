import Modal from './Modal.jsx'
import { DOCS } from '../content.js'

export default function DocsModal({ t, lang, onClose }) {
  const sections = DOCS[lang]
  return (
    <Modal onClose={onClose} width={680}>
      <div style={{ padding: '20px 26px', borderBottom: '1px solid #ECEAF1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EFE7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" stroke="#5E2690" strokeWidth="1.7" strokeLinejoin="round" /><path d="M13 3v5h5M8 13h8M8 17h6" stroke="#5E2690" strokeWidth="1.7" strokeLinecap="round" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E' }}>{t.footerDocs}</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #ECEAF1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#6B6B80" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="cc-scroll" style={{ overflowY: 'auto', padding: '20px 26px 26px' }}>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#5E2690', marginBottom: 8 }}>{s.h}</div>
            {s.p.map((para, k) => (
              <div key={k} style={{ display: 'flex', gap: 9, fontSize: 13.5, lineHeight: 1.65, color: '#3A3A4A', marginBottom: 6 }}>
                <span style={{ color: '#C9B6E0', flex: 'none' }}>·</span>
                <span>{para}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ fontSize: 11.5, color: '#9A98A8', borderTop: '1px solid #F0EEF4', paddingTop: 14 }}>{t.demoData}</div>
      </div>
    </Modal>
  )
}
