import React, { useEffect, useState } from 'react'
import { api } from '../../store'
import PixelCard from '../shared/PixelCard'
import Icon from '../shared/Icon'
import { memberPhoto } from '../shared/memberPhoto'
import { buildWeek } from './week'
import { subjectStyle, subjectVars } from './subjects'
import { DAY_NAMES } from './WeeklySchedule'

// "כל הילדים" בלשונית "ילדים" אצל ההורה (המשתמשת, 2026-10-18): המערכת של היום בלבד, עמודה לכל ילד.
// בכל עמודה: "בית ספר" עם השיעורים, ומתחת "חוגים". בלי הרגלים ומשימות. לחיצה על שם הילד פותחת את המערכת המלאה שלו
const israelWeekday = () => {
  const name = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' })
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name)
}
const range = (start, end) => start ? (end ? `${start}–${end}` : start) : ''
const tint = (item) => { const st = subjectStyle(item); return { ...subjectVars(st), background: st.color, color: st.ink } }

export default function KidsToday({ kids, onPick }) {
  const weekday = israelWeekday()
  // לכל ילד: היום שלו מתוך המערכת, או 'error'
  const [days, setDays] = useState({})

  useEffect(() => {
    let alive = true
    kids.forEach(k => api.schedule.get(k.id)
      .then(d => alive && setDays(v => ({ ...v, [k.id]: buildWeek(d.items, d.periods)[weekday] })))
      .catch(() => alive && setDays(v => ({ ...v, [k.id]: 'error' }))))
    return () => { alive = false }
  }, [kids.map(k => k.id).join(), weekday])

  if (!kids.length) return <div className="pl"><p className="pl-muted">אין ילדים במשפחה.</p></div>

  return (
    <div className="pl pl-schedule kt" style={{ maxWidth: 'var(--pl-page-max)', margin: '0 auto' }}>
      <h2 className="kt-title">היום, יום {DAY_NAMES[weekday]}</h2>
      <div className="kt-cols">
        {kids.map(k => <KidColumn key={k.id} kid={k} day={days[k.id]} onPick={() => onPick(k.id)} />)}
      </div>
    </div>
  )
}

function KidColumn({ kid, day, onPick }) {
  const photo = memberPhoto(kid)
  return (
    <PixelCard className="pl-schedule-day kt-col">
      <button className="kt-kid" onClick={onPick} title={`המערכת המלאה של ${kid.name}`}>
        {photo ? <img src={photo} alt="" /> : <span className="kt-avatar">{kid.avatar || kid.name[0]}</span>}
        <strong>{kid.name}</strong>
        <span className="kt-go" aria-hidden="true">←</span>
      </button>
      {day === undefined && <p className="pl-muted">טוען...</p>}
      {day === 'error' && <p className="pl-muted">לא הצלחתי לטעון.</p>}
      {day && day !== 'error' && <>
        <div className="kt-block">
          <div className="pl-schedule-school">בית ספר {day.school && <span className="pl-schedule-range">{range(day.school.start, day.school.end)}</span>}</div>
          {!day.lessons.length
            ? <p className="pl-muted">אין לימודים היום</p>
            : <ol className="pl-schedule-list">{day.lessons.map(l => <Row key={l.id} item={l} mark={l.period ?? '·'} />)}</ol>}
        </div>
        <div className="kt-block">
          <div className="pl-schedule-school">חוגים</div>
          {!day.activities.length
            ? <p className="pl-muted">אין חוגים היום</p>
            : <ul className="pl-schedule-list pl-schedule-activities">{day.activities.map(a => <Row key={a.id} item={a} mark="★" />)}</ul>}
        </div>
      </>}
    </PixelCard>
  )
}

function Row({ item, mark }) {
  const sub = [item.teacher, item.location].filter(Boolean).join(' · ')
  return (
    <li>
      <div className="pl-schedule-item">
        <span className="pl-schedule-num" aria-hidden={mark === '★'} style={tint(item)}>{mark}</span>
        <span className="pl-schedule-title">
          {item.title}{item.icon && <Icon name={item.icon} className="pl-schedule-item-icon" />}
          {sub && <span className="kt-sub">{sub}</span>}
        </span>
        <span className="pl-schedule-time">{range(item.start, item.end)}</span>
      </div>
    </li>
  )
}
