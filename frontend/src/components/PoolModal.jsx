import Modal from './Modal.jsx'
import { QUESTION_POOL } from '../content.js'

const CATS = [
  { key: 'general', color: '#15803D', bg: '#DCFCE7', cmd: '/chat' },
  { key: 'low', color: '#B45309', bg: '#FEF3C7', cmd: '/chat low' },
  { key: 'guardrail', color: '#5E2690', bg: '#EFE7F7', cmd: '/chat guardrail' },
]

const LABEL = { general: 'poolGeneral', low: 'poolLow', guardrail: 'poolGuardrail' }

export default function PoolModal({ t, lang, onPick, onClose }) {
  const pool = QUESTION_POOL[lang] || QUESTION_POOL.it
  return (
    <Modal onClose={onClose} width={680}>
      <div style={{ padding: '20px 26px', borderBottom: '1px solid #ECEAF1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EFE7F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l1.9 4.6L19 9l-3.5 3.6L16.5 18 12 15.4 7.5 18l1-5.4L5 9l5.1-1.4L12 3z" stroke="#5E2690" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E' }}>{t.poolTitle}</div>
            <div style={{ fontSize: 12, color: '#8C8A99' }}>{t.poolSub}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #ECEAF1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#6B6B80" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="cc-scroll" style={{ overflowY: 'auto', padding: '18px 26px 24px' }}>
        {CATS.map((c) => (
          <div key={c.key} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.color, background: c.bg, padding: '4px 10px', borderRadius: 999 }}>{t[LABEL[c.key]]}</span>
              <code style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: '#9A98A8' }}>{c.cmd}</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pool[c.key].map((q) => (
                <button
                  key={q}
                  onClick={() => onPick(q)}
                  style={{ textAlign: 'left', width: '100%', cursor: 'pointer', background: '#fff', border: '1px solid #ECEAF1', borderRadius: 10, padding: '10px 13px', fontSize: 13.5, color: '#26243A', lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D8CFE6'; e.currentTarget.style.background = '#FBFAFD' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ECEAF1'; e.currentTarget.style.background = '#fff' }}
                >
                  <span>{q}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flex: 'none' }}><path d="M5 12h14M13 6l6 6-6 6" stroke="#9A4FCE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
