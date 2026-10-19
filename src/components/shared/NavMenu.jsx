import React, { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { memberPhoto } from './memberPhoto'

// לשונית ניווט שנפתחת לתפריט (2026-10-18): "ילדים" אצל ההורה. לחיצה פותחת רשימת ילדים,
// ובחירה מעבירה למערכת של הילד. tab: { id, text, icon, face?, menu: { members, value, onSelect, allLabel? } }.
// allLabel: פריט ראשון ברשימה (value null), למשל "כל הילדים". face: בן המשפחה שנבחר, ואז התמונה שלו במקום האייקון
// btnClass: המחלקה של הלשוניות לידה (hdr-nav-btn בכותרת, pl-tab בפס התחתון)
export default function NavMenu({ tab, active, btnClass }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { members, value, onSelect, allLabel } = tab.menu
  const facePhoto = tab.face && memberPhoto(tab.face)

  // לחיצה מחוץ לתפריט או Escape סוגרים אותו
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  // בלי pl-menu: בכותרת היא מקבלת את הסגנון של כפתור ☰
  return (
    <div className="nav-menu" ref={ref}>
      <button className={btnClass} aria-current={active ? 'page' : undefined} aria-expanded={open} aria-haspopup="menu"
        onClick={() => setOpen(v => !v)}>
        {tab.face
          ? (facePhoto ? <img className="nav-menu-face" src={facePhoto} alt="" /> : <span className="nav-menu-face nav-menu-avatar">{tab.face.avatar || tab.face.name[0]}</span>)
          : <Icon name={tab.icon} />}
        <span>{tab.text}</span>
        <span className="nav-menu-arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="pl-menu-list nav-menu-list" role="menu">
          {allLabel && (
            <button role="menuitemradio" aria-checked={active && value == null} className={active && value == null ? 'nav-menu-on' : ''}
              onClick={() => { setOpen(false); onSelect(null) }}>
              <span className="nav-menu-avatar nav-menu-all"><Icon name={tab.icon} /></span>
              <span>{allLabel}</span>
            </button>
          )}
          {!members.length && <span className="pl-muted" style={{ padding: '6px 10px' }}>אין ילדים במשפחה</span>}
          {members.map(m => {
            const photo = memberPhoto(m)
            const on = active && m.id === value
            return (
              <button key={m.id} role="menuitemradio" aria-checked={on} className={on ? 'nav-menu-on' : ''}
                onClick={() => { setOpen(false); onSelect(m.id) }}>
                {photo ? <img src={photo} alt="" /> : <span className="nav-menu-avatar">{m.avatar || m.name[0]}</span>}
                <span>{m.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
