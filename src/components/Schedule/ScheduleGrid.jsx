import React from 'react'
import Icon from '../shared/Icon'
import { subjectStyle, subjectVars } from './subjects'
import { DAY_NAMES } from './WeeklySchedule'

// המערכת השבועית כרשת כרטיסים (2026-10-13, לפי העיצוב של המשתמשת):
// כותרת: כרטיס לכל יום עם התאריך של השבוע הזה. בצד: "שיעור N" והשעה מהצלצולים.
// כל שיעור: כרטיס בצבע של הקבוצה שלו (subjects.js), עם שם המורה, ואייקון רק אם ההורה בחר. שיעור כפול (אותו שיעור בשני שיעורים רצופים,
// בלי הפסקה ביניהם) הוא כרטיס אחד בגובה שתי שורות. הפסקה: קו מקווקו עם האורך שלה.
// החוגים בכרטיס נפרד מתחת, באותן עמודות.
// editing: כל כרטיס הוא כפתור (onPick), ותא ריק מוסיף שיעור (onAdd).
// flagged: תאים שלא נקראו בטיוטה מתמונה (Set של "יום|שיעור"): תא ריק כזה מסומן "?" בצהוב

const range = (start, end) => start ? (end ? `${start}–${end}` : start) : ''
const minutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const same = (a, b) => a.title.trim() === b.title.trim() && (a.teacher || '') === (b.teacher || '') &&
  (a.color || '') === (b.color || '') && !a.start_time && !b.start_time

// התאריך של כל יום בשבוע הזה (ראשון עד שבת), לפי שעון ישראל: "11.10"
function weekDates() {
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }))
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

const columns = (days) => `var(--sg-side) repeat(${days.length}, minmax(var(--sg-col), 1fr))`


// כרטיס של שיעור או חוג. במצב עריכה: כפתור
function Card({ item, editing, onPick, double, activity, style }) {
  const s = subjectStyle(item)
  const Tag = editing ? 'button' : 'div'
  const sub = [item.teacher, double && 'שיעור כפול'].filter(Boolean).join(' · ')
  return (
    <Tag className={'sg-card' + (activity ? ' sg-card-activity' : '') + (editing ? ' sg-card-edit' : '')}
      style={{ ...subjectVars(s), ...style }} onClick={editing ? () => onPick(item) : undefined}
      aria-label={editing ? `עריכת ${item.title}, ${DAY_NAMES[item.weekday]}` : undefined}>
      <span className="sg-card-text">
        {activity && <span className="sg-time">{range(item.start, item.end)}</span>}
        <strong>{item.title}</strong>
        {sub && <span className="sg-sub">{sub}</span>}
        {!activity && item.start_time && <span className="sg-time sg-time-own">{range(item.start, item.end)}</span>}
      </span>
      {item.icon && <Icon name={item.icon} className="sg-icon" />}
    </Tag>
  )
}

export function LessonsGrid({ days, periods, today, editing, onPick, onAdd, flagged }) {
  const dates = weekDates()
  const byNumber = new Map(periods.map(p => [p.period, p]))
  const numbers = [...new Set([
    ...periods.map(p => p.period),
    ...days.flatMap(d => d.lessons.filter(l => l.period != null).map(l => l.period))
  ])].sort((a, b) => a - b)

  // השורות של הרשת: כותרת, ואז לכל שיעור שורה, עם שורת הפסקה לפניו כשיש רווח בצלצולים
  const rows = ['auto']
  const rowOf = new Map()
  const breaks = []
  numbers.forEach((n, i) => {
    const p = byNumber.get(n)
    const prev = byNumber.get(numbers[i - 1])
    if (p && prev && prev.end_time < p.start_time) {
      rows.push('26px')
      breaks.push({ row: rows.length, before: n, minutes: minutes(p.start_time) - minutes(prev.end_time) })
    }
    rows.push('minmax(var(--sg-row), auto)')
    rowOf.set(n, rows.length)
  })
  const unnumbered = days.some(d => d.lessons.some(l => l.period == null))
  if (unnumbered) { rows.push('minmax(var(--sg-row), auto)') }
  const otherRow = rows.length

  const cells = []
  days.forEach((d, di) => {
    const col = di + 2
    const taken = new Set()
    const lessons = d.lessons.filter(l => l.period != null).sort((a, b) => a.period - b.period)
    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i]
      if (taken.has(l.period)) continue
      // שיעור כפול: אותו שיעור במספר הבא, באותה שורה ברצף (בלי הפסקה ביניהם)
      let span = 1
      while (lessons[i + span] && lessons[i + span].period === l.period + span && same(l, lessons[i + span]) &&
        rowOf.get(l.period + span) === rowOf.get(l.period) + span) span++
      for (let k = 0; k < span; k++) taken.add(l.period + k)
      const others = d.lessons.filter(o => o.period === l.period && o.id !== l.id)
      cells.push(
        <div key={l.id} className="sg-cell" style={{ gridColumn: col, gridRow: `${rowOf.get(l.period)} / span ${span}` }}>
          <Card item={l} editing={editing} onPick={onPick} double={span > 1} />
          {others.map(o => <Card key={o.id} item={o} editing={editing} onPick={onPick} />)}
        </div>
      )
      // שיעור נוסף באותו מספר כבר בתא (others), ויידלג בלולאה כי המספר תפוס
    }
    if (editing) {
      numbers.filter(n => !taken.has(n)).forEach(n => {
        const flag = flagged?.has(`${d.weekday}|${n}`)
        cells.push(
          <button key={`add-${d.weekday}-${n}`} className={'sg-add' + (flag ? ' sg-add-flag' : '')} style={{ gridColumn: col, gridRow: rowOf.get(n) }}
            onClick={() => onAdd(d.weekday, n)} title={flag ? 'לא נקרא מהתמונה' : undefined}
            aria-label={`${flag ? 'לא נקרא. ' : ''}הוספת שיעור ${n}, ${DAY_NAMES[d.weekday]}`}>{flag ? '?' : '+'}</button>
        )
      })
    }
    if (unnumbered) {
      const free = d.lessons.filter(l => l.period == null)
      if (free.length) cells.push(
        <div key={'other-' + d.weekday} className="sg-cell" style={{ gridColumn: col, gridRow: otherRow }}>
          {free.map(l => <Card key={l.id} item={l} editing={editing} onPick={onPick} />)}
        </div>
      )
    }
  })

  return (
    <div className="sg-scroll">
      <div className={'sg-grid' + (editing ? ' sg-editing' : '')} style={{ gridTemplateColumns: columns(days), gridTemplateRows: rows.join(' ') }}>
        <div className="sg-side sg-corner" style={{ gridRow: 1, gridColumn: 1 }}><Icon name="clock" /></div>
        {days.map((d, di) => (
          <div key={d.weekday} className={'sg-day' + (d.weekday === today ? ' sg-day-today' : '')} style={{ gridRow: 1, gridColumn: di + 2 }}>
            <strong>{DAY_NAMES[d.weekday]}</strong>
            <span className="sg-time">{dates[d.weekday]}</span>
          </div>
        ))}
        {numbers.map(n => {
          const p = byNumber.get(n)
          return (
            // מספר השיעור, ולידו שעת ההתחלה והסיום אחת מתחת לשנייה (המשתמשת, 2026-10-13)
            <div key={'p' + n} className="sg-side sg-period" style={{ gridRow: rowOf.get(n), gridColumn: 1 }} aria-label={`שיעור ${n}`}>
              <span className="sg-num">{n}</span>
              {p && <span className="sg-times"><span>{p.start_time}</span><span>{p.end_time}</span></span>}
            </div>
          )
        })}
        {unnumbered && <div className="sg-side sg-period" style={{ gridRow: otherRow, gridColumn: 1 }}><span className="sg-other">בשעה אחרת</span></div>}
        {breaks.map(b => (
          <div key={'b' + b.before} className="sg-break" style={{ gridRow: b.row, gridColumn: '1 / -1' }}>
            <span>הפסקה · {b.minutes} דק׳</span>
          </div>
        ))}
        {cells}
      </div>
    </div>
  )
}

export function ActivitiesGrid({ days, editing, onPick }) {
  return (
    <div className="sg-scroll">
      <div className={'sg-grid sg-grid-activities' + (editing ? ' sg-editing' : '')} style={{ gridTemplateColumns: columns(days) }}>
        {/* העמודה הראשונה ריקה, כדי שהימים יתיישרו עם הלוח שמעל. הכותרת "חוגים" בשורת הכלים */}
        <div className="sg-side" aria-hidden="true" />
        {days.map(d => (
          <div key={d.weekday} className="sg-cell sg-stack">
            {d.activities.map(a => <Card key={a.id} item={a} editing={editing} onPick={onPick} activity />)}
          </div>
        ))}
      </div>
    </div>
  )
}
