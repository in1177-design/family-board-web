import React, { useEffect, useState } from 'react'
import { useStore, api } from '../../store'
import TodoForm from './TodoForm'
import { TodoCard } from './TodosSection'

// היום לפי שעון ישראל
const israelToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date())

// מסך המשימות בפאנל ההורים: המשימות הפתוחות של כל בן משפחה, הורים וילדים.
// מחליף את מסך המשימות הישן (החלטה 2026-10-07)
export default function TodosBoard() {
  const { members, activeMemberId } = useStore()
  const [todos, setTodos] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { todo } או { memberId }
  const today = israelToday()

  const load = () => api.todos.getAll().then(setTodos).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const toggle = async (todo, done) => {
    await api.todos.setDone({ id: todo.id, done }).catch(e => setError(e.message))
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
        <button className="pl-primary" onClick={() => setEditing({})}>משימה חדשה</button>
      </div>

      {error && <p className="pl-error">{error}</p>}
      {!todos && !error && <p>טוען…</p>}

      {todos && members.map(m => {
        const list = todos.filter(t => t.member_id === m.id).sort(order)
        return (
          <div key={m.id} className="pl-section pl-col" style={{ gap: 8 }}>
            <div className="pl-row" style={{ justifyContent: 'space-between' }}>
              <strong>{m.name} <span className="pl-muted">{m.role === 'parent' ? 'הורה' : 'ילד/ה'}</span></strong>
              <span className="pl-chip">{list.filter(t => !t.done_at).length} פתוחות</span>
            </div>
            {list.length === 0 && <div className="pl-muted">אין משימות פתוחות.</div>}
            {list.map(t => (
              <TodoCard key={t.id} todo={t} today={today} late={t.due_date && t.due_date < today}
                onToggle={toggle} onEdit={todo => setEditing({ todo })} />
            ))}
            <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={() => setEditing({ memberId: m.id })}>
              + הוסף משימה ל{m.name}
            </button>
          </div>
        )
      })}

      {/* חלון מודאלי מעל הלוח */}
      {editing && <TodoForm {...editing} byId={activeMemberId} today={today} onClose={() => { setEditing(null); load() }} />}
    </div>
  )
}
