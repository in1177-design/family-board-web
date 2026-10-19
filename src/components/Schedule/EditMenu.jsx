import React, { useEffect, useRef, useState } from 'react'

// כפתור "עריכה" אחד עם תפריט (המשתמשת, 2026-10-18): במקום ארבעה כפתורים בשורה העליונה.
// groups: [{ title, items: [{ label, hint, onPick }] }]. התפריט נפתח מתחת לכפתור, בצד שמאל
export default function EditMenu({ groups }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // לחיצה מחוץ לתפריט או Escape סוגרים אותו
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div className="pl-menu sg-edit-menu" ref={ref}>
      <button className={'sg-btn' + (open ? ' sg-btn-on' : '')} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(v => !v)}>
        עריכה <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="pl-menu-list sg-edit-list" role="menu">
          {groups.map(g => (
            <div key={g.title} className="sg-edit-group" role="group" aria-label={g.title}>
              <strong className="sg-edit-title">{g.title}</strong>
              {g.items.map(it => (
                <button key={it.label} role="menuitem" onClick={() => { setOpen(false); it.onPick() }}>
                  <span>{it.label}</span>
                  {it.hint && <span className="pl-muted">{it.hint}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
