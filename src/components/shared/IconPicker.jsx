import React, { useEffect, useRef, useState } from 'react'
import Icon, { ICON_NAMES } from './Icon'

// בחירת אייקון בטופס הרגל ומשימה (2026-10-08): כפתור קטן ליד השם, שפותח רשת של כל האייקונים, כמו בחירת אמוג'י.
// value: שם האייקון, או '' לאייקון אוטומטי (לפי השם). auto: האייקון האוטומטי, להצגה בכפתור כשלא נבחר.
// האייקונים מוצגים כאן תמיד, גם בעיצוב הרגיל (plain.css, .pl-icon-pick)
export default function IconPicker({ value, auto, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // לחיצה מחוץ לרשת סוגרת אותה
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const pick = (name) => { onChange(name); setOpen(false) }

  return (
    <div className="pl-icon-pick" ref={ref}>
      <button
        className={'pl-icon-pick-btn' + (value ? ' pl-icon-pick-chosen' : '')}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="בחירת אייקון"
        title="בחירת אייקון"
      >
        <Icon name={value || auto || 'sparkles'} />
      </button>
      {open && (
        <div className="pl-icon-pick-grid" role="listbox" aria-label="אייקונים">
          <button className={'pl-icon-pick-auto' + (!value ? ' pl-icon-pick-on' : '')} onClick={() => pick('')} title="לפי השם">
            אוטומטי
          </button>
          {ICON_NAMES.map(n => (
            <button key={n} role="option" aria-selected={value === n} className={value === n ? 'pl-icon-pick-on' : ''}
              onClick={() => pick(n)} title={n} aria-label={n}>
              <Icon name={n} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
