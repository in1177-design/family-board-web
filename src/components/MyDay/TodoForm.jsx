import React, { useState } from 'react'
import { useStore, api } from '../../store'
import DatePicker from './DatePicker'
import { DAY_LETTERS } from '../Routines/labels'
import { addDays, dateText, repeatPresets } from './todoLabels'

const ERRORS = {
  no_title: 'צריך לתת למשימה שם',
  repeat_needs_date: 'משימה חוזרת צריכה תאריך',
  invalid_repeat: 'החזרה לא תקינה'
}

const UNITS = [
  { id: 'day', label: 'ימים' },
  { id: 'week', label: 'שבועות' },
  { id: 'month', label: 'חודשים' },
  { id: 'year', label: 'שנים' }
]

// הוספה או עריכה של משימה (רפרנס: Microsoft To Do).
// שם ← למי ← מתי (היום, מחר, יום מסוים בלוח שנה, בלי תאריך) ← שעה (לא חובה) ← חזרה
// memberId: למי כברירת מחדל. byId: מי מוסיף (נרשם ב-created_by)
export default function TodoForm({ todo, memberId, byId, today, onClose }) {
  const { members } = useStore()
  const isNew = !todo
  const [assignee, setAssignee] = useState(todo?.member_id || memberId || '')
  const [calendar, setCalendar] = useState(false)
  const [title, setTitle] = useState(todo?.title || '')
  const [date, setDate] = useState(isNew ? today : todo.due_date)
  const [time, setTime] = useState(todo?.due_time || '')
  const [repeat, setRepeat] = useState(todo?.repeat || null)
  const [custom, setCustom] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const tomorrow = addDays(today, 1)
  const presets = repeatPresets(date || today)
  const presetId = repeat && presets.find(p => JSON.stringify(p.repeat) === JSON.stringify(repeat))?.id

  const pickDate = (d) => {
    setDate(d)
    setCalendar(false)
    // משימה חוזרת בלי תאריך לא אפשרית
    if (!d) setRepeat(null)
  }

  const pickRepeat = (id) => {
    if (id === 'none') { setRepeat(null); setCustom(false); return }
    if (id === 'custom') {
      if (!date) setDate(today)
      setCustom(true)
      setRepeat(repeat || { unit: 'week', every: 1, weekdays: [new Date((date || today) + 'T00:00:00Z').getUTCDay()] })
      return
    }
    if (!date) setDate(today)
    setCustom(false)
    setRepeat(presets.find(p => p.id === id).repeat)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    const body = { title: title.trim(), member_id: assignee, due_date: date || null, due_time: time || null, repeat }
    try {
      if (isNew) await api.todos.create({ created_by: byId || null, ...body })
      else       await api.todos.update({ id: todo.id, ...body })
      onClose()
    } catch (e) {
      setError(ERRORS[e.message] || e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm(`למחוק את "${todo.title}"?`)) return
    await api.todos.delete(todo.id)
    onClose()
  }

  const chip = (on) => 'pl-slot' + (on ? ' pl-slot-on' : '')
  const showCustom = custom || (repeat && !presetId)

  return (
    <div className="pl" style={{ maxWidth: 520 }}>
      <div className="pl-row" style={{ justifyContent: 'space-between' }}>
        <h2>{isNew ? 'משימה חדשה' : todo.title}</h2>
        <button className="pl-link" onClick={onClose}>חזרה</button>
      </div>

      <div className="pl-section">
        <h3>מה צריך לעשות?</h3>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="למשל: להחזיר ספר לספרייה" style={{ width: '100%' }} autoFocus />
      </div>

      <div className="pl-section">
        <h3>למי?</h3>
        <select value={assignee} onChange={e => setAssignee(e.target.value)}>
          {!assignee && <option value="">בחירה…</option>}
          {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role === 'parent' ? 'הורה' : 'ילד/ה'})</option>)}
        </select>
      </div>

      <div className="pl-section pl-col" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>מתי? <span className="pl-muted">{dateText(date, today)}</span></h3>
        <div className="pl-slots" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <button className={chip(date === today)} onClick={() => pickDate(today)}>היום</button>
          <button className={chip(date === tomorrow)} onClick={() => pickDate(tomorrow)}>מחר</button>
          <button className={chip(calendar || (date && date !== today && date !== tomorrow))} onClick={() => setCalendar(v => !v)}>
            {date && date !== today && date !== tomorrow ? dateText(date, today) : 'יום מסוים…'}
          </button>
          <button className={chip(!date)} onClick={() => pickDate(null)}>בלי תאריך</button>
        </div>
        {calendar && <DatePicker value={date} today={today} onPick={pickDate} />}
        {!date && <p className="pl-muted">המשימה תחכה ב"היום שלי" עד שתסומן.</p>}
      </div>

      <div className="pl-section pl-col" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>שעה <span className="pl-muted">(לא חובה)</span></h3>
        <div className="pl-row">
          <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          {time && <button className="pl-link" onClick={() => setTime('')}>בלי שעה</button>}
        </div>
      </div>

      <div className="pl-section pl-col" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>חזרה</h3>
        <select value={showCustom ? 'custom' : (presetId || 'none')} onChange={e => pickRepeat(e.target.value)}>
          <option value="none">לא חוזרת</option>
          {presets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          <option value="custom">מותאם אישית…</option>
        </select>

        {showCustom && repeat && (
          <div className="pl-box pl-col">
            <label className="pl-row">
              כל
              <input type="number" min="1" max="365" value={repeat.every} style={{ width: 70 }}
                onChange={e => setRepeat({ ...repeat, every: Math.max(1, Number(e.target.value) || 1) })} />
              <select value={repeat.unit} onChange={e => setRepeat({ unit: e.target.value, every: repeat.every })}>
                {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            </label>
            {repeat.unit === 'week' && (
              <div className="pl-row">
                {DAY_LETTERS.map((l, d) => {
                  const days = repeat.weekdays || []
                  return (
                    <label key={d} className="pl-row" style={{ gap: 2 }}>
                      <input type="checkbox" checked={days.includes(d)}
                        onChange={() => setRepeat({ ...repeat, weekdays: days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort() })} />
                      {l}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {repeat && <p className="pl-muted">כשמסמנים שבוצעה, נוצרת המשימה הבאה בתור.</p>}
      </div>

      <div className="pl-section pl-row">
        <button className="pl-primary" onClick={save} disabled={saving || !title.trim() || !assignee || (repeat?.unit === 'week' && !repeat.weekdays?.length)}>שמור</button>
        <button onClick={onClose}>ביטול</button>
        {!isNew && <button onClick={remove} style={{ marginInlineStart: 'auto' }}>מחק</button>}
      </div>
      {error && <p className="pl-error">{error}</p>}
    </div>
  )
}
