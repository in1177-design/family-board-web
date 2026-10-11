import React from 'react'

// כותרת של סקציה ב"היום שלי". כשאפשר לקפל: כל הכותרת היא כפתור, עם חץ בסוף.
// pixelArrow: במשחקי חץ פיקסלים שמסתובב במדרגות (2026-10-12), ובמעודן נשאר החץ הרגיל
export default function FoldHead({ foldable, folded, onToggle, pixelArrow, children }) {
  if (!foldable) return <div className="pl-row" style={{ justifyContent: 'space-between' }}>{children}</div>
  return (
    <button className="pl-fold-head" onClick={onToggle} aria-expanded={!folded}>
      {children}
      <span className={'pl-fold-arrow' + (pixelArrow ? ' plain-only' : '')} aria-hidden="true">{folded ? '◂' : '▾'}</span>
      {pixelArrow && (
        <svg className="pl-chev px-only" viewBox="0 0 10 6" aria-hidden="true" shapeRendering="crispEdges">
          <path d="M0 0h2v2H0zM2 2h2v2H2zM4 4h2v2H4zM6 2h2v2H6zM8 0h2v2H8z" fill="currentColor" />
        </svg>
      )}
    </button>
  )
}
