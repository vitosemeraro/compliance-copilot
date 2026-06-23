import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { IconAlert } from '../components/icons.jsx'

const MONTHS_SHORT = {
  it: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}
const card = { background: '#fff', border: '1px solid #ECEAF1', borderRadius: 14, padding: '20px 22px', boxShadow: '0 4px 18px rgba(46,26,80,.04)' }
const kpiCard = { background: '#fff', border: '1px solid #ECEAF1', borderRadius: 14, padding: '18px 20px', boxShadow: '0 4px 18px rgba(46,26,80,.04)' }

const STAGE = { onboarded: 'stageOnboarded', asked: 'stageAsked', consulted: 'stageConsulted', validated: 'stageValidated' }
const SEG = { power: ['segPower', '#5E2690'], regular: ['segRegular', '#9A4FCE'], occasional: ['segOccasional', '#C9A6E8'], dormant: ['segDormant', '#B7B4C2'] }

function Kpi({ label, value, delta, valueColor = '#1A1A2E', deltaColor = '#15803D', highlight }) {
  return (
    <div style={highlight ? { ...kpiCard, background: 'linear-gradient(160deg,#FBF6FF,#fff)', border: '1px solid #ECE2F5', boxShadow: '0 4px 18px rgba(94,38,144,.06)' } : kpiCard}>
      <div style={{ fontSize: 12, color: '#8C8A99', fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.01em', color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: 9, fontSize: 11.5, color: deltaColor, fontWeight: 500 }}>{delta}</div>
    </div>
  )
}

function heatColor(pct) {
  const op = 0.1 + (pct / 100) * 0.82
  return { bg: `rgba(94,38,144,${op.toFixed(2)})`, fg: pct >= 42 ? '#fff' : '#6C2BA1' }
}

export default function AdoptionScreen({ t, lang }) {
  const [d, setD] = useState(null)
  useEffect(() => { api.adoption().then(setD).catch(() => {}) }, [])
  if (!d) return <div style={{ padding: 40, color: '#9A98A8' }}>…</div>

  // MAU trend line geometry (baseline 0)
  const W = 600, H = 150, P = 6
  const vals = d.mau_trend.map((x) => x.active)
  const max = Math.max(...vals, 1)
  const pts = vals.map((v, i) => {
    const x = P + (i * (W - 2 * P)) / Math.max(1, vals.length - 1)
    const y = (H - 14) - (v / max) * (H - 28)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const area = `0,${H} ${pts} ${W},${H}`
  const monthLabels = d.mau_trend.map((x) => MONTHS_SHORT[lang][parseInt(x.month.slice(5, 7), 10) - 1])

  const funnelMax = d.funnel[0].users || 1
  const maxK = Math.max(...d.cohorts.map((c) => c.values.length))
  const segMax = Math.max(...d.segments.map((s) => s.count), 1)
  const teamMax = Math.max(...d.by_team.map((x) => x.total), 1)
  const retMax = 100

  return (
    <div style={{ padding: '28px 32px 44px', maxWidth: 1240 }}>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <Kpi label={t.adpMau} value={d.mau} delta={`${d.mau_delta >= 0 ? '↑' : '↓'} ${Math.abs(d.mau_delta)} ${lang === 'it' ? 'vs mese prec.' : 'vs last month'}`} deltaColor={d.mau_delta >= 0 ? '#15803D' : '#B45309'} valueColor="#5E2690" highlight />
        <Kpi label={t.adpRet30} value={`${d.retention.d30}%`} delta={`${t.adpRet60.toLowerCase()}: ${d.retention.d60}%`} deltaColor="#9A98A8" />
        <Kpi label={t.adpRet60} value={`${d.retention.d60}%`} delta={`90g: ${d.retention.d90}%`} deltaColor="#9A98A8" />
        <Kpi label={t.adpDropoff} value={`${d.dropoff_rate}%`} delta={t.adpDropoffSub} deltaColor="#B45309" />
      </div>

      {/* trend + retention curve */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)', gap: 16, marginBottom: 20 }}>
        <div style={kpiCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{t.adpTrend}</div>
            <div style={{ fontSize: 11.5, color: '#9A98A8' }}>{t.adpTrendY} · {t.adpTrendSub}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 150, paddingBottom: 16, fontSize: 9.5, color: '#A7A4B5', fontFamily: "'Geist Mono',monospace", textAlign: 'right', minWidth: 20 }}>
              <span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <svg viewBox="0 0 600 150" preserveAspectRatio="none" style={{ width: '100%', height: 150, display: 'block' }}>
                <defs><linearGradient id="adpArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5E2690" stopOpacity="0.18" /><stop offset="1" stopColor="#5E2690" stopOpacity="0" /></linearGradient></defs>
                <line x1="0" y1="14" x2="600" y2="14" stroke="#F2F0F6" />
                <line x1="0" y1="75" x2="600" y2="75" stroke="#F2F0F6" />
                <line x1="0" y1="136" x2="600" y2="136" stroke="#ECEAF1" />
                <polygon points={area} fill="url(#adpArea)" />
                <polyline points={pts} fill="none" stroke="#5E2690" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#A7A4B5', fontFamily: "'Geist Mono',monospace" }}>
                {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div style={kpiCard}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{t.adpRetCurve}</div>
          <div style={{ fontSize: 11.5, color: '#9A98A8', marginBottom: 16 }}>{t.adpRetCurveSub}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, height: 120 }}>
            {d.retention_curve.map((r) => (
              <div key={r.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#5E2690' }}>{r.pct}%</div>
                <div style={{ width: '100%', maxWidth: 36, height: `${(r.pct / retMax) * 88}px`, borderRadius: '6px 6px 0 0', background: 'linear-gradient(180deg,#9A4FCE,#5E2690)' }} />
                <div style={{ fontSize: 10.5, color: '#9A98A8', fontFamily: "'Geist Mono',monospace" }}>{r.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#3A3A4A', textAlign: 'center' }}>{t.adpRetained}: <b style={{ color: '#5E2690' }}>{d.retained_pct}%</b></div>
        </div>
      </div>

      {/* funnel + friction */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{t.adpFunnel}</div>
          <div style={{ fontSize: 11.5, color: '#9A98A8', marginBottom: 16 }}>{t.adpFunnelSub}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {d.funnel.map((f, i) => {
              const stuck = f.stage === d.stuck_stage
              return (
                <div key={f.stage}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5 }}>
                    <span style={{ color: '#3A3A4A', fontWeight: stuck ? 600 : 400 }}>{t[STAGE[f.stage]]}</span>
                    <span style={{ color: '#9A98A8' }}>{f.users} {t.adpUsers} · {f.pct}%</span>
                  </div>
                  <div style={{ height: 22, borderRadius: 7, background: '#F2F0F6', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${(f.users / funnelMax) * 100}%`, borderRadius: 7, background: stuck ? 'linear-gradient(90deg,#E08A2B,#B45309)' : 'linear-gradient(90deg,#9A4FCE,#5E2690)' }} />
                  </div>
                  {i > 0 && f.drop > 0 && (
                    <div style={{ marginTop: 4, fontSize: 11, color: stuck ? '#B45309' : '#A7A4B5', display: 'flex', alignItems: 'center', gap: 6 }}>
                      ↓ -{f.drop}% {stuck && <span style={{ fontWeight: 600, background: '#FEF3C7', color: '#B45309', padding: '1px 7px', borderRadius: 999 }}>{t.adpStuck}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(160deg,#2A2140,#242B3E)', border: '1px solid #2E2747', borderRadius: 14, padding: '20px 22px', boxShadow: '0 6px 22px rgba(36,43,62,.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <IconAlert stroke="#C9A6E8" size={16} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.adpFriction}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {d.friction.map((fr) => (
              <div key={fr.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 13px' }}>
                <span style={{ fontSize: 12.5, color: '#E8E3F2', lineHeight: 1.4 }}>{t['fri' + fr.key.charAt(0).toUpperCase() + fr.key.slice(1)] || fr.key}</span>
                <span style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10.5, color: '#A99FC4' }}>{fr.count} {t.adpUsers}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A6E8', background: 'rgba(201,166,232,.14)', padding: '3px 9px', borderRadius: 999 }}>{fr.pct}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* cohort retention heatmap */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{t.adpCohorts}</div>
        <div style={{ fontSize: 11.5, color: '#9A98A8', marginBottom: 16 }}>{t.adpCohortsSub}</div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `64px repeat(${maxK}, minmax(34px,1fr))`, gap: 4, minWidth: 520 }}>
            <div style={{ fontSize: 10, color: '#A7A4B5', fontWeight: 600 }}>{t.adpCohort}</div>
            {Array.from({ length: maxK }).map((_, k) => (
              <div key={k} style={{ fontSize: 10, color: '#A7A4B5', textAlign: 'center', fontFamily: "'Geist Mono',monospace" }}>+{k}</div>
            ))}
            {d.cohorts.map((c) => (
              <Cohort key={c.cohort} c={c} maxK={maxK} lang={lang} />
            ))}
          </div>
        </div>
      </div>

      {/* segments + by team */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 16 }}>{t.adpSegments}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {d.segments.map((s) => {
              const [labelKey, color] = SEG[s.name]
              return (
                <div key={s.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                    <span style={{ color: '#3A3A4A' }}>{t[labelKey]}</span>
                    <span style={{ color: '#9A98A8' }}>{s.count} {t.adpUsers}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 6, background: '#F2F0F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 6, width: `${(s.count / segMax) * 100}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 16 }}>{t.adpByTeam}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {d.by_team.map((tm) => (
              <div key={tm.team}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                  <span style={{ color: '#3A3A4A' }}>{tm.team}</span>
                  <span style={{ color: '#9A98A8' }}>{tm.active}/{tm.total} {lang === 'it' ? 'attivi' : 'active'}</span>
                </div>
                <div style={{ height: 8, borderRadius: 6, background: '#F2F0F6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 6, width: `${(tm.active / teamMax) * 100}%`, background: 'linear-gradient(90deg,#9A4FCE,#5E2690)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Cohort({ c, maxK, lang }) {
  const label = (() => {
    const m = parseInt(c.cohort.slice(5, 7), 10) - 1
    return MONTHS_SHORT[lang][m]
  })()
  return (
    <>
      <div style={{ fontSize: 11, color: '#3A3A4A', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontFamily: "'Geist Mono',monospace" }}>{label}</span>
        <span style={{ fontSize: 9.5, color: '#B7B4C2' }}>·{c.size}</span>
      </div>
      {Array.from({ length: maxK }).map((_, k) => {
        const v = c.values[k]
        if (!v) return <div key={k} style={{ height: 26 }} />
        const { bg, fg } = heatColor(v.pct)
        return (
          <div key={k} title={`+${k}: ${v.pct}%`} style={{ height: 26, borderRadius: 5, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>{v.pct}</div>
        )
      })}
    </>
  )
}
