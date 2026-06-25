import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { IconAlert, IconArrow } from '../components/icons.jsx'

function confChip(c) {
  const col = c >= 80 ? ['#DCFCE7', '#15803D'] : c >= 60 ? ['#FEF3C7', '#B45309'] : ['#FEE2E2', '#B91C1C']
  return { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 52, height: 52, borderRadius: 12, background: col[0], color: col[1], fontSize: 16, fontWeight: 700, flex: 'none', flexDirection: 'column' }
}

function fmtDate(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function ReviewQueueScreen({ t, onOpenInteraction }) {
  const [rows, setRows] = useState(null)

  useEffect(() => { api.audit('', 'rev').then((d) => setRows(d.rows)).catch(() => setRows([])) }, [])

  if (!rows) return <div style={{ padding: 40, color: '#9A98A8' }}>…</div>

  return (
    <div style={{ padding: '28px 32px 44px', maxWidth: 920 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <IconAlert stroke="#B45309" size={20} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#1A1A2E' }}>{rows.length}</div>
        <div style={{ fontSize: 14, color: '#8C8A99' }}>{t.reviewCount}</div>
      </div>
      <div style={{ fontSize: 13, color: '#9A98A8', marginBottom: 20, lineHeight: 1.5, maxWidth: 560 }}>{t.reviewIntro}</div>

      {rows.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #ECEAF1', borderRadius: 14, padding: '40px 24px', textAlign: 'center', color: '#8C8A99', fontSize: 14 }}>{t.reviewEmpty}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #ECEAF1', borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 14px rgba(46,26,80,.04)' }}>
              <div style={confChip(r.confidence)}>
                <span>{r.confidence}%</span>
                <span style={{ fontSize: 8.5, fontWeight: 600, opacity: 0.8 }}>conf.</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.4, marginBottom: 5 }}>{r.question}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#8C8A99', flexWrap: 'wrap' }}>
                  <span>{r.user}</span>
                  <span style={{ fontFamily: "'Geist Mono',monospace" }}>{fmtDate(r.ts)}</span>
                  <span>· {(r.sources || []).length} {t.colSources?.toLowerCase?.() || 'fonti'}</span>
                  {r.guardrail && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, color: '#5E2690', background: '#EFE7F7', padding: '2px 8px', borderRadius: 999 }}>🛡️ {t.reviewGuardrailTag}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onOpenInteraction && onOpenInteraction(r.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7B30B0,#5E2690)', color: '#fff', fontSize: 13.5, fontWeight: 600, boxShadow: '0 3px 10px rgba(94,38,144,.28)', flex: 'none' }}
              >
                {t.reviewOpen} <IconArrow size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
