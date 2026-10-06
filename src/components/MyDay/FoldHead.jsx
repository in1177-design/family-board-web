import React from 'react'

// כותרת של סקציה ב"היום שלי". כשאפשר לקפל: כל הכותרת היא כפתור, עם חץ בסוף
export default function FoldHead({ foldable, folded, onToggle, children }) {
  if (!foldable) return <div className="pl-row" style={{ justifyContent: 'space-between' }}>{children}</div>
  return (
    <button className="pl-fold-head" onClick={onToggle} aria-expanded={!folded}>
      {children}
      <span className="pl-fold-arrow" aria-hidden="true">{folded ? '◂' : '▾'}</span>
    </button>
  )
}
