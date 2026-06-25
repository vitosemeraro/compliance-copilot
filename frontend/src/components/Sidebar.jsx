import { IconChat, IconAlert, IconAudit, IconDash, IconAdoption, IconCheck } from './icons.jsx'

const navStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 12px',
  borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13.5, textAlign: 'left',
  background: active ? '#EFE7F7' : 'transparent', color: active ? '#4E2080' : '#3C3A4A',
  fontWeight: active ? 600 : 500,
})

function NavBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={navStyle(active)}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F5F2F9' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon stroke={active ? '#4E2080' : '#9A98A8'} />
      <span>{label}</span>
    </button>
  )
}

export default function Sidebar({ t, screen, onNav }) {
  return (
    <aside data-tour="sidebar" style={{
      width: 252, flex: 'none', background: '#fff', borderRight: '1px solid #ECEAF1',
      display: 'flex', flexDirection: 'column', padding: '18px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 8px 18px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#7B30B0,#5E2690)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(94,38,144,.28)',
        }}>
          <IconCheck stroke="#fff" size={19} w={2.6} />
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.12em', color: '#9A78C2' }}>{t.eyebrow}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E' }}>Compliance Copilot</div>
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', color: '#A7A4B5', padding: '6px 10px 8px' }}>{t.groupAssistant}</div>
      <div data-tour="nav-assistant" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <NavBtn active={screen === 'chat'} onClick={() => onNav('chat')} icon={IconChat} label={t.navChat} />
      </div>

      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', color: '#A7A4B5', padding: '18px 10px 8px' }}>{t.groupGovernance}</div>
      <div data-tour="nav-governance" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <NavBtn active={screen === 'review'} onClick={() => onNav('review')} icon={IconAlert} label={t.navReview} />
        <NavBtn active={screen === 'audit'} onClick={() => onNav('audit')} icon={IconAudit} label={t.navAudit} />
        <NavBtn active={screen === 'dashboard'} onClick={() => onNav('dashboard')} icon={IconDash} label={t.navDashboard} />
        <NavBtn active={screen === 'adoption'} onClick={() => onNav('adoption')} icon={IconAdoption} label={t.navAdoption} />
      </div>

      <div style={{
        marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 11,
        padding: '12px 8px', borderTop: '1px solid #F0EEF4',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', background: '#EFE7F7', color: '#5E2690',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flex: 'none',
        }}>GB</div>
        <div style={{ lineHeight: 1.25, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Giulia Bianchi</div>
          <div style={{ fontSize: 11, color: '#8C8A99' }}>Compliance Specialist</div>
        </div>
      </div>
    </aside>
  )
}
