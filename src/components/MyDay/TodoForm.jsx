import React, { useState } from 'react'
import { useStore, api } from '../../store'
import DatePicker from './DatePicker'
import { DAY_LETTERS } from '../Routines/labels'
import { addDays, dateText, repeatPresets } from './todoLabels'
import Modal from '../shared/Modal'
import PixelButton from '../shared/PixelButton'
import Icon from '../shared/Icon'
import IconPicker from '../shared/IconPicker'
import { todoIcon } from './icons'
import { memberPhoto } from '../shared/memberPhoto'

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

// הוספה או עריכה של משימה (רפרנס: Microsoft To Do), בחלון מודאלי (מגירה מלמטה בטלפון).
// מוצג תמיד (2026-10-08): מה, למי, מתי. מתחת כפתורים קטנים שפותחים את השאר: שעה, חזרתיות, מיקום.
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
  const [location, setLocation] = useState(todo?.location || '')
  const [icon, setIcon] = useState(todo?.icon || '')
  const [custom, setCustom] = useState(false)
  // אילו תוספות פתוחות. במשימה קיימת: מה שכבר יש בה
  const [open, setOpen] = useState({ time: !!todo?.due_time, repeat: !!todo?.repeat, location: !!todo?.location })
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

  // פתיחה של תוספת, והסרה שלה (סוגרת ומנקה את הערך)
  const show = (k) => setOpen(o => ({ ...o, [k]: true }))
  const hide = (k) => {
    setOpen(o => ({ ...o, [k]: false }))
    if (k === 'time') setTime('')
    if (k === 'repeat') { setRepeat(null); setCustom(false) }
    if (k === 'location') setLocation('')
  }

  const save = async () => {
    setSaving(true)
    setError('')
    const body = { title: title.trim(), member_id: assignee, due_date: date || null, due_time: time || null, repeat }
    // מיקום נשלח רק כשיש בו שימוש, כדי שבלי 007_todo_location.sql המשימות יישמרו כרגיל
    if (location.trim() || todo?.location) body.location = location.trim() || null
    // אייקון: גם רק כשבחרו (008_duration_and_icons.sql)
    if (icon || todo?.icon) body.icon = icon
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
  const EXTRAS = [
    { id: 'location', icon: 'map-pin',   label: 'הוסף מיקום' },
    { id: 'repeat',   icon: 'repeat',    label: 'קבע חזרתיות' },
    { id: 'time',     icon: 'clock',     label: 'הגדר שעה' }
  ].filter(x => !open[x.id])

  return (
    <Modal title={isNew ? 'משימה חדשה' : 'עריכת משימה'} onClose={onClose}>
      <div className="pl-section">
        <h3>מה צריך לעשות?</h3>
        {/* אייקון ליד השם: אוטומטי לפי השם, או אחד שבוחרים (2026-10-08) */}
        <div className="pl-name-row">
          <IconPicker value={icon} auto={todoIcon({ title })} onChange={setIcon} />
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="למשל: להחזיר ספר לספרייה" style={{ width: '100%' }} autoFocus />
        </div>
      </div>

      {/* למי: בחירה לפי התמונות של בני המשפחה (2026-10-08) */}
      <div className="pl-section">
        <h3>למי?</h3>
        <div className="pl-who" role="radiogroup" aria-label="למי">
          {members.map(m => (
            <button
              key={m.id}
              role="radio"
              aria-checked={assignee === m.id}
              className={'pl-who-item' + (assignee === m.id ? ' pl-who-on' : '')}
              onClick={() => setAssignee(m.id)}
            >
              {memberPhoto(m)
                ? <img className="pl-who-photo" src={memberPhoto(m)} alt="" />
                : <span className="pl-who-photo">{m.avatar || '👤'}</span>}
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* מתי: ארבעת הכפתורים בשורה אחת */}
      <div className="pl-section pl-col" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>מתי? <span className="pl-muted">{dateText(date, today)}</span></h3>
        <div className="pl-slots" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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

      {/* תוספות: כל כפתור פותח את הסקציה שלו */}
      {EXTRAS.length > 0 && (
        <div className="pl-row pl-extras">
          {EXTRAS.map(x => <button key={x.id} className="pl-extra" onClick={() => show(x.id)}><Icon name={x.icon} />{x.label}</button>)}
        </div>
      )}

      {open.time && (
        <div className="pl-section pl-col" style={{ gap: 12 }}>
          <ExtraHead title="שעה" onRemove={() => hide('time')} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ alignSelf: 'flex-start' }} />
        </div>
      )}

      {open.repeat && (
        <div className="pl-section pl-col" style={{ gap: 12 }}>
          <ExtraHead title="חזרתיות" onRemove={() => hide('repeat')} />
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
      )}

      {open.location && (
        <div className="pl-section pl-col" style={{ gap: 12 }}>
          <ExtraHead title="מיקום" onRemove={() => hide('location')} />
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="למשל: הבריכה העירונית" style={{ width: '100%' }} />
        </div>
      )}

      {/* שמור (Main.pixel, רחב) ובטל (Secondary.pixel, קטן), זה לצד זה, בלי מסגרת מסביב (2026-10-08) */}
      <div className="pl-col pl-form-actions">
        <div className="pl-form-buttons">
          <PixelButton variant="main" onClick={save} disabled={saving || !title.trim() || !assignee || (repeat?.unit === 'week' && !repeat.weekdays?.length)}>שמור</PixelButton>
          <PixelButton variant="secondary" className="pl-form-cancel" onClick={onClose}>בטל</PixelButton>
        </div>
        {!isNew && <button className="pl-link pl-danger-link" onClick={remove}>מחק משימה</button>}
      </div>
      {error && <p className="pl-error">{error}</p>}
    </Modal>
  )
}

// כותרת של תוספת, עם "הסר" שסוגר אותה ומנקה את הערך
function ExtraHead({ title, onRemove }) {
  return (
    <div className="pl-row" style={{ justifyContent: 'space-between' }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <button className="pl-link pl-muted" onClick={onRemove}>הסר</button>
    </div>
  )
}
