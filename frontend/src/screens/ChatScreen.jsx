import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { pickQuestion } from '../content.js'
import {
  IconStar, IconCheck, IconArrow, IconUp, IconThumbUp, IconThumbDown,
  IconInfo, IconAlert, IconShieldCheck,
} from '../components/icons.jsx'

const chipStyle = (active) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18,
  padding: '0 5px', margin: '0 1px', borderRadius: 5, border: 'none', cursor: 'pointer',
  fontSize: 11, fontWeight: 600, verticalAlign: 1,
  background: active ? '#5E2690' : '#EFE7F7', color: active ? '#fff' : '#6C2BA1',
})

const verdictBtn = (kind, active) => {
  const map = {
    validata: active ? 'background:#15803D;color:#fff;border:1px solid #15803D' : 'background:#fff;color:#15803D;border:1px solid #BBE9C8',
    correggi: active ? 'background:#B45309;color:#fff;border:1px solid #B45309' : 'background:#fff;color:#B45309;border:1px solid #F2DDA8',
    scarta: active ? 'background:#B91C1C;color:#fff;border:1px solid #B91C1C' : 'background:#fff;color:#B91C1C;border:1px solid #F2C2C2',
  }
  const s = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 500 }
  map[kind].split(';').forEach((d) => { const [k, v] = d.split(':'); s[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v })
  return s
}

const verdictTone = { validata: ['#DCFCE7', '#15803D'], correggi: ['#FEF3C7', '#B45309'], scarta: ['#FEE2E2', '#B91C1C'] }

const voteStyle = (on) => ({
  width: 34, height: 34, borderRadius: 9, border: `1px solid ${on ? '#C9B6E0' : '#ECEAF1'}`,
  background: on ? '#EFE7F7' : '#fff', color: on ? '#5E2690' : '#9A98A8',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
})

function SourceCard({ s, active, onSelect, t }) {
  const isInternal = s.type === 'internal'
  const tagStyle = {
    fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
    color: isInternal ? '#6C2BA1' : '#15803D', background: isInternal ? '#EFE7F7' : '#DCFCE7',
  }
  return (
    <button
      onClick={onSelect}
      style={{
        textAlign: 'left', width: '100%', cursor: 'pointer', background: '#fff',
        border: `1px solid ${active ? '#C9B6E0' : '#ECEAF1'}`, borderRadius: 13, padding: '14px 15px',
        boxShadow: active ? '0 4px 16px rgba(94,38,144,.08)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 6,
          background: active ? '#5E2690' : '#EFE7F7', color: active ? '#fff' : '#6C2BA1', fontSize: 11, fontWeight: 600, flex: 'none',
        }}>{s.n}</span>
        <span style={tagStyle}>{isInternal ? t.tagInternal : t.tagPublic}</span>
        {s.fictitious && (
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em', color: '#B45309', background: '#FEF3C7', padding: '2px 7px', borderRadius: 999 }}>{t.tagFittizio}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#B7B4C2', fontFamily: "'Geist Mono',monospace" }}>{s.relevance}</span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.35 }}>{s.doc_title}</div>
      <div style={{ fontSize: 11.5, color: '#8C8A99', marginTop: 2 }}>{s.section}</div>
      {active && (
        <div className="cc-fade" style={{
          marginTop: 11, fontFamily: "'Geist Mono',monospace", fontSize: 11.5, lineHeight: 1.65, color: '#5C5A6B',
          background: '#fff', border: '1px solid #EEE9F4', borderRadius: 9, padding: '11px 12px',
        }}>
          {s.highlight.pre}
          <mark style={{ background: '#F4E9A8', color: '#5A4A00', padding: '1px 3px', borderRadius: 3 }}>{s.highlight.hi}</mark>
          {s.highlight.post}
        </div>
      )}
    </button>
  )
}

export default function ChatScreen({ t, lang, preset, presetKey, onShowPool }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ans, setAns] = useState(null)
  const [active, setActive] = useState(1)
  const [verdict, setVerdict] = useState(null)
  const [vote, setVote] = useState(null)
  const [escSent, setEscSent] = useState(false)
  const scrollRef = useRef(null)
  const lastQ = useRef(null)

  function fillRandom(category) {
    const q = pickQuestion(lang, category, lastQ.current)
    lastQ.current = q
    setInput(q)
  }

  async function submit(q) {
    const raw = (q ?? input).trim()
    // Comandi slash: inseriscono una domanda di esempio (da inviare), niente attesa.
    if (q == null && raw.toLowerCase().startsWith('/chat')) {
      const arg = raw.slice(5).trim().toLowerCase()
      const category = arg === 'low' ? 'low' : arg === 'guardrail' ? 'guardrail' : 'random'
      fillRandom(category)
      return
    }
    const question = raw
    if (!question || loading) return
    setLoading(true); setAns(null); setVerdict(null); setVote(null); setEscSent(false)
    try {
      const res = await api.ask(question, lang)
      setAns(res)
      setActive(res.sources.find((s) => s.cited)?.n ?? 1)
    } catch (e) {
      setAns({ error: String(e) })
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  // Ogni accesso a una schermata assistente parte pulito: nessuna attesa.
  // Le voci "Confidenza bassa" / "Guardrail" preriempiono l'input (senza inviare).
  useEffect(() => {
    setAns(null); setVerdict(null); setVote(null); setEscSent(false)
    setInput(preset || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetKey])

  async function doReview(kind) {
    setVerdict(kind)
    if (ans?.id) { try { await api.review(ans.id, kind) } catch {} }
  }
  async function doVote(v) {
    const next = vote === v ? null : v
    setVote(next)
    if (next && ans?.id) { try { await api.feedback(ans.id, next) } catch {} }
  }

  const needsReview = ans && !ans.error && ans.needs_review
  const guardrail = ans && !ans.error && ans.guardrail?.triggered
  const confColor = needsReview ? ['#FEF3C7', '#B45309'] : ['#DCFCE7', '#15803D']

  // Mostriamo nel pannello solo le fonti effettivamente citate nella risposta:
  // le altre sono state consultate dal retrieval ma non ancorano alcuna affermazione.
  const cited = ans && !ans.error ? ans.sources.filter((s) => s.cited) : []
  const visibleSources = ans?.out_of_corpus ? [] : (cited.length ? cited : (ans?.sources ?? []))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 392px', height: '100%', minHeight: 0 }}>
      {/* conversazione */}
      <section style={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid #ECEAF1' }}>
        <div ref={scrollRef} className="cc-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 36px 16px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {!ans && !loading && (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#9A98A8', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#7B30B0,#5E2690)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(94,38,144,.28)', marginBottom: 16 }}>
                <IconShieldCheck size={24} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>{t.askPrompt}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>{t.emptySub}</div>
              {onShowPool && (
                <button onClick={onShowPool} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 9, border: '1px solid #E2D7F0', background: '#F7F2FB', color: '#5E2690', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <IconStar size={13} /> {t.seePool}
                </button>
              )}
            </div>
          )}

          {ans?.question && (
            <div style={{ alignSelf: 'flex-end', maxWidth: '74%', background: '#1A1A2E', color: '#fff', padding: '13px 17px', borderRadius: '16px 16px 4px 16px', fontSize: 14.5, lineHeight: 1.5 }}>{ans.question}</div>
          )}

          {loading && (
            <div className="cc-fade" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8C8A99', fontSize: 14 }}>
              <span className="cc-spinner" /> {t.thinking}
            </div>
          )}

          {ans?.error && (
            <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px 16px', borderRadius: 12, fontSize: 13.5 }}>Errore: {ans.error}</div>
          )}

          {ans && !ans.error && (
            <div data-tour="answer" className="cc-fade" style={{ background: '#fff', border: `1px solid ${needsReview ? '#F1E4C8' : '#ECEAF1'}`, borderRadius: 16, boxShadow: '0 6px 24px rgba(46,26,80,.06)', overflow: 'hidden' }}>
              {/* guardrail banner */}
              {guardrail && (
                <div style={{ display: 'flex', gap: 13, padding: '16px 20px', background: 'linear-gradient(180deg,#FBF5FF,#FFFBF2)', borderBottom: '1px solid #F0E6D8' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flex: 'none', background: 'linear-gradient(135deg,#7B30B0,#5E2690)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 9px rgba(94,38,144,.25)' }}>
                    <IconShieldCheck />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#5E2690', marginBottom: 3 }}>{t.guardrailTitle}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.62, color: '#6A5A4B' }}>{t.guardrailBody}</div>
                    <div style={{ marginTop: 6, fontSize: 11.5, color: '#9A7BBE', fontWeight: 500 }}>
                      {lang === 'it' ? 'Termini rilevati' : 'Detected terms'}: {ans.guardrail.terms.join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {/* header badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '15px 20px', borderBottom: '1px solid #F2F0F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#DBEAFE', color: '#1E50C8', padding: '5px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', flex: 'none' }}>
                  <IconStar /> {t.aiBadge}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: confColor[0], color: confColor[1], padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flex: 'none' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: confColor[1] }} />
                  {t.confidence} {ans.confidence}%{needsReview ? ` · ${t.needsReview}` : ''}
                </div>
              </div>

              {/* escalation banner */}
              {needsReview && (
                <div style={{ margin: '16px 20px 0', display: 'flex', gap: 11, background: '#FFFBF0', border: '1px solid #F4E6C2', borderRadius: 12, padding: '13px 15px' }}>
                  <IconInfo stroke="#B45309" size={20} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#92500A', marginBottom: 2 }}>{t.escBannerTitle}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: '#8A6516' }}>{t.escBannerBody}</div>
                  </div>
                </div>
              )}

              {/* answer text with citations */}
              <div style={{ padding: '18px 22px 6px', fontSize: 15, lineHeight: 1.72, color: '#26243A' }}>
                {ans.segments.map((seg, i) => (
                  <span key={i}>
                    {seg.text}
                    {seg.citation != null && (
                      <button onClick={() => setActive(seg.citation)} style={chipStyle(seg.citation === active)}>{seg.citation}</button>
                    )}{' '}
                  </span>
                ))}
              </div>

              {/* HITL + votes */}
              <div data-tour="hitl" style={{ margin: '14px 22px 0', padding: '14px 0 18px', borderTop: '1px solid #F2F0F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', color: '#A7A4B5', marginRight: 2 }}>{t.humanLabel}</span>
                  <button onClick={() => doReview('validata')} style={verdictBtn('validata', verdict === 'validata')}><IconCheck stroke="currentColor" />{t.btnValida}</button>
                  <button onClick={() => doReview('correggi')} style={verdictBtn('correggi', verdict === 'correggi')}>{t.btnCorreggi}</button>
                  <button onClick={() => doReview('scarta')} style={verdictBtn('scarta', verdict === 'scarta')}>{t.btnScarta}</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => doVote('up')} style={voteStyle(vote === 'up')}><IconThumbUp /></button>
                  <button onClick={() => doVote('down')} style={voteStyle(vote === 'down')}><IconThumbDown /></button>
                </div>
              </div>

              {/* verdict bar */}
              {verdict && (
                <div className="cc-fade" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 22px 18px', padding: '11px 14px', borderRadius: 10, background: verdictTone[verdict][0], color: verdictTone[verdict][1], fontSize: 13, fontWeight: 500 }}>
                  <IconCheck stroke="currentColor" />
                  <span>{verdict === 'validata' ? t.vValida : verdict === 'correggi' ? t.vCorreggi : t.vScarta}</span>
                </div>
              )}

              {/* escalate action when needs review */}
              {needsReview && (
                <div style={{ margin: '0 22px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => setEscSent(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7B30B0,#5E2690)', color: '#fff', fontSize: 13.5, fontWeight: 600, boxShadow: '0 3px 11px rgba(94,38,144,.3)' }}>
                    <IconUp /> {t.btnEscalate}
                  </button>
                  {escSent && (
                    <div className="cc-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#EFE7F7', color: '#5E2690', padding: '9px 13px', borderRadius: 9, fontSize: 12.5, fontWeight: 600 }}>
                      <IconCheck stroke="currentColor" size={14} />{t.escSentMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* input */}
        <div style={{ flex: 'none', padding: '16px 36px 22px', borderTop: '1px solid #ECEAF1', background: '#fff' }}>
          <div data-tour="input" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F7F5FA', border: '1px solid #ECEAF1', borderRadius: 13, padding: '8px 8px 8px 16px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              placeholder={t.inputPlaceholder}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14.5, color: '#1A1A2E' }}
            />
            <button onClick={() => submit()} disabled={loading} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', cursor: loading ? 'default' : 'pointer', background: 'linear-gradient(135deg,#7B30B0,#5E2690)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(94,38,144,.3)', opacity: loading ? 0.6 : 1 }}>
              <IconArrow />
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: '#A7A4B5', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <code style={{ fontFamily: "'Geist Mono',monospace", background: '#F2F0F6', color: '#6C2BA1', padding: '1px 6px', borderRadius: 5, fontSize: 11 }}>/chat</code>
            <span>{t.chatCmdHint}</span>
            {onShowPool && (
              <button onClick={onShowPool} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6C2BA1', fontSize: 11.5, fontWeight: 600, padding: 0, textDecoration: 'underline' }}>{t.seePool}</button>
            )}
          </div>
        </div>
      </section>

      {/* sources panel */}
      <aside data-tour="sources" className="cc-scroll" style={{ background: '#FBFAFD', overflowY: 'auto', padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.06em', color: '#1A1A2E', textTransform: 'uppercase' }}>{t.sourcesTitle}</div>
          <div style={{ fontSize: 12, color: '#9A98A8' }}>{visibleSources.length}</div>
        </div>

        {ans?.out_of_corpus && (
          <div style={{ display: 'flex', gap: 9, background: '#FFF7F7', border: '1px solid #F4C2C2', borderRadius: 11, padding: '12px 13px' }}>
            <IconAlert stroke="#B91C1C" size={17} />
            <div style={{ fontSize: 12, lineHeight: 1.55, color: '#9B2C2C' }}>{t.notInSources}. {t.escPartialCoverage}</div>
          </div>
        )}

        {visibleSources.map((s) => (
          <SourceCard key={s.n} s={s} active={s.n === active} onSelect={() => setActive(s.n)} t={t} />
        ))}

        <div style={{ marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11.5, color: '#9A98A8', lineHeight: 1.5, padding: '0 4px' }}>
          <IconInfo />
          <span>{guardrail ? t.guardrailHint : t.sourcesHint}</span>
        </div>
      </aside>
    </div>
  )
}
