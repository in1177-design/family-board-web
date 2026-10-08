import React, { useState } from 'react'
import PixelCard from '../shared/PixelCard'
import { dateText, repeatText } from './todoLabels'
import FoldHead from './FoldHead'
import Icon from '../shared/Icon'
import { todoIcon } from './icons'

// "המשימות שלי" ב"היום שלי", מתחת לחלונות (wireframe, 2026-10-07): שלוש עמודות, באיחור · להיום · בלי תאריך.
// משימות עתידיות לא מוצגות כאן (הן בלוח המשימות). משימה שבוצעה היום נשארת במקומה עם קו עליה.
// כשהכל בוצע, הסקציה מתקפלת לכותרת עם חץ
export default function TodosSection({ todos, today, onToggle, onAdd, onEdit }) {
  const [expanded, setExpanded] = useState(false)

  if (!todos) {
    return (
      <div className="pl-section">
        <strong style={{ fontSize: 'var(--pl-size-h3)' }}>המשימות שלי</strong>
        <p className="pl-muted">כדי להוסיף משימות צריך להריץ ב-Supabase את 004_todos.sql.</p>
      </div>
    )
  }

  const { overdue, today: todayList, undated } = todos
  const open = [...overdue, ...todayList, ...undated]
  const doneCount = open.filter(t => t.done_at).length
  const complete = open.length > 0 && doneCount === open.length
  const folded = complete && !expanded

  const columns = [
    { id: 'overdue', label: 'באיחור',    list: overdue,   late: true },
    { id: 'today',   label: 'להיום',     list: todayList },
    { id: 'undated', label: 'בלי תאריך', list: undated }
  ]

  return (
    <PixelCard className="pl-col" style={{ gap: 12 }}>
      <div className="pl-row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <div style={{ flex: 1 }}>
          <FoldHead foldable={complete} folded={folded} onToggle={() => setExpanded(v => !v)}>
            <strong style={{ fontSize: 'var(--pl-size-h3)' }}>{complete ? '✓ ' : ''}המשימות שלי</strong>
          </FoldHead>
          <div className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>משימות עתידיות יופיעו כאן בזמן הנכון</div>
        </div>
        <button className="pl-primary" onClick={onAdd}>+ הוספת משימה</button>
      </div>

      {!folded && (
        <div className="pl-cols3">
          {columns.map(c => (
            <div key={c.id} className="pl-col" style={{ gap: 8 }}>
              <div className="pl-row">
                <strong>{c.label}</strong>
                <span className="pl-chip">{c.list.length}</span>
              </div>
              {c.list.length === 0 && <div className="pl-muted">אין</div>}
              {c.list.map(t => <TodoCard key={t.id} todo={t} today={today} late={c.late} onToggle={onToggle} onEdit={onEdit} />)}
            </div>
          ))}
        </div>
      )}
    </PixelCard>
  )
}

// שורת משימה: סימון, שם, ומתחת התאריך והשעה. ↻ למשימה חוזרת, ועיפרון לעריכה.
// inWindow: משימה עם שעה בתוך חלון ב"היום שלי", עם תגית "משימה"
export function TodoCard({ todo, today, late, inWindow, onToggle, onEdit }) {
  const done = !!todo.done_at
  const when = [todo.due_date && dateText(todo.due_date, today), todo.due_time].filter(Boolean).join(' · ')
  return (
    <div className={'pl-row pl-step-row' + (done ? ' pl-step-row-done' : '')} style={{ flexWrap: 'nowrap' }}>
      <label className={'pl-step' + (done ? ' pl-step-done' : '')} style={{ flex: 1 }}>
        <input type="checkbox" checked={done} onChange={() => onToggle(todo, !done)} />
        <Icon name={todoIcon(todo)} className="pl-item-icon" />
        <span className="pl-step-name" style={{ flex: 1 }}>
          <span className="pl-step-title">{todo.title}</span>
          {inWindow && <span className="pl-chip" style={{ marginInlineStart: 6 }}>משימה</span>}
          {when && <span className={'pl-sub' + (late && !done ? ' pl-sub-warn' : '')}>{when}</span>}
        </span>
        {todo.repeat && <span className="pl-muted" title={repeatText(todo.repeat)}>↻</span>}
      </label>
      <button className="pl-icon-button" onClick={() => onEdit(todo)} aria-label="ערוך משימה" title="ערוך משימה">✎</button>
    </div>
  )
}
