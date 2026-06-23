const langBtn = (on) => ({
  border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7,
  background: on ? '#fff' : 'transparent', color: on ? '#5E2690' : '#8C8A99',
  boxShadow: on ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
})

export default function Topbar({ title, sub, lang, onLang, engine, model, t, onHelp }) {
  const engineLabel = engine === 'claude' ? `${t.engineClaude}${model ? ' · ' + model : ''}` : t.engineFallback
  return (
    <header style={{
      height: 68, flex: 'none', borderBottom: '1px solid #ECEAF1', background: 'rgba(255,255,255,.85)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px',
    }}>
      <div style={{ lineHeight: 1.25 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#1A1A2E' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: '#8C8A99' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '5px 11px', borderRadius: 999,
          background: engine === 'claude' ? '#EFE7F7' : '#F2F0F6', color: engine === 'claude' ? '#5E2690' : '#8C8A99',
          fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: engine === 'claude' ? '#5E2690' : '#B6B3C2' }} />
          {engineLabel}
        </div>
        <button
          onClick={onHelp}
          title={t.helpTip}
          style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #ECEAF1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.2" stroke="#6B6B80" strokeWidth="1.6" /><path d="M9.4 9.2a2.6 2.6 0 015 .9c0 1.7-2.4 2-2.4 3.6M12 17.2h.01" stroke="#6B6B80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ width: 1, height: 24, background: '#E7E5EC' }} />
        <div style={{ display: 'flex', background: '#F2F0F6', borderRadius: 9, padding: 3, gap: 2 }}>
          <button onClick={() => onLang('it')} style={langBtn(lang === 'it')}>IT</button>
          <button onClick={() => onLang('en')} style={langBtn(lang === 'en')}>EN</button>
        </div>
      </div>
    </header>
  )
}
