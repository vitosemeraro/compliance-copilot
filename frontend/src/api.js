// Client API verso il backend FastAPI (proxy /api su Vite in dev; stessa origine in prod).
const BASE = '/api'

const PW_KEY = 'cc_pw'
export function setPassword(pw) { localStorage.setItem(PW_KEY, pw) }
export function getPassword() { return localStorage.getItem(PW_KEY) || '' }

function authHeaders(extra = {}) {
  const pw = getPassword()
  return pw ? { ...extra, 'X-App-Password': pw } : extra
}

async function jget(path) {
  const r = await fetch(BASE + path, { headers: authHeaders() })
  if (r.status === 401) throw new Error('401')
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`)
  return r.json()
}

async function jpost(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (r.status === 401) throw new Error('401')
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}`)
  return r.json()
}

async function downloadExport(format) {
  const r = await fetch(`${BASE}/audit/export?format=${format}`, { headers: authHeaders() })
  if (!r.ok) throw new Error('export failed')
  const blob = await r.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit_trail.${format}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const api = {
  health: () => jget('/health'),
  config: () => jget('/config'),
  check: () => jget('/auth/check'),
  sources: () => jget('/sources'),
  ask: (question, lang, user = 'Giulia Bianchi') => jpost('/ask', { question, lang, user }),
  review: (interaction_id, outcome, note = '') => jpost('/review', { interaction_id, outcome, note }),
  feedback: (interaction_id, vote) => jpost('/feedback', { interaction_id, vote }),
  audit: (search = '', outcome = '', guardrail = '') =>
    jget(`/audit?search=${encodeURIComponent(search)}&outcome=${encodeURIComponent(outcome)}&guardrail=${encodeURIComponent(guardrail)}`),
  dashboard: () => jget('/dashboard'),
  adoption: () => jget('/adoption'),
  palo: () => jget('/palo'),
  paloSet: (key, value, note = '') => jpost('/palo/field', { key, value, note }),
  interaction: (id) => jget('/interaction/' + encodeURIComponent(id)),
  download: downloadExport,
  setPassword,
  getPassword,
}
