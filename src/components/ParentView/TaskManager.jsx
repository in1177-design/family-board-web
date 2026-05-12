import React, { useState } from 'react'
import { useStore } from '../../store'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

const RECURRING_OPTS = [
  { value: '',        label: 'חד פעמי' },
  { value: 'daily',   label: 'יומי' },
  { value: 'weekly',  label: 'שבועי' },
  { value: 'monthly', label: 'חודשי' }
]

const DEFAULT_FORM = { memberId: '', title: '', description: '', points: 10, dueDate: '', recurring: '' }

export default function TaskManager() {
  const { members, tasks, createTask, deleteTask, updateTask, loadTasks } = useStore()
  const kids = members.filter(m => m.role === 'child')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...DEFAULT_FORM, memberId: kids[0]?.id || '' })
  const [saving, setSaving] = useState(false)
  const [filterMember, setFilterMember] = useState('all')
  const [filterDone, setFilterDone] = useState('pending')
  const [editId, setEditId] = useState(null)

  const filtered = tasks
    .filter(t => filterMember === 'all' || t.member_id === filterMember)
    .filter(t => filterDone === 'all' ? true : filterDone === 'pending' ? !t.completed : t.completed)

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.memberId) return
    setSaving(true)
    try {
      if (editId) {
        await updateTask({ id: editId, title: form.title, description: form.description, points: +form.points, due_date: form.dueDate || null, recurring: form.recurring || null })
        setEditId(null)
      } else {
        await createTask({ ...form, points: +form.points, dueDate: form.dueDate || null, recurring: form.recurring || null })
      }
      setForm({ ...DEFAULT_FORM, memberId: kids[0]?.id || '' })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (task) => {
    setForm({
      memberId: task.member_id, title: task.title,
      description: task.description || '',
      points: task.points, dueDate: task.due_date || '',
      recurring: task.recurring || ''
    })
    setEditId(task.id)
    setShowForm(true)
  }

  const getMember = (id) => members.find(m => m.id === id)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Member filter */}
          <select className="select" style={{ width: 'auto' }} value={filterMember} onChange={e => setFilterMember(e.target.value)}>
            <option value="all">כל הילדים</option>
            {kids.map(k => <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>)}
          </select>

          {/* Status filter */}
          {['pending','completed','all'].map(f => (
            <button key={f} className={`btn btn-sm ${filterDone === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterDone(f)}>
              {f === 'pending' ? 'פתוחות' : f === 'completed' ? 'הושלמו' : 'הכל'}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm({ ...DEFAULT_FORM, memberId: kids[0]?.id || '' }); setShowForm(true) }}>
          + משימה חדשה
        </button>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p>אין משימות להצגה</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {filtered.map(task => {
            const kid = getMember(task.member_id)
            return (
              <div key={task.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                border: `2px solid ${kid?.color || 'var(--border)'}22`,
                opacity: task.completed ? .65 : 1
              }}>
                {/* Kid avatar */}
                <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{kid?.avatar || '👤'}</div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, textDecoration: task.completed ? 'line-through' : 'none' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-3)', marginTop: '.15rem' }}>
                    {kid?.name} · +{task.points} ⭐
                    {task.due_date && ` · ${format(parseISO(task.due_date), 'd בMMM', { locale: he })}`}
                    {task.recurring && ` · 🔁 ${RECURRING_OPTS.find(r => r.value === task.recurring)?.label}`}
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  padding: '.25rem .7rem', borderRadius: 'var(--r-full)', fontSize: '.78rem', fontWeight: 700,
                  background: task.completed ? '#69F0AE22' : '#FFD74022',
                  color: task.completed ? 'var(--green)' : 'var(--orange)'
                }}>
                  {task.completed ? '✅ הושלם' : '⏳ ממתין'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button className="btn btn-ghost btn-sm btn-icon" title="עריכה" onClick={() => startEdit(task)}>✏️</button>
                  <button
                    className="btn btn-ghost btn-sm btn-icon" title="מחק"
                    onClick={() => { if (confirm('למחוק את המשימה?')) deleteTask(task.id) }}
                    style={{ color: 'var(--red)' }}
                  >🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.25rem' }}>{editId ? '✏️ עריכת משימה' : '+ משימה חדשה'}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">ילד/ה</label>
                <select className="select" value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))}>
                  {kids.map(k => <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">שם המשימה *</label>
                <input className="input" placeholder="לסדר את החדר" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
              </div>

              <div>
                <label className="label">תיאור (אופציונלי)</label>
                <textarea className="textarea" rows={2} placeholder="פרטים נוספים..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">נקודות</label>
                  <input className="input" type="number" min={1} max={100} value={form.points}
                    onChange={e => setForm(f => ({ ...f, points: e.target.value }))} />
                </div>
                <div>
                  <label className="label">תאריך יעד</label>
                  <input className="input" type="date" value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">חזרה</label>
                <select className="select" value={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.value }))}>
                  {RECURRING_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>ביטול</button>
                <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving || !form.title.trim()} onClick={handleSubmit}>
                  {saving ? 'שומר...' : editId ? 'שמור שינויים' : 'הוסף משימה'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
