import React, { useEffect, useState } from 'react'
import { api } from '../../store'
import PixelCard from '../shared/PixelCard'
import { useNarrow } from '../MyDay/MyDay'
import ScheduleEditor from './ScheduleEditor'

// מערכת שעות שבועית (החלטה 2026-10-12): במקום היומן. תבנית קבועה לפי יום בשבוע, בלי תאריכים ולא קשורה ל-Google.
// שיעורים לפי מספר שיעור (השעה ממערכת הצלצולים), ואחריהם החוגים. השעות מחושבות בשרת (week, מ-lib/schedule.js).
// במחשב: עמודה לכל יום. בטלפון: בורר ימים ורק היום שנבחר, או "כל השבוע".
// canEdit: כפתור "עריכה" (עד פרוסה ג רק הורה)
export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
export const DAY_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

// היום בשבוע לפי שעון ישראל (0 = ראשון)
const israelWeekday = () => {
  const name = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' })
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name)
}

const hasContent = (d) => d.lessons.length > 0 || d.activities.length > 0

export default function WeeklySchedule({ member, canEdit }) {
  const narrow = useNarrow()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState(israelWeekday)
  const [all, setAll] = useState(false)
  const [editing, setEditing] = useState(false)

  const load = () => api.schedule.get(member.id)
    .then(d => { setData(d); setError('') })
    .catch(e => setError('לא הצלחתי לטעון את המערכת. ' + (e.message || '')))
  useEffect(() => { setData(null); load() }, [member.id])

  if (error) return <div className="pl"><p className="pl-muted">{error}</p></div>
  if (!data) return <div className="pl"><p className="pl-muted">טוען...</p></div>

  const today = israelWeekday()
  // א׳–ו׳ תמיד, שבת רק אם יש בה משהו
  const days = data.week.filter(d => d.weekday < 6 || hasContent(d))
  const empty = !days.some(hasContent)
  const shown = narrow && !all ? days.filter(d => d.weekday === picked) : days

  return (
    <div className="pl pl-schedule" style={{ maxWidth: 'var(--pl-page-max)', margin: '0 auto' }}>
      <div className="pl-row pl-schedule-head">
        <h2>מערכת שבועית</h2>
        <div className="pl-row">
          {narrow && !empty && <button className="pl-link" aria-pressed={all} onClick={() => setAll(v => !v)}>{all ? 'יום אחד' : 'כל השבוע'}</button>}
          {canEdit && <button className="pl-link" onClick={() => setEditing(true)}>עריכה</button>}
        </div>
      </div>

      {empty ? (
        <PixelCard><p className="pl-muted">עוד אין מערכת שעות{canEdit ? '. אפשר להוסיף ב"עריכה".' : '.'}</p></PixelCard>
      ) : <>
        {narrow && !all && (
          <div className="pl-row pl-schedule-days" role="tablist" aria-label="יום בשבוע">
            {days.map(d => (
              <button key={d.weekday} role="tab" aria-selected={!all && picked === d.weekday}
                className={'pl-slot' + (!all && picked === d.weekday ? ' pl-slot-on' : '') + (d.weekday === today ? ' pl-schedule-today' : '')}
                onClick={() => { setPicked(d.weekday); setAll(false) }}>
                {DAY_SHORT[d.weekday]}
              </button>
            ))}
          </div>
        )}
        <div className="pl-schedule-week" style={narrow ? undefined : { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {shown.map(d => <DayColumn key={d.weekday} day={d} isToday={d.weekday === today} />)}
        </div>
      </>}

      {editing && <ScheduleEditor member={member} data={data} onClose={() => setEditing(false)} onSaved={load} />}
    </div>
  )
}

const range = (start, end) => start ? (end ? `${start}–${end}` : start) : ''

function DayColumn({ day, isToday }) {
  return (
    <PixelCard className={'pl-schedule-day' + (isToday ? ' pl-schedule-day-today' : '')}>
      <div className="pl-schedule-day-head">
        <strong>{DAY_NAMES[day.weekday]}</strong>
        {isToday && <span className="pl-chip pl-chip-accent">היום</span>}
      </div>
      {day.school && <div className="pl-schedule-school">בית ספר <span className="pl-schedule-range">{range(day.school.start, day.school.end)}</span></div>}
      {!hasContent(day) && <p className="pl-muted">אין כלום</p>}
      {day.lessons.length > 0 && (
        <ol className="pl-schedule-list">
          {day.lessons.map(l => (
            <li key={l.id} className="pl-schedule-item">
              <span className="pl-schedule-num">{l.period ?? '·'}</span>
              <span className="pl-schedule-title">{l.title}</span>
              <span className="pl-schedule-time">{range(l.start, l.end)}</span>
            </li>
          ))}
        </ol>
      )}
      {day.activities.length > 0 && (
        <ul className="pl-schedule-list pl-schedule-activities">
          {day.activities.map(a => (
            <li key={a.id} className="pl-schedule-item pl-schedule-activity">
              <span className="pl-schedule-num" aria-hidden="true">★</span>
              <span className="pl-schedule-title">{a.title}</span>
              <span className="pl-schedule-time">{range(a.start, a.end)}</span>
            </li>
          ))}
        </ul>
      )}
    </PixelCard>
  )
}
