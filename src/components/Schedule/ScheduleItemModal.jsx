import React, { useState } from 'react'
import { api } from '../../store'
import Modal from '../shared/Modal'
import PixelButton from '../shared/PixelButton'
import { DAY_NAMES } from './WeeklySchedule'
import { COLOR_CHOICES } from './subjects'

// עריכה של שיעור או חוג אחד מהטבלה (2026-10-12): במצב עריכה לוחצים על תא, ונפתח החלון הזה.
// חוג: שם, שעה, מורה/מדריך וצבע. שיעור: שם, מורה, צבע, ושעה חריגה (בלי: השעה מהצלצולים).
// "שינוי לכל השיעורים בשם הזה": השם, המורה והצבע עוברים לכל הפריטים מאותו סוג עם אותו שם (למשל כל המתמטיקה).
// השעה והיום משתנים רק בפריט שנלחץ.
// item: פריט קיים, או טיוטה ({ kind, weekday, period }) מלחיצה על תא ריק או על "+ חוג". items: כל הפריטים של בן המשפחה
// הצבעים: קבוצות המקצועות (subjects.js). "לפי השם": בלי צבע שמור, והצבע לפי שם השיעור
export const SCHEDULE_COLORS = COLOR_CHOICES

const ERRORS = {
  missing_title: 'צריך לתת שם',
  bad_time: 'שעה לא תקינה, או שעת סיום לפני ההתחלה',
  activity_needs_time: 'לחוג צריך שעת התחלה',
  lesson_needs_period_or_time: 'לשיעור צריך מספר שיעור או שעה',
  bad_color: 'הצבע לא תקין'
}

export default function ScheduleItemModal({ member, item, items = [], onClose, onSaved }) {
  const isNew = !item.id
  const lesson = item.kind === 'lesson'
  const [title, setTitle] = useState(item.title || '')
  const [teacher, setTeacher] = useState(item.teacher || '')
  const [color, setColor] = useState(item.color || null)
  // פריטים אחרים מאותו סוג ובאותו שם (לפי השם לפני השינוי)
  const sameName = isNew ? [] : items.filter(i => i.id !== item.id && i.kind === item.kind && i.title.trim() === item.title.trim())
  const [toAll, setToAll] = useState(false)
  const [start, setStart] = useState(item.start_time || (lesson ? '' : '16:00'))
  const [end, setEnd] = useState(item.end_time || (lesson ? '' : '17:00'))
  const [weekday, setWeekday] = useState(item.weekday)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const what = lesson ? 'שיעור' : 'חוג'
  const heading = isNew
    ? `${what} חדש · ${DAY_NAMES[weekday]}${lesson ? `, שיעור ${item.period}` : ''}`
    : `${item.title} · ${DAY_NAMES[item.weekday]}`

  const run = async (action) => {
    setSaving(true)
    setError('')
    try {
      await action()
      onSaved()
      onClose()
    } catch (e) {
      setError(ERRORS[e.message] || 'לא הצלחתי לשמור. ' + (e.message || ''))
      setSaving(false)
    }
  }

  const save = () => run(async () => {
    const body = {
      kind: item.kind, weekday, period: lesson ? item.period : null,
      start_time: start || null, end_time: end || null, title,
      teacher: teacher || null, location: item.location || null, color
    }
    if (isNew) return api.schedule.create({ member_id: member.id, ...body })
    await api.schedule.update({ id: item.id, ...body })
    // לכל השאר באותו שם: רק שם, מורה וצבע. כל השאר נשאר שלהם
    if (toAll) {
      for (const other of sameName) {
        await api.schedule.update({
          id: other.id, kind: other.kind, weekday: other.weekday, period: other.period,
          start_time: other.start_time, end_time: other.end_time, location: other.location,
          title, teacher: teacher || null, color
        })
      }
    }
  })
  const remove = () => {
    if (!confirm(`למחוק את "${item.title}"?`)) return
    run(() => api.schedule.delete(item.id))
  }

  return (
    <Modal title={heading} onClose={onClose}>
      <div className="pl-col pl-schedule-item-modal" style={{ gap: 16 }}>
        <label className="pl-col" style={{ gap: 6 }}>
          <strong>שם {lesson ? 'השיעור' : 'החוג'}</strong>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={lesson ? 'מתמטיקה' : 'שחייה'} autoFocus />
        </label>

        <label className="pl-col" style={{ gap: 6 }}>
          <strong>{lesson ? 'שם המורה' : 'שם המדריך'}</strong>
          <input type="text" value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="לא חובה" />
        </label>

        {!lesson && (
          <label className="pl-col" style={{ gap: 6 }}>
            <strong>יום</strong>
            <select value={weekday} onChange={e => setWeekday(Number(e.target.value))}>
              {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </label>
        )}

        <div className="pl-col" style={{ gap: 6 }}>
          <strong>{lesson ? 'שעה חריגה' : 'שעה'}</strong>
          {lesson && <span className="pl-muted">ריק: השעה של שיעור {item.period} לפי הצלצולים.</span>}
          <div className="pl-row" style={{ gap: 8 }}>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} aria-label="התחלה" />
            <span>–</span>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)} aria-label="סיום" />
            {lesson && (start || end) && <button className="pl-link pl-muted" onClick={() => { setStart(''); setEnd('') }}>לפי הצלצולים</button>}
          </div>
        </div>

        <div className="pl-col" style={{ gap: 6 }}>
          <strong>צבע</strong>
          <div className="pl-row pl-schedule-colors" role="radiogroup" aria-label="צבע">
            {SCHEDULE_COLORS.map(c => (
              <button key={c.label} role="radio" aria-checked={color === c.value} title={c.label} aria-label={c.label}
                className={'pl-schedule-swatch' + (color === c.value ? ' pl-schedule-swatch-on' : '') + (c.value ? '' : ' pl-schedule-swatch-none')}
                style={c.value ? { background: c.value } : undefined} onClick={() => setColor(c.value)} />
            ))}
          </div>
        </div>

        {sameName.length > 0 && (
          <label className="pl-row pl-schedule-to-all">
            <input type="checkbox" checked={toAll} onChange={e => setToAll(e.target.checked)} />
            <span>
              שינוי לכל {lesson ? 'השיעורים' : 'החוגים'} בשם "{item.title}" ({sameName.length + 1})
              <span className="pl-muted" style={{ display: 'block' }}>השם, המורה והצבע. {lesson ? 'השעה משתנה' : 'השעה והיום משתנים'} רק כאן.</span>
            </span>
          </label>
        )}

        {error && <p className="pl-sub pl-sub-warn" role="alert">{error}</p>}
        <div className="pl-row" style={{ justifyContent: 'space-between' }}>
          {!isNew ? <button className="pl-link pl-danger-link" onClick={remove} disabled={saving}>מחיקה</button> : <span />}
          <div className="pl-row">
            <PixelButton variant="secondary" onClick={onClose}>ביטול</PixelButton>
            <PixelButton variant="main" onClick={save} disabled={saving}>{saving ? 'שומר...' : 'שמירה'}</PixelButton>
          </div>
        </div>
      </div>
    </Modal>
  )
}
