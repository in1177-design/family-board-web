import React, { useEffect, useState } from 'react'
import { api } from '../../store'
import PixelCard from '../shared/PixelCard'
import { useNarrow } from '../MyDay/MyDay'
import ScheduleEditor from './ScheduleEditor'
import ScheduleItemModal from './ScheduleItemModal'

// מערכת שעות שבועית (החלטה 2026-10-12): במקום היומן. תבנית קבועה לפי יום בשבוע, בלי תאריכים ולא קשורה ל-Google.
// שתי טבלאות באותם רוחבים: השיעורים (שורה לכל שיעור, כמו המערכת המודפסת), ומתחת "חוגים".
// השעות מחושבות בשרת (week, מ-lib/schedule.js). בטלפון: יום אחד עם בורר ימים, ו"כל השבוע" פותח את הטבלאות.
// canEdit: לכל טבלה כפתור "עריכה". במצב עריכה כל תא לחיץ, ונפתח חלון לשם, שעה וצבע (ScheduleItemModal).
// תא ריק בטבלת השיעורים מוסיף שיעור. מערכת הצלצולים: "צלצולים" בעריכת השיעורים (ScheduleEditor)
export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
export const DAY_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

// היום בשבוע לפי שעון ישראל (0 = ראשון)
const israelWeekday = () => {
  const name = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' })
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name)
}

const hasContent = (d) => d.lessons.length > 0 || d.activities.length > 0
const range = (start, end) => start ? (end ? `${start}–${end}` : start) : ''
// צבע של שיעור או חוג: רקע התא
const tint = (item) => item?.color ? { background: item.color } : undefined

export default function WeeklySchedule({ member, canEdit }) {
  const narrow = useNarrow()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState(israelWeekday)
  const [all, setAll] = useState(false)
  const [editLessons, setEditLessons] = useState(false)
  const [editActivities, setEditActivities] = useState(false)
  const [modalItem, setModalItem] = useState(null)
  const [bells, setBells] = useState(false)

  const load = () => api.schedule.get(member.id)
    .then(d => { setData(d); setError('') })
    .catch(e => setError('לא הצלחתי לטעון את המערכת. ' + (e.message || '')))
  useEffect(() => { setData(null); setEditLessons(false); setEditActivities(false); load() }, [member.id])

  if (error) return <div className="pl"><p className="pl-muted">{error}</p></div>
  if (!data) return <div className="pl"><p className="pl-muted">טוען...</p></div>

  const today = israelWeekday()
  // א׳–ו׳ תמיד, שבת רק אם יש בה משהו
  const days = data.week.filter(d => d.weekday < 6 || hasContent(d))
  const noLessons = !days.some(d => d.lessons.length)
  const noActivities = !days.some(d => d.activities.length)
  const oneDay = narrow && !all
  const shown = oneDay ? days.filter(d => d.weekday === picked) : days
  // פריט מהשרת (עם start/end מחושבים) לחלון: רק השדות של הפריט עצמו
  const open = (item) => setModalItem(data.items.find(i => i.id === item.id) || item)

  const editButton = (on, set) => canEdit && (
    <button className={'pl-link' + (on ? ' pl-schedule-editing' : '')} aria-pressed={on} onClick={() => set(v => !v)}>
      {on ? 'סיום עריכה' : 'עריכה'}
    </button>
  )

  return (
    <div className="pl pl-schedule" style={{ maxWidth: 'var(--pl-page-max)', margin: '0 auto' }}>
      <div className="pl-row pl-schedule-head">
        <h2>מערכת שבועית</h2>
        <div className="pl-row">
          {narrow && <button className="pl-link" aria-pressed={all} onClick={() => setAll(v => !v)}>{all ? 'יום אחד' : 'כל השבוע'}</button>}
          {editLessons && <button className="pl-link" onClick={() => setBells(true)}>צלצולים</button>}
          {editButton(editLessons, setEditLessons)}
        </div>
      </div>

      {oneDay && (
        <div className="pl-row pl-schedule-days" role="tablist" aria-label="יום בשבוע">
          {days.map(d => (
            <button key={d.weekday} role="tab" aria-selected={picked === d.weekday}
              className={'pl-slot' + (picked === d.weekday ? ' pl-slot-on' : '') + (d.weekday === today ? ' pl-schedule-today' : '')}
              onClick={() => setPicked(d.weekday)}>
              {DAY_SHORT[d.weekday]}
            </button>
          ))}
        </div>
      )}

      {editLessons && <p className="pl-muted pl-schedule-hint">לחיצה על שיעור משנה אותו. לחיצה על תא ריק מוסיפה שיעור.</p>}
      {noLessons && !editLessons
        ? <PixelCard><p className="pl-muted">עוד אין שיעורים{canEdit ? '. אפשר להוסיף ב"עריכה".' : '.'}</p></PixelCard>
        : oneDay
          ? shown.map(d => <DayLessons key={d.weekday} day={d} isToday={d.weekday === today} editing={editLessons} onPick={open}
              onAdd={() => setModalItem({ kind: 'lesson', weekday: d.weekday, period: Math.max(0, ...d.lessons.map(l => l.period || 0)) + 1 })} />)
          : <LessonsTable days={days} periods={data.periods} today={today} editing={editLessons} onPick={open}
              onAdd={(weekday, period) => setModalItem({ kind: 'lesson', weekday, period })} />}

      <div className="pl-row pl-schedule-head pl-schedule-head-sub">
        <h2>חוגים</h2>
        <div className="pl-row">
          {editActivities && <button className="pl-link" onClick={() => setModalItem({ kind: 'activity', weekday: oneDay ? picked : today < 6 ? today : 0 })}>+ חוג</button>}
          {editButton(editActivities, setEditActivities)}
        </div>
      </div>
      {editActivities && <p className="pl-muted pl-schedule-hint">לחיצה על חוג משנה את השם, השעה או הצבע.</p>}
      {noActivities
        ? <PixelCard><p className="pl-muted">אין חוגים{canEdit ? '. אפשר להוסיף ב"עריכה".' : '.'}</p></PixelCard>
        : oneDay
          ? shown.map(d => <DayActivities key={d.weekday} day={d} editing={editActivities} onPick={open} />)
          : <ActivitiesTable days={days} today={today} editing={editActivities} onPick={open} />}

      {modalItem && <ScheduleItemModal member={member} item={modalItem} onClose={() => setModalItem(null)} onSaved={load} />}
      {bells && <ScheduleEditor member={member} data={data} onClose={() => setBells(false)} onSaved={load} />}
    </div>
  )
}

// תוכן של תא: במצב עריכה כפתור שממלא את התא, אחרת טקסט
function Pickable({ editing, onClick, label, children, className = '' }) {
  if (!editing) return <div className={className}>{children}</div>
  return <button className={'pl-schedule-pick ' + className} onClick={onClick} aria-label={label}>{children}</button>
}

// שורת הכותרת של שתי הטבלאות: ימים, ושעות בית הספר רק בטבלת השיעורים
function DaysHead({ days, today, label, withSchool }) {
  return (
    <thead>
      <tr>
        <th scope="col"><span className="pl-sr">{label}</span></th>
        {days.map(d => (
          <th key={d.weekday} scope="col" className={d.weekday === today ? 'pl-schedule-col-today' : undefined}>
            {DAY_NAMES[d.weekday]}
            {withSchool && d.school && <span className="pl-schedule-range pl-schedule-time">{range(d.school.start, d.school.end)}</span>}
          </th>
        ))}
      </tr>
    </thead>
  )
}

// טבלת השיעורים: שורה לכל שיעור (מספר ושעה מהצלצולים), עמודה לכל יום, כמו המערכת המודפסת.
// בין שיעורים עם רווח בצלצולים: שורת "הפסקה". שיעור בלי צלצול (למשל 8) מופיע בלי שעה.
// שיעורים בלי מספר: שורה "בשעה אחרת" בסוף
function LessonsTable({ days, periods, today, editing, onPick, onAdd }) {
  const byNumber = new Map(periods.map(p => [p.period, p]))
  const numbers = [...new Set([
    ...periods.map(p => p.period),
    ...days.flatMap(d => d.lessons.filter(l => l.period != null).map(l => l.period))
  ])].sort((a, b) => a - b)
  const unnumbered = days.some(d => d.lessons.some(l => l.period == null))
  const todayClass = (d) => d.weekday === today ? 'pl-schedule-col-today' : undefined

  const lessonCell = (d, lessons, period) => {
    const one = lessons.length === 1 ? lessons[0] : null
    return (
      <td key={d.weekday} className={todayClass(d)} style={tint(one)}>
        {lessons.map(l => (
          <Pickable key={l.id} editing={editing} onClick={() => onPick(l)} label={`עריכת ${l.title}, ${DAY_NAMES[d.weekday]}`}>
            {l.title}
            {period === null && <span className="pl-schedule-range pl-schedule-time">{range(l.start, l.end)}</span>}
          </Pickable>
        ))}
        {editing && !lessons.length && period !== null && (
          <button className="pl-schedule-pick pl-schedule-pick-empty" onClick={() => onAdd(d.weekday, period)}
            aria-label={`הוספת שיעור ${period}, ${DAY_NAMES[d.weekday]}`}>+</button>
        )}
      </td>
    )
  }

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
        {days.map(d => lessonCell(d, d.lessons.filter(l => l.period === n), n))}
      </tr>
    )
  })

  return (
    <div className="pl-schedule-table-wrap">
      <table className={'pl-schedule-table' + (editing ? ' pl-schedule-table-editing' : '')}>
        <DaysHead days={days} today={today} label="שיעור" withSchool />
        <tbody>
          {rows}
          {unnumbered && (
            <tr>
              <th scope="row"><span className="pl-schedule-period">בשעה אחרת</span></th>
              {days.map(d => lessonCell(d, d.lessons.filter(l => l.period == null), null))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// טבלת החוגים: אותם רוחבים כמו טבלת השיעורים. שורה אחת, ובכל יום החוגים לפי שעה
function ActivitiesTable({ days, today, editing, onPick }) {
  return (
    <div className="pl-schedule-table-wrap">
      <table className={'pl-schedule-table' + (editing ? ' pl-schedule-table-editing' : '')}>
        <DaysHead days={days} today={today} label="חוגים" />
        <tbody>
          <tr className="pl-schedule-activities-row">
            <th scope="row"><span className="pl-schedule-period">אחרי הלימודים</span></th>
            {days.map(d => (
              <td key={d.weekday} className={d.weekday === today ? 'pl-schedule-col-today' : undefined}>
                {d.activities.map(a => (
                  <Pickable key={a.id} editing={editing} onClick={() => onPick(a)} label={`עריכת ${a.title}, ${DAY_NAMES[d.weekday]}`}
                    className="pl-schedule-activity-cell">
                    <span style={tint(a)} className="pl-schedule-activity-fill">
                      {a.title}<span className="pl-schedule-range pl-schedule-time">{range(a.start, a.end)}</span>
                    </span>
                  </Pickable>
                ))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// בטלפון: השיעורים של יום אחד
function DayLessons({ day, isToday, editing, onPick, onAdd }) {
  return (
    <PixelCard className={'pl-schedule-day' + (isToday ? ' pl-schedule-day-today' : '')}>
      <div className="pl-schedule-day-head">
        <strong>{DAY_NAMES[day.weekday]}</strong>
        {isToday && <span className="pl-chip pl-chip-accent">היום</span>}
      </div>
      {day.school && <div className="pl-schedule-school">בית ספר <span className="pl-schedule-range">{range(day.school.start, day.school.end)}</span></div>}
      {!day.lessons.length && <p className="pl-muted">אין לימודים</p>}
      {day.lessons.length > 0 && (
        <ol className="pl-schedule-list">
          {day.lessons.map(l => (
            <li key={l.id}>
              <Pickable editing={editing} onClick={() => onPick(l)} label={`עריכת ${l.title}`} className="pl-schedule-item">
                <span className="pl-schedule-num" style={tint(l)}>{l.period ?? '·'}</span>
                <span className="pl-schedule-title">{l.title}</span>
                <span className="pl-schedule-time">{range(l.start, l.end)}</span>
              </Pickable>
            </li>
          ))}
        </ol>
      )}
      {editing && <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={onAdd}>+ שיעור</button>}
    </PixelCard>
  )
}

// בטלפון: החוגים של יום אחד
function DayActivities({ day, editing, onPick }) {
  return (
    <PixelCard className="pl-schedule-day">
      {!day.activities.length && <p className="pl-muted">אין חוגים ביום {DAY_NAMES[day.weekday]}</p>}
      {day.activities.length > 0 && (
        <ul className="pl-schedule-list pl-schedule-activities">
          {day.activities.map(a => (
            <li key={a.id}>
              <Pickable editing={editing} onClick={() => onPick(a)} label={`עריכת ${a.title}`} className="pl-schedule-item pl-schedule-activity">
                <span className="pl-schedule-num" aria-hidden="true" style={tint(a)}>★</span>
                <span className="pl-schedule-title">{a.title}</span>
                <span className="pl-schedule-time">{range(a.start, a.end)}</span>
              </Pickable>
            </li>
          ))}
        </ul>
      )}
    </PixelCard>
  )
}
