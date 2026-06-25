import { useEffect, useState } from 'react'
import { api } from '../api.js'

const card = { background: '#fff', border: '1px solid #ECEAF1', borderRadius: 14, padding: '20px 22px', boxShadow: '0 4px 18px rgba(46,26,80,.04)' }

function scoreColor(v) {
  return v >= 80 ? '#15803D' : v >= 60 ? '#B45309' : '#B91C1C'
}

function Tag({ kind, t }) {
  const isAuto = kind === 'auto'
  return (
    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999, color: isAuto ? '#1E50C8' : '#5E2690', background: isAuto ? '#DBEAFE' : '#EFE7F7' }}>
      {isAuto ? `⚙ ${t.paloAuto}` : `✎ ${t.paloManual}`}
    </span>
  )
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function Gauge({ value, provisional, t }) {
  const color = provisional ? '#B45309' : '#15803D'
  return (
    <div style={{ width: 132, height: 132, borderRadius: '50%', flex: 'none', background: `conic-gradient(${color} ${value * 3.6}deg, #ECEAF1 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{value}<span style={{ fontSize: 15 }}>%</span></div>
        <div style={{ fontSize: 10, fontWeight: 600, color: provisional ? '#B45309' : '#15803D', marginTop: 3 }}>{provisional ? t.paloProvisional : t.paloComplete}</div>
      </div>
    </div>
  )
}

function FieldRow({ field, t, lang, onSave }) {
  const [value, setValue] = useState(field.value)
  const [note, setNote] = useState(field.note || '')
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try { await onSave(field.key, value, note) } finally { setBusy(false) }
  }

  const labelFor = (opt) => (field.key === 'gate_decision' ? t.paloGate[opt] : field.key === 'eu_risk_tier' ? t.paloTier[opt] : opt)

  return (
    <div style={{ padding: '14px 0', borderTop: '1px solid #F2F0F6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1A2E' }}>{field.label}</span>
        <Tag kind="manual" t={t} />
        {field.validated ? (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#15803D', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            ✓ {t.paloValidatedBy} <b style={{ fontWeight: 600 }}>{field.by}</b> · {fmtDate(field.at)}
          </span>
        ) : (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#B45309', fontWeight: 600 }}>{t.paloAwaiting}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {field.type === 'bool' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {[true, false].map((b) => (
              <button key={String(b)} onClick={() => setValue(b)} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${value === b ? (b ? '#15803D' : '#B91C1C') : '#ECEAF1'}`, background: value === b ? (b ? '#15803D' : '#B91C1C') : '#fff', color: value === b ? '#fff' : '#5C5A6B', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {b ? t.paloYes : t.paloNo}
              </button>
            ))}
          </div>
        )}
        {field.type === 'enum' && (
          <select value={value ?? ''} onChange={(e) => setValue(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ECEAF1', background: '#fff', fontSize: 13, color: '#1A1A2E', cursor: 'pointer' }}>
            <option value="" disabled>—</option>
            {field.options.map((o) => <option key={o} value={o}>{labelFor(o)}</option>)}
          </select>
        )}
        {field.type === 'score' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 180 }}>
            <input type="range" min="0" max="100" value={Math.round((value ?? 0) * 100)} onChange={(e) => setValue(Number(e.target.value) / 100)} style={{ flex: 1, accentColor: '#5E2690' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#5E2690', minWidth: 38 }}>{Math.round((value ?? 0) * 100)}%</span>
          </div>
        )}
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.paloNote} style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, border: '1px solid #ECEAF1', background: '#F7F5FA', fontSize: 12.5, color: '#1A1A2E', outline: 'none' }} />
        <button onClick={save} disabled={busy || value == null || value === ''} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7B30B0,#5E2690)', color: '#fff', fontSize: 13, fontWeight: 600, opacity: busy ? 0.6 : 1 }}>{t.paloValidate}</button>
      </div>
    </div>
  )
}

export default function PaloScreen({ t, lang }) {
  const [d, setD] = useState(null)

  useEffect(() => { api.palo().then(setD).catch(() => {}) }, [])
  if (!d) return <div style={{ padding: 40, color: '#9A98A8' }}>…</div>

  async function saveField(key, value, note) {
    const next = await api.paloSet(key, value, note)
    setD(next)
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'palo_readiness.json'
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  const hist = d.history || []
  const hv = hist.map((h) => h.overall)
  const hmax = Math.max(...hv, d.overall, 100)

  return (
    <div style={{ padding: '28px 32px 44px', maxWidth: 1180 }}>
      {/* header: gauge + principio + legenda */}
      <div style={{ ...card, display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <Gauge value={d.overall} provisional={!d.complete} t={t} />
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#9A78C2' }}>PALO READINESS</div>
          {!d.complete && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 6, background: '#FEF3C7', color: '#B45309', padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
              ⚠ {d.hitl_pending.length} {t.paloPending}
            </div>
          )}
          <div style={{ fontSize: 13, color: '#6B6B80', lineHeight: 1.6, marginTop: 10 }}>{t.paloPrinciple}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Tag kind="auto" t={t} /><Tag kind="manual" t={t} />
          </div>
        </div>
        <button onClick={exportJson} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: '1px solid #ECEAF1', background: '#fff', color: '#5C5A6B', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
          ↓ {t.paloExport}
        </button>
      </div>

      {/* dimensioni */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#5E2690', margin: '4px 0 12px' }}>{t.paloDimensions}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 24 }}>
        {d.dimensions.map((dim) => (
          <div key={dim.key} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.3 }}>{dim.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor(dim.score), lineHeight: 1, flex: 'none' }}>{dim.score}<span style={{ fontSize: 13 }}>%</span></div>
            </div>
            {dim.status === 'pending' && <div style={{ fontSize: 10.5, fontWeight: 600, color: '#B45309', marginBottom: 8 }}>⚠ {t.paloAwaiting}</div>}
            {dim.status === 'placeholder' && <div style={{ fontSize: 10.5, fontWeight: 600, color: '#9A98A8', marginBottom: 8 }}>{t.paloPlaceholder}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {dim.indicators.map((ind, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5C5A6B', minWidth: 0 }}>
                    <Tag kind={ind.kind} t={t} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ind.name}</span>
                  </span>
                  <span style={{ fontWeight: 600, color: ind.value == null ? '#B45309' : '#3A3A4A', flex: 'none' }}>{ind.value == null ? '—' : ind.value + '%'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* framework alignment */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 16 }}>{t.paloFrameworks}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18 }}>
          {d.frameworks.map((f) => (
            <div key={f.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                <span style={{ color: '#3A3A4A', fontWeight: 600 }}>{f.label}</span>
                <span style={{ color: f.pending ? '#B45309' : '#9A98A8' }}>{f.pending ? t.paloAwaiting : f.value + '%'}</span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: '#F2F0F6', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 6, width: `${f.pending ? 100 : f.value}%`, background: f.pending ? 'repeating-linear-gradient(45deg,#F4E6C2,#F4E6C2 5px,#FBF3E0 5px,#FBF3E0 10px)' : 'linear-gradient(90deg,#9A4FCE,#5E2690)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* validazioni umane (HITL) */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 2 }}>{t.paloFieldsTitle}</div>
        <div style={{ fontSize: 12, color: '#9A98A8', marginBottom: 4 }}>{t.paloPrinciple}</div>
        {Object.values(d.fields).map((field) => (
          <FieldRow key={field.key} field={field} t={t} lang={lang} onSave={saveField} />
        ))}
      </div>

      {/* raccomandazioni + trend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 14 }}>{t.paloRecs}</div>
          {d.recommendations.length === 0 ? (
            <div style={{ fontSize: 13, color: '#15803D' }}>✓ —</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {d.recommendations.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, fontSize: 13, color: '#3A3A4A', lineHeight: 1.5 }}>
                  <span style={{ color: '#C9A6E8', flex: 'none' }}>→</span><span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 14 }}>{t.paloTrend}</div>
          {hv.length >= 2 ? (
            <>
              <svg viewBox="0 0 300 90" preserveAspectRatio="none" style={{ width: '100%', height: 90, display: 'block' }}>
                <polyline
                  points={[...hv, d.overall].map((v, i, arr) => `${(i * 300) / (arr.length - 1)},${86 - (v / hmax) * 78}`).join(' ')}
                  fill="none" stroke="#5E2690" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                />
                {[...hv, d.overall].map((v, i, arr) => (
                  <circle key={i} cx={(i * 300) / (arr.length - 1)} cy={86 - (v / hmax) * 78} r="3" fill="#5E2690" />
                ))}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#9A98A8', fontFamily: "'Geist Mono',monospace" }}>
                <span>{hv[0]}%</span>
                <span style={{ color: '#5E2690', fontWeight: 600 }}>{d.overall}% {lang === 'it' ? 'oggi' : 'today'}</span>
              </div>
            </>
          ) : <div style={{ fontSize: 13, color: '#9A98A8' }}>—</div>}
        </div>
      </div>
    </div>
  )
}
