import React, { useEffect } from 'react'

// חלון מודאלי (החלטה 2026-10-08): כותרת ו-✕ לסגירה. במחשב באמצע המסך, ובטלפון מגירה מלמטה.
// נסגר גם ב-Escape ובלחיצה על הרקע. הסגנון ב-plain.css (.pl-modal-*).
// eyebrow (2026-10-18, לפי עיצוב של המשתמשת): שורה קטנה מעל הכותרת (למשל "עריכת חוג"), והכותרת גדולה, על רקע צבעוני.
// locked: חלון שאסור לסגור כרגע (למשל בזמן קריאת מערכת): בלי ✕, ו-Escape והרקע לא סוגרים
export default function Modal({ title, eyebrow, onClose, children, locked = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !locked) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, locked])

  return (
    <div className="pl-modal-overlay" onClick={locked ? undefined : onClose}>
      <div className="pl pl-modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className={'pl-modal-head' + (eyebrow ? ' pl-modal-head-feature' : '')}>
          {eyebrow
            ? <div className="pl-modal-titles"><span className="pl-modal-eyebrow">{eyebrow}</span><h2>{title}</h2></div>
            : <h2>{title}</h2>}
          {!locked && <button className="pl-icon-button" onClick={onClose} aria-label="סגור" title="סגור">✕</button>}
        </div>
        <div className="pl-modal-body">{children}</div>
      </div>
    </div>
  )
}
