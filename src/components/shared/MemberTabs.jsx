import React from 'react'
import { memberPhoto } from './memberPhoto'

// בחירת בן משפחה בראש לוח ניהול (הרגלים, משימות), במקום כולם באותו דף (המשתמשת, 2026-10-09).
// תמונה ושם לכל אחד, כמו "למי?" בטופס. count: מספר קטן ליד השם (למשל משימות פתוחות)
export default function MemberTabs({ members, value, onChange, count }) {
  return (
    <div className="pl-member-tabs" role="tablist">
      {members.map(m => {
        const photo = memberPhoto(m)
        const n = count?.(m)
        return (
          <button key={m.id} role="tab" aria-selected={value === m.id}
            className={'pl-member-tab' + (value === m.id ? ' pl-member-tab-on' : '')} onClick={() => onChange(m.id)}>
            {photo ? <img src={photo} alt="" /> : <span className="pl-member-tab-avatar">{m.avatar || m.name[0]}</span>}
            <span>{m.name}</span>
            {n > 0 && <span className="pl-chip">{n}</span>}
          </button>
        )
      })}
    </div>
  )
}
