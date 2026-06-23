import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { IconAlert } from '../components/icons.jsx'

const MONTHS_SHORT = {
  it: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

const kpiCard = { background: '#fff', border: '1px solid #ECEAF1', borderRadius: 14, padding: '18px 20px', boxShadow: '0 4px 18px rgba(46,26,80,.04)' }

function Kpi({ label, value, delta, valueColor = '#1A1A2E', deltaColor = '#15803D', highlight }) {
  return (
    <div style={highlight ? { ...kpiCard, background: 'linear-gradient(160deg,#FBF6FF,#fff)', border: '1px solid #ECE2F5', boxShadow: '0 4px 18px rgba(94,38,144,.06)' } : kpiCard}>
      <div style={{ fontSize: 12, color: '#8C8A99', fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.01em', color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: 9, fontSize: 11.5, color: deltaColor, fontWeight: 500 }}>{delta}</div>
    </div>
  )
}

export default function DashboardScreen({ t, lang }) {
  const [d, setD] = useState(null)
  useEffect(() => { api.dashboard().then(setD).catch(() => {}) }, [])
  if (!d) return <div style={{ padding: 40, color: '#9A98A8' }}>…</div>

  // line chart geometry
  const W = 600, H = 158, P = 6
  const vals = d.trend.map((x) => x.count)
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0)
  const pts = vals.map((v, i) => {
    const x = P + (i * (W - 2 * P)) / Math.max(1, vals.length - 1)
    const y = (H - 14) - ((v - min) / Math.max(1, max - min)) * (H - 28)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const linePoints = pts.join(' ')
  const lineArea = `0,${H} ${linePoints} ${W},${H}`
  const monthLabels = d.trend.map((x) => MONTHS_SHORT[lang][parseInt(x.month.slice(5, 7), 10) - 1])

  const out = d.outcomes
  const donut = `conic-gradient(#15803D 0 ${out.validated}%,#B45309 ${out.validated}% ${out.validated + out.fixed}%,#B91C1C ${out.validated + out.fixed}% 100%)`
  const topMax = Math.max(...d.topics.map((x) => x.count), 1)

  return (
    <div style={{ padding: '28px 32px 44px', maxWidth: 1240 }}>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <Kpi label={t.kVolume} value={d.total.toLocaleString(lang === 'it' ? 'it-IT' : 'en-US')} delta={`${t.kGrounding}: ${d.grounding_rate}%`} />
        <Kpi label={t.kValidated} value={`${d.validated_rate}%`} delta={`${t.outValidate.toLowerCase()} / ${t.chartOutcomes.toLowerCase()}`} valueColor="#5E2690" highlight />
        <Kpi label={t.kEscalation} value={`${d.escalation_rate}%`} delta={t.needsReview} deltaColor="#B45309" />
        <Kpi label={t.kTime} value={`${d.hours_saved} h`} delta={lang === 'it' ? 'stima cumulata' : 'cumulative estimate'} deltaColor="#9A98A8" />
      </div>

      {/* charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)', gap: 16, marginBottom: 20 }}>
        <div style={kpiCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{t.chartTrend}</div>
            <div style={{ fontSize: 11.5, color: '#9A98A8' }}>{t.chartTrendSub}</div>
          </div>
          <svg viewBox="0 0 600 158" preserveAspectRatio="none" style={{ width: '100%', height: 158, display: 'block' }}>
            <defs>
              <linearGradient id="ccArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7B30B0" stopOpacity="0.18" />
                <stop offset="1" stopColor="#7B30B0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="40" x2="600" y2="40" stroke="#F2F0F6" />
            <line x1="0" y1="80" x2="600" y2="80" stroke="#F2F0F6" />
            <line x1="0" y1="120" x2="600" y2="120" stroke="#F2F0F6" />
            <polygon points={lineArea} fill="url(#ccArea)" />
            <polyline points={linePoints} fill="none" stroke="#7B30B0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10.5, color: '#A7A4B5', fontFamily: "'Geist Mono',monospace" }}>
            {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
          </div>
        </div>

        <div style={kpiCard}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 16 }}>{t.chartOutcomes}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 118, height: 118, borderRadius: '50%', flex: 'none', background: donut, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 74, height: 74, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 21, fontWeight: 600, color: '#15803D', lineHeight: 1 }}>{out.validated}%</div>
                <div style={{ fontSize: 9.5, color: '#9A98A8' }}>{t.donutCenter}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[[t.outValidate, out.validated, '#15803D'], [t.outFix, out.fixed, '#B45309'], [t.outDiscard, out.discarded, '#B91C1C']].map(([lab, val, col]) => (
                <div key={lab} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: col, flex: 'none' }} />
                  <span style={{ fontSize: 12.5, color: '#3A3A4A' }}>{lab} <b style={{ color: '#1A1A2E' }}>{val}%</b></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* bars + gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <div style={kpiCard}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 18 }}>{t.chartTopics}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {d.topics.map((tp) => (
              <div key={tp.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                  <span style={{ color: '#3A3A4A' }}>{tp.name}</span>
                  <span style={{ color: '#9A98A8', fontVariantNumeric: 'tabular-nums' }}>{tp.count}</span>
                </div>
                <div style={{ height: 8, borderRadius: 6, background: '#F2F0F6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 6, width: `${Math.round((tp.count / topMax) * 100)}%`, background: 'linear-gradient(90deg,#9A4FCE,#5E2690)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(160deg,#2A2140,#242B3E)', border: '1px solid #2E2747', borderRadius: 14, padding: '20px 22px', boxShadow: '0 6px 22px rgba(36,43,62,.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <IconAlert stroke="#C9A6E8" size={16} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.gapsTitle}</div>
          </div>
          <div style={{ fontSize: 11.5, color: '#A99FC4', marginBottom: 16, lineHeight: 1.5 }}>{t.gapsSub}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {d.gaps.map((g) => (
              <div key={g.question} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '11px 13px' }}>
                <span style={{ fontSize: 12.5, color: '#E8E3F2', lineHeight: 1.4 }}>{g.question}</span>
                <span style={{ flex: 'none', fontSize: 10.5, fontWeight: 600, color: '#C9A6E8', background: 'rgba(201,166,232,.14)', padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
