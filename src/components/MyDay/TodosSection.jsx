import React, { useState } from 'react'
import { dateText, repeatText } from './todoLabels'
import FoldHead from './FoldHead'

// משימות ב"היום שלי", מתחת לחלונות: באיחור, היום (לפי שעה), בלי תאריך, ו"בהמשך" מקופל.
// משימה שבוצעה היום נשארת במקומה עם קו עליה. כשהכל בוצע, הסקציה מתקפלת לכותרת עם חץ
export default function TodosSection({ todos, today, onToggle, onAdd, onEdit }) {
  const [showLater, setShowLater] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (!todos) {
    return (
      <div className="pl-section">
        <strong style={{ fontSize: 'var(--pl-size-h3)' }}>משימות</strong>
        <p className="pl-muted">כדי להוסיף משימות צריך להריץ ב-Supabase את 004_todos.sql.</p>
      </div>
    )
  }

  const { overdue, today: todayList, undated, later } = todos
  const open = [...overdue, ...todayList, ...undated]
  const doneCount = open.filter(t => t.done_at).length
  const complete = open.length > 0 && doneCount === open.length
  const folded = complete && !expanded

  return (
    <div className="pl-section pl-col" style={{ gap: 10 }}>
      <FoldHead foldable={complete} folded={folded} onToggle={() => setExpanded(v => !v)}>
        <strong style={{ fontSize: 'var(--pl-size-h3)' }}>{complete ? '✓ ' : ''}משימות</strong>
        {open.length > 0 && <span className="pl-chip pl-chip-accent">{doneCount}/{open.length}</span>}
      </FoldHead>
      {!folded && <>

      {open.length === 0 && <div className="pl-muted">אין עוד משימות. משימות עם שעה מופיעות בחלון שלהן.</div>}

      {overdue.length > 0 && <div className="pl-muted">באיחור</div>}
      {overdue.map(t => <TodoCard key={t.id} todo={t} today={today} late onToggle={onToggle} onEdit={onEdit} />)}

      {todayList.length > 0 && overdue.length > 0 && <div className="pl-muted">היום</div>}
      {todayList.map(t => <TodoCard key={t.id} todo={t} today={today} onToggle={onToggle} onEdit={onEdit} />)}

      {undated.length > 0 && <div className="pl-muted">בלי תאריך</div>}
      {undated.map(t => <TodoCard key={t.id} todo={t} today={today} onToggle={onToggle} onEdit={onEdit} />)}

      <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={onAdd}>+ הוסף משימה</button>

      {later.length > 0 && (
        <>
          <button className="pl-link pl-muted" style={{ alignSelf: 'flex-start' }} onClick={() => setShowLater(v => !v)}>
            בהמשך ({later.length}) {showLater ? '· הסתר' : '· הצג'}
          </button>
          {showLater && later.map(t => <TodoCard key={t.id} todo={t} today={today} onToggle={onToggle} onEdit={onEdit} />)}
        </>
      )}
      </>}
    </div>
  )
}

export function TodoCard({ todo, today, late, onToggle, onEdit }) {
  const done = !!todo.done_at
  // התאריך מוצג רק כשהוא לא היום
  const showDate = todo.due_date && todo.due_date !== today
  return (
    <div className="pl-row" style={{ flexWrap: 'nowrap' }}>
      <label className={'pl-step' + (done ? ' pl-step-done' : '')} style={{ flex: 1 }}>
        <input type="checkbox" checked={done} onChange={() => onToggle(todo, !done)} />
        <span style={{ flex: 1 }}>{todo.title}</span>
        {todo.repeat && <span className="pl-muted" title={repeatText(todo.repeat)}>↻</span>}
        {showDate && <span className={'pl-chip' + (late && !done ? ' pl-chip-warn' : '')}>{dateText(todo.due_date, today)}</span>}
        {todo.due_time && <span className="pl-chip pl-chip-accent">{todo.due_time}</span>}
      </label>
      <button className="pl-link" onClick={() => onEdit(todo)}>ערוך</button>
    </div>
  )
}
