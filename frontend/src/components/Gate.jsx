import { useState } from 'react'
import { api } from '../api.js'

// Schermata di accesso mostrata quando il backend richiede una password.
export default function Gate({ t, onAuthed }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!pw || busy) return
    setBusy(true); setError(false)
    api.setPassword(pw)
    try {
      await api.check()
      onAuthed()
    } catch {
      api.setPassword('')
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#FBF6FF,#FAFAFC)' }}>
      <div className="cc-fade" style={{ width: 360, maxWidth: '92vw', background: '#fff', border: '1px solid #ECEAF1', borderRadius: 18, boxShadow: '0 18px 50px rgba(46,26,80,.12)', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#7B30B0,#5E2690)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(94,38,144,.28)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5 5L20 6.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.12em', color: '#9A78C2' }}>PRIMA · COMPLIANCE</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E' }}>Compliance Copilot</div>
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>{t.gateTitle}</div>
        <div style={{ fontSize: 13, color: '#8C8A99', marginBottom: 16, lineHeight: 1.5 }}>{t.gateSub}</div>

        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder={t.gatePlaceholder}
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: `1px solid ${error ? '#E4A0A0' : '#ECEAF1'}`, outline: 'none', fontSize: 14, color: '#1A1A2E', background: '#F7F5FA' }}
        />
        {error && <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 8 }}>{t.gateError}</div>}

        <button
          onClick={submit}
          disabled={busy}
          style={{ marginTop: 16, width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', cursor: busy ? 'default' : 'pointer', background: 'linear-gradient(135deg,#7B30B0,#5E2690)', color: '#fff', fontSize: 14, fontWeight: 600, boxShadow: '0 3px 10px rgba(94,38,144,.28)', opacity: busy ? 0.7 : 1 }}
        >{t.gateBtn}</button>
      </div>
    </div>
  )
}
