import React, { useState } from 'react'
import { DAY_LETTERS } from '../Routines/labels'

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const pad = (n) => String(n).padStart(2, '0')

// לוח שנה של חודש, שבוע מתחיל בראשון. ימים שעברו חסומים (רפרנס: Microsoft To Do)
export default function DatePicker({ value, today, onPick }) {
  const start = value || today
  const [ym, setYm] = useState({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) })

  const first = new Date(Date.UTC(ym.y, ym.m - 1, 1)).getUTCDay()
  const count = new Date(Date.UTC(ym.y, ym.m, 0)).getUTCDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)]

  const move = (n) => setYm(({ y, m }) => {
    const t = y * 12 + (m - 1) + n
    return { y: Math.floor(t / 12), m: (t % 12) + 1 }
  })
  const isCurrentMonth = ym.y === Number(today.slice(0, 4)) && ym.m === Number(today.slice(5, 7))

  return (
    <div className="pl-box pl-col" style={{ gap: 8 }}>
      <div className="pl-row" style={{ justifyContent: 'space-between' }}>
        <strong>{MONTHS[ym.m - 1]} {ym.y}</strong>
        <span className="pl-row" style={{ gap: 4 }}>
          {/* RTL: החץ הימני הוא אחורה */}
          <button className="pl-cal-nav" onClick={() => move(-1)} disabled={isCurrentMonth} aria-label="החודש הקודם">›</button>
          <button className="pl-cal-nav" onClick={() => move(1)} aria-label="החודש הבא">‹</button>
        </span>
      </div>
      <div className="pl-cal">
        {DAY_LETTERS.map(l => <div key={l} className="pl-cal-head">{l}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={'e' + i} />
          const date = `${ym.y}-${pad(ym.m)}-${pad(d)}`
          const cls = 'pl-cal-day' + (date === value ? ' pl-cal-on' : '') + (date === today ? ' pl-cal-today' : '')
          return (
            <button key={date} className={cls} disabled={date < today} onClick={() => onPick(date)}>{d}</button>
          )
        })}
      </div>
    </div>
  )
}
