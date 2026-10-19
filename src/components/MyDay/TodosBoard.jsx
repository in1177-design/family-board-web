import React, { useEffect, useState } from 'react'
import { useStore, api } from '../../store'
import TodoForm from './TodoForm'
import { TodoCard } from './TodosSection'
import MemberTabs from '../shared/MemberTabs'
import PixelCard from '../shared/PixelCard'
import Icon from '../shared/Icon'

// היום לפי שעון ישראל
const israelToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date())

// מסך המשימות בפאנל ההורים: המשימות הפתוחות של כל בן משפחה, הורים וילדים.
// מחליף את מסך המשימות הישן (החלטה 2026-10-07)
// fixedMemberId: לוח של בן משפחה אחד, בלי הבחירה למעלה (לשוניות הילד ב"ילדים", 2026-10-18)
export default function TodosBoard({ fixedMemberId } = {}) {
  const { members, activeMemberId } = useStore()
  const [todos, setTodos] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { todo } או { memberId }
  // בן משפחה אחד בכל פעם, עם בחירה למעלה (המשתמשת, 2026-10-09)
  const [memberId, setMemberId] = useState(() => members[0]?.id)
  const member = members.find(m => m.id === (fixedMemberId || memberId)) || members[0]
  const today = israelToday()

  const load = () => api.todos.getAll().then(setTodos).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const toggle = async (todo, done) => {
    await api.todos.setDone({ id: todo.id, done }).catch(e => setError(e.message))
    load()
  }

  // מחיקה מהירה מהלוח (2026-10-09), עם אישור אחד
  const remove = async (todo) => {
    if (!confirm(`למחוק את המשימה "${todo.title}"?`)) return
    await api.todos.delete(todo.id).catch(e => setError(e.message))
    load()
  }

  // באיחור והיום קודם, אחר כך לפי תאריך, ובסוף בלי תאריך
  const order = (a, b) =>
    (a.due_date || '9999').localeCompare(b.due_date || '9999') ||
    (a.due_time || '99').localeCompare(b.due_time || '99')

  return (
    <div className="pl">
      <div className="pl-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2>משימות</h2>
          <p>דברים שעושים פעם אחת, או שחוזרים לפי לוח</p>
        </div>
        <button className="pl-primary" onClick={() => setEditing(member ? { memberId: member.id } : {})}>משימה חדשה</button>
      </div>

      {error && <p className="pl-error">{error}</p>}
      {!todos && !error && <p>טוען…</p>}

      {!fixedMemberId && <MemberTabs members={members} value={member?.id} onChange={setMemberId}
        count={m => (todos || []).filter(t => t.member_id === m.id && !t.done_at).length} />}

      {todos && member && (() => {
        const list = todos.filter(t => t.member_id === member.id).sort(order)
        return (
          // כרטיס באותו עיצוב כמו החלונות של "היום של" (המשתמשת, 2026-10-18). הסדר לפי תאריך ושעה, בלי גרירה
          <PixelCard className="pl-col pl-win pl-win-todos" style={{ gap: 10, marginTop: 16 }}>
            <div className="pl-fold-head wb-head">
              <div className="pl-win-head">
                <Icon name="check" className="pl-win-icon-line" />
                <div>
                  <strong style={{ fontSize: 'var(--pl-size-h3)' }}>המשימות של {member.name}</strong>
                  <div className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>לפי תאריך ושעה</div>
                </div>
              </div>
              <span className="pl-chip pl-chip-accent">{list.filter(t => !t.done_at).length} פתוחות</span>
            </div>
            {list.length === 0 && <div className="pl-muted">אין משימות פתוחות.</div>}
            {list.map(t => (
              <TodoCard key={t.id} todo={t} today={today} late={t.due_date && t.due_date < today}
                onToggle={toggle} onEdit={todo => setEditing({ todo })} onDelete={remove} />
            ))}
            <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={() => setEditing({ memberId: member.id })}>
              + הוסף משימה ל{member.name}
            </button>
          </PixelCard>
        )
      })()}

      {/* חלון מודאלי מעל הלוח */}
      {editing && <TodoForm {...editing} byId={activeMemberId} today={today} onClose={() => { setEditing(null); load() }} />}
    </div>
  )
}
