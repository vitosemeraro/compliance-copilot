// Icone SVG (stroke) riprese dal design.
const base = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IconChat = ({ stroke = '#9A98A8', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke={stroke} strokeWidth="1.7" />
  </svg>
)
export const IconAlert = ({ stroke = '#9A98A8', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z" stroke={stroke} strokeWidth="1.7" />
  </svg>
)
export const IconShield = ({ stroke = '#9A98A8', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={stroke} strokeWidth="1.7" />
  </svg>
)
export const IconAudit = ({ stroke = '#9A98A8', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M9 11l3 3 8-8M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke={stroke} strokeWidth="1.7" />
  </svg>
)
export const IconDash = ({ stroke = '#9A98A8', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z" stroke={stroke} strokeWidth="1.7" />
  </svg>
)
export const IconAdoption = ({ stroke = '#9A98A8', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M17 20h5v-2a3 3 0 00-3-3M9 20H2v-2a3 3 0 013-3h6a3 3 0 013 3v2H9zm0-9a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6" stroke={stroke} strokeWidth="1.6" />
    <path d="M3 13l3-3 3 2 4-5" stroke={stroke} strokeWidth="1.5" opacity="0" />
  </svg>
)
export const IconStar = ({ stroke = '#2563EB', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 3l1.9 4.6L19 9l-3.5 3.6L16.5 18 12 15.4 7.5 18l1-5.4L5 9l5.1-1.4L12 3z" stroke={stroke} strokeWidth="1.6" />
  </svg>
)
export const IconCheck = ({ stroke = 'currentColor', size = 15, w = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 12.5l5 5L20 6.5" stroke={stroke} strokeWidth={w} />
  </svg>
)
export const IconArrow = ({ stroke = '#fff', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" stroke={stroke} strokeWidth="2" />
  </svg>
)
export const IconUp = ({ stroke = '#fff', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 19V5m0 0l-6 6m6-6l6 6" stroke={stroke} strokeWidth="2" />
  </svg>
)
export const IconThumbUp = ({ stroke = 'currentColor', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M7 11v9H4a1 1 0 01-1-1v-7a1 1 0 011-1h3zm0 0l4-8a2.5 2.5 0 012.4 3.2L12.6 9H19a2 2 0 011.9 2.6l-2 6.5A2 2 0 0117 19.6H7" stroke={stroke} strokeWidth="1.7" />
  </svg>
)
export const IconThumbDown = ({ stroke = 'currentColor', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M17 13V4h3a1 1 0 011 1v7a1 1 0 01-1 1h-3zm0 0l-4 8a2.5 2.5 0 01-2.4-3.2L11.4 15H5a2 2 0 01-1.9-2.6l2-6.5A2 2 0 017 4.4h10" stroke={stroke} strokeWidth="1.7" />
  </svg>
)
export const IconInfo = ({ stroke = '#B7B4C2', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z" stroke={stroke} strokeWidth="1.7" />
  </svg>
)
export const IconDownload = ({ stroke = '#fff', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke={stroke} strokeWidth="1.8" />
  </svg>
)
export const IconSearch = ({ stroke = '#9A98A8', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="11" cy="11" r="7" stroke={stroke} strokeWidth="1.7" />
    <path d="M21 21l-4-4" stroke={stroke} strokeWidth="1.7" />
  </svg>
)
export const IconShieldCheck = ({ size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#fff" strokeWidth="1.8" />
    <path d="M9 12l2 2 4-4.5" stroke="#fff" strokeWidth="1.8" />
  </svg>
)
