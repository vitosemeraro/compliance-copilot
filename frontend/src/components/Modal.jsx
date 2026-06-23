import { useEffect } from 'react'

// Overlay modale generico in stile Prima. Chiude su backdrop o ESC.
export default function Modal({ onClose, children, width = 560, padded = true }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(26,16,42,.42)',
        backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        className="cc-fade"
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: '94vw', maxHeight: '90vh', overflow: 'hidden', background: '#fff',
          borderRadius: 18, boxShadow: '0 24px 70px rgba(46,26,80,.35)', display: 'flex', flexDirection: 'column',
          padding: padded ? 0 : 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function CloseButton({ onClose }) {
  return (
    <button
      onClick={onClose}
      style={{
        width: 32, height: 32, borderRadius: 9, border: '1px solid #ECEAF1', background: '#fff',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#6B6B80" strokeWidth="1.8" strokeLinecap="round" /></svg>
    </button>
  )
}
