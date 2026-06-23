import { useEffect, useRef, useState } from 'react'
import { ONBOARDING } from '../content.js'

const PAD = 8
const TIPW = 360

const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi))

// Posiziona il tooltip accanto al riquadro evidenziato: sotto, sopra o di lato
// a seconda dello spazio disponibile.
function computeTip(rect, vp, tipH) {
  const M = 14
  if (!rect) return { left: (vp.w - TIPW) / 2, top: (vp.h - tipH) / 2 }

  const fitsBelow = vp.h - (rect.top + rect.height) > tipH + M + 16
  const fitsAbove = rect.top > tipH + M + 16
  if (fitsBelow || fitsAbove) {
    const top = fitsBelow ? rect.top + rect.height + M : rect.top - tipH - M
    return { left: clamp(rect.left, 16, vp.w - TIPW - 16), top: clamp(top, 16, vp.h - tipH - 16) }
  }
  // niente spazio sopra/sotto (elemento alto): affianca a destra o a sinistra.
  const fitsRight = vp.w - (rect.left + rect.width) > TIPW + M + 16
  const left = fitsRight ? rect.left + rect.width + M : rect.left - TIPW - M
  return {
    left: clamp(left, 16, vp.w - TIPW - 16),
    top: clamp(rect.top + rect.height / 2 - tipH / 2, 16, vp.h - tipH - 16),
  }
}

export default function Onboarding({ t, lang, onClose }) {
  const steps = ONBOARDING[lang]
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [, setTick] = useState(0) // forza re-render su resize/scroll
  const tipRef = useRef(null)
  const [tipH, setTipH] = useState(230)
  const step = steps[i]
  const last = i === steps.length - 1
  // Dimensioni viewport lette live al render (mai stale).
  const vp = { w: window.innerWidth, h: window.innerHeight }

  // Misura il target (polling: alcuni elementi, es. la card risposta, caricano in ritardo).
  useEffect(() => {
    let timer, tries = 0, cancelled = false
    function measure() {
      if (cancelled) return
      if (!step.target) { setRect(null); return }
      const el = document.querySelector(`[data-tour="${step.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      } else if (tries++ < 40) {
        timer = setTimeout(measure, 150)
      } else {
        setRect(null)
      }
    }
    measure()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [i, lang, step.target])

  // Riallinea su resize/scroll.
  useEffect(() => {
    function sync() {
      setTick((n) => n + 1)
      if (step.target) {
        const el = document.querySelector(`[data-tour="${step.target}"]`)
        if (el) { const r = el.getBoundingClientRect(); setRect({ top: r.top, left: r.left, width: r.width, height: r.height }) }
      }
    }
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    return () => { window.removeEventListener('resize', sync); window.removeEventListener('scroll', sync, true) }
  }, [step.target])

  // Navigazione da tastiera.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && !last) setI(i + 1)
      else if (e.key === 'ArrowLeft' && i > 0) setI(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i, last, onClose])

  // Misura l'altezza reale del tooltip per posizionarlo bene.
  useEffect(() => {
    if (tipRef.current) setTipH(tipRef.current.offsetHeight)
  }, [i, lang, rect])

  const tip = computeTip(rect, vp, tipH)
  const hole = rect && {
    x: Math.max(2, rect.left - PAD), y: Math.max(2, rect.top - PAD),
    w: rect.width + PAD * 2, h: rect.height + PAD * 2,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      {/* dim + riflettore */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <mask id="cc-spot">
            <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
            {hole && <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx="13" fill="#000" />}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(22,14,36,.62)" mask="url(#cc-spot)" />
        {hole && <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx="13" fill="none" stroke="#B98CE0" strokeWidth="2" />}
      </svg>

      {/* layer che cattura i click fuori dal tooltip (l'app resta non interagibile) */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={(e) => e.stopPropagation()} />

      {/* tooltip ancorato */}
      <div
        ref={tipRef}
        className="cc-fade"
        style={{
          position: 'absolute', left: tip.left, top: tip.top, width: TIPW, maxWidth: '94vw',
          background: '#fff', borderRadius: 16, boxShadow: '0 18px 50px rgba(22,14,36,.4)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 18px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#7B30B0,#5E2690)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flex: 'none' }}>{step.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: '#9A78C2' }}>{t.obStep} {i + 1} / {steps.length}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', marginTop: 2 }}>{step.title}</div>
          </div>
        </div>

        <div style={{ padding: '12px 18px 4px', fontSize: 13.5, lineHeight: 1.62, color: '#3A3A4A' }}>{step.body}</div>

        <div style={{ display: 'flex', gap: 5, padding: '8px 18px 0' }}>
          {steps.map((_, k) => (
            <button key={k} onClick={() => setI(k)} style={{ width: k === i ? 20 : 7, height: 7, borderRadius: 999, border: 'none', cursor: 'pointer', background: k === i ? '#5E2690' : '#E2DEEA', transition: 'all .2s' }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 16px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A98A8', fontSize: 12.5, fontWeight: 500 }}>{t.obSkip}</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {i > 0 && (
              <button onClick={() => setI(i - 1)} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid #ECEAF1', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#5C5A6B' }}>{t.obPrev}</button>
            )}
            <button
              onClick={() => (last ? onClose() : setI(i + 1))}
              style={{ padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7B30B0,#5E2690)', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 3px 10px rgba(94,38,144,.28)' }}
            >{last ? t.obDone : t.obNext}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
