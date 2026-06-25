import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { IconSearch, IconDownload, IconCheck } from '../components/icons.jsx'

const GRID = '150px 132px minmax(0,1fr) 70px 92px 118px'

function confChip(c) {
  const col = c >= 80 ? ['#DCFCE7', '#15803D'] : c >= 60 ? ['#FEF3C7', '#B45309'] : ['#FEE2E2', '#B91C1C']
  return { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 42, padding: '3px 8px', borderRadius: 999, background: col[0], color: col[1], fontSize: 11.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }
}

function outcomeChip(row, t) {
  const map = {
    validata: ['#DCFCE7', '#15803D', t.validated],
    correggi: ['#FEF3C7', '#B45309', t.fixed],
    scarta: ['#FEE2E2', '#B91C1C', t.discarded],
  }
  const o = map[row.outcome] || ['#DBEAFE', '#1E50C8', t.esitiNone]
  return { bg: o[0], fg: o[1], label: o[2] }
}

function fmtDate(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const chipFilter = (active) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, background: active ? '#EFE7F7' : '#fff',
  border: `1px solid ${active ? '#D8CFE6' : '#ECEAF1'}`, borderRadius: 10, padding: '9px 13px',
  fontSize: 13, color: active ? '#5E2690' : '#5C5A6B', cursor: 'pointer', fontWeight: 500,
})

export default function AuditScreen({ t, onOpenInteraction }) {
  const [data, setData] = useState({ rows: [], count: 0, total: 0, chain_valid: true })
  const [search, setSearch] = useState('')
  const [outcome, setOutcome] = useState('')
  const [guardrailOnly, setGuardrailOnly] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => { api.audit(search, outcome, guardrailOnly ? '1' : '').then(setData).catch(() => {}) }, 200)
    return () => clearTimeout(id)
  }, [search, outcome, guardrailOnly])

  const outcomes = [
    { key: '', label: t.auditOutcome },
    { key: 'validata', label: t.validated },
    { key: 'correggi', label: t.fixed },
    { key: 'scarta', label: t.discarded },
    { key: 'rev', label: t.esitiNone },
  ]

  return (
    <div style={{ padding: '28px 32px 40px', maxWidth: 1180 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #ECEAF1', borderRadius: 10, padding: '9px 13px', minWidth: 240 }}>
            <IconSearch />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.auditSearch} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, flex: 1, color: '#1A1A2E' }} />
          </div>
          {outcomes.map((o) => (
            <div key={o.key} onClick={() => setOutcome(o.key)} style={chipFilter(outcome === o.key)}>{o.label}</div>
          ))}
          <div onClick={() => setGuardrailOnly((v) => !v)} style={chipFilter(guardrailOnly)}>🛡️ {t.navGuardrail}</div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={() => api.download('csv')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7B30B0,#5E2690)', color: '#fff', fontSize: 13.5, fontWeight: 600, boxShadow: '0 3px 10px rgba(94,38,144,.28)' }}>
            <IconDownload /> {t.exportCsv}
          </button>
          <button onClick={() => api.download('json')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: '1px solid #ECEAF1', cursor: 'pointer', background: '#fff', color: '#5C5A6B', fontSize: 13.5, fontWeight: 600 }}>
            {t.exportJson}
          </button>
        </div>
      </div>

      {onOpenInteraction && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#9A98A8', marginBottom: 10 }}>
          <IconSearch stroke="#B7B4C2" size={13} />
          <span>{t.auditOpenHint}</span>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #ECEAF1', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 18px rgba(46,26,80,.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '13px 20px', background: '#FBFAFD', borderBottom: '1px solid #EEEBF2', fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em', color: '#A7A4B5' }}>
          <div>{t.colDate}</div><div>{t.colUser}</div><div>{t.colQuestion}</div>
          <div style={{ textAlign: 'center' }}>{t.colSources}</div>
          <div style={{ textAlign: 'center' }}>{t.colConf}</div>
          <div style={{ textAlign: 'right' }}>{t.colOutcome}</div>
        </div>

        {data.rows.map((r) => {
          const oc = outcomeChip(r, t)
          return (
            <div
              key={r.id}
              onClick={() => onOpenInteraction && onOpenInteraction(r.id)}
              style={{ display: 'grid', gridTemplateColumns: GRID, padding: '15px 20px', borderBottom: '1px solid #F4F2F7', alignItems: 'center', fontSize: 13, cursor: onOpenInteraction ? 'pointer' : 'default' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FCFBFE' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ color: '#8C8A99', fontFamily: "'Geist Mono',monospace", fontSize: 11.5 }}>{fmtDate(r.ts)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#EFE7F7', color: '#5E2690', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{initials(r.user)}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#3A3A4A' }}>{r.user}</span>
              </div>
              <div style={{ color: '#26243A', paddingRight: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.guardrail && <span title="guardrail" style={{ marginRight: 6 }}>🛡️</span>}{r.question}
              </div>
              <div style={{ textAlign: 'center', color: '#8C8A99', fontVariantNumeric: 'tabular-nums' }}>{(r.sources || []).length}</div>
              <div style={{ textAlign: 'center' }}><span style={confChip(r.confidence)}>{r.confidence}%</span></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 11px', borderRadius: 999, background: oc.bg, color: oc.fg, fontSize: 11.5, fontWeight: 600 }}>{oc.label}</span>
              </div>
            </div>
          )
        })}

        <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#9A98A8' }}>
          <span>{data.count} {lang_count(t)} {data.total}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Geist Mono',monospace", color: data.chain_valid ? '#15803D' : '#B91C1C' }}>
            {data.chain_valid && <IconCheck stroke="#15803D" size={13} />}
            SHA-256 · {data.chain_valid ? t.chainValid : t.chainInvalid}
          </span>
        </div>
      </div>
    </div>
  )
}

function lang_count(t) {
  return t.colDate === 'DATA / ORA' ? 'di' : 'of'
}
