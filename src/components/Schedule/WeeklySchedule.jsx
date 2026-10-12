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
        {/* כל השבוע: טבלה כמו המערכת המודפסת (המשתמשת, 2026-10-12). בטלפון: יום אחד, ו"כל השבוע" פותח את הטבלה עם גלילה לצד */}
        {narrow && !all
          ? <div className="pl-schedule-week">{shown.map(d => <DayColumn key={d.weekday} day={d} isToday={d.weekday === today} />)}</div>
          : <ScheduleTable days={days} periods={data.periods} today={today} />}
      </>}

      {editing && <ScheduleEditor member={member} data={data} onClose={() => setEditing(false)} onSaved={load} />}
    </div>
  )
}

const range = (start, end) => start ? (end ? `${start}–${end}` : start) : ''

// הטבלה של כל השבוע: שורה לכל שיעור (מספר ושעה מהצלצולים), עמודה לכל יום, כמו המערכת המודפסת.
// בין שיעורים עם רווח בצלצולים: שורת "הפסקה". בסוף: שיעורים בלי מספר, ושורת חוגים.
// השורות: כל מספר שיעור שיש בצלצולים או בשיעורים, כך ששיעור 8 בלי צלצול עדיין מופיע (בלי שעה)
function ScheduleTable({ days, periods, today }) {
  const byNumber = new Map(periods.map(p => [p.period, p]))
  const numbers = [...new Set([
    ...periods.map(p => p.period),
    ...days.flatMap(d => d.lessons.filter(l => l.period != null).map(l => l.period))
  ])].sort((a, b) => a - b)
  const cell = (d, n) => d.lessons.filter(l => l.period === n)
  const unnumbered = days.some(d => d.lessons.some(l => l.period == null))
  const hasActivities = days.some(d => d.activities.length)

  const rows = []
  numbers.forEach((n, i) => {
    const p = byNumber.get(n)
    const prev = byNumber.get(numbers[i - 1])
    if (p && prev && prev.end_time < p.start_time) {
      rows.push(
        <tr key={'break-' + n} className="pl-schedule-break">
          <th scope="row"><span className="pl-schedule-range">{range(prev.end_time, p.start_time)}</span></th>
          <td colSpan={days.length}>הפסקה</td>
        </tr>
      )
    }
    rows.push(
      <tr key={n}>
        <th scope="row">
          <span className="pl-schedule-period">שיעור {n}</span>
          {p && <span className="pl-schedule-range pl-schedule-time">{range(p.start_time, p.end_time)}</span>}
        </th>
        {days.map(d => (
          <td key={d.weekday} className={d.weekday === today ? 'pl-schedule-col-today' : undefined}>
            {cell(d, n).map(l => <div key={l.id}>{l.title}</div>)}
          </td>
        ))}
      </tr>
    )
  })

  return (
    <div className="pl-schedule-table-wrap">
      <table className="pl-schedule-table">
        <thead>
          <tr>
            <th scope="col"><span className="pl-sr">שיעור</span></th>
            {days.map(d => (
              <th key={d.weekday} scope="col" className={d.weekday === today ? 'pl-schedule-col-today' : undefined}>
                {DAY_NAMES[d.weekday]}
                {d.school && <span className="pl-schedule-range pl-schedule-time">{range(d.school.start, d.school.end)}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows}
          {unnumbered && (
            <tr>
              <th scope="row"><span className="pl-schedule-period">בשעה אחרת</span></th>
              {days.map(d => (
                <td key={d.weekday} className={d.weekday === today ? 'pl-schedule-col-today' : undefined}>
                  {d.lessons.filter(l => l.period == null).map(l => (
                    <div key={l.id}>{l.title} <span className="pl-schedule-range pl-schedule-time">{range(l.start, l.end)}</span></div>
                  ))}
                </td>
              ))}
            </tr>
          )}
          {hasActivities && (
            <tr className="pl-schedule-activities-row">
              <th scope="row"><span className="pl-schedule-period">חוגים</span></th>
              {days.map(d => (
                <td key={d.weekday} className={d.weekday === today ? 'pl-schedule-col-today' : undefined}>
                  {d.activities.map(a => (
                    <div key={a.id} className="pl-schedule-activity-cell">
                      {a.title}<span className="pl-schedule-range pl-schedule-time">{range(a.start, a.end)}</span>
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

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
