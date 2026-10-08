import React, { useEffect } from 'react'

// חלון מודאלי (החלטה 2026-10-08): כותרת ו-✕ לסגירה. במחשב באמצע המסך, ובטלפון מגירה מלמטה.
// נסגר גם ב-Escape ובלחיצה על הרקע. הסגנון ב-plain.css (.pl-modal-*)
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="pl-modal-overlay" onClick={onClose}>
      <div className="pl pl-modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="pl-modal-head">
          <h2>{title}</h2>
          <button className="pl-icon-button" onClick={onClose} aria-label="סגור" title="סגור">✕</button>
        </div>
        <div className="pl-modal-body">{children}</div>
      </div>
    </div>
  )
}
