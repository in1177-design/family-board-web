import React, { useState } from 'react'
import { api } from '../../store'
import Modal from '../shared/Modal'
import PixelButton from '../shared/PixelButton'
import { DAY_NAMES, DAY_SHORT } from './WeeklySchedule'

// עריכת מערכת השעות של בן משפחה (2026-10-12), בחלון מודאלי: מערכת הצלצולים, ושיעורים וחוגים לפי יום.
// עורכים עותק מקומי, ו"שמירה" מחליפה את הכל בבת אחת (PUT periods ו-replace), כך שאין מערכת חצי שמורה.
// מורה ומיקום נשמרים, אבל עוד לא מוצגים במערכת
const ERRORS = {
  bad_time: 'שעה לא תקינה, או שעת סיום לפני ההתחלה',
  bad_period: 'מספר שיעור לא תקין, או שחוזר פעמיים',
  missing_title: 'לכל שיעור וחוג צריך שם',
  lesson_needs_period_or_time: 'לשיעור צריך מספר שיעור או שעה',
  activity_needs_time: 'לחוג צריך שעת התחלה'
}

let tempId = 0
const newKey = () => 'new-' + (++tempId)

export default function ScheduleEditor({ member, data, onClose, onSaved }) {
  const [periods, setPeriods] = useState(() => data.periods.map(p => ({ key: p.id, period: p.period, start_time: p.start_time, end_time: p.end_time })))
  const [items, setItems] = useState(() => data.items.map(i => ({ key: i.id, ...i })))
  const [day, setDay] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const setPeriod = (key, field, value) => setPeriods(ps => ps.map(p => p.key === key ? { ...p, [field]: value } : p))
  const addPeriod = () => setPeriods(ps => {
    const last = ps.at(-1)
    return [...ps, { key: newKey(), period: last ? Number(last.period) + 1 : 1, start_time: last?.end_time || '08:00', end_time: '' }]
  })
  const setItem = (key, field, value) => setItems(is => is.map(i => i.key === key ? { ...i, [field]: value } : i))
  const addItem = (kind) => setItems(is => {
    const lessons = is.filter(i => i.weekday === day && i.kind === 'lesson')
    const next = lessons.length ? Math.max(...lessons.map(l => Number(l.period) || 0)) + 1 : 1
    return [...is, kind === 'lesson'
      ? { key: newKey(), kind, weekday: day, period: next, title: '' }
      : { key: newKey(), kind, weekday: day, start_time: '16:00', end_time: '17:00', title: '' }]
  })

  const dayItems = items.filter(i => i.weekday === day)
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'lesson' ? -1 : 1) || (Number(a.period) || 99) - (Number(b.period) || 99))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await api.schedule.setPeriods({
        memberId: member.id,
        periods: periods.filter(p => p.start_time || p.end_time).map(({ period, start_time, end_time }) => ({ period: Number(period), start_time, end_time }))
      })
      await api.schedule.replace({
        memberId: member.id,
        items: items.map(({ kind, weekday, period, start_time, end_time, title, teacher, location }) =>
          ({ kind, weekday, period: period === '' ? null : period, start_time: start_time || null, end_time: end_time || null, title, teacher, location }))
      })
      onSaved()
      onClose()
    } catch (e) {
      const code = e.data?.error || e.message
      setError(ERRORS[code] || 'לא הצלחתי לשמור. ' + (code || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={'מערכת השעות של ' + member.name} onClose={onClose}>
      <div className="pl-col pl-schedule-editor" style={{ gap: 20 }}>
        <section className="pl-col" style={{ gap: 8 }}>
          <strong>מערכת צלצולים</strong>
          <span className="pl-muted">מספר השיעור, שעת התחלה ושעת סיום. לפיהם מקבל כל שיעור את השעה שלו.</span>
          {periods.map(p => (
            <div key={p.key} className="pl-row pl-schedule-edit-row">
              <input type="number" min="0" max="15" value={p.period} onChange={e => setPeriod(p.key, 'period', e.target.value)}
                style={{ width: 52 }} aria-label="מספר שיעור" title="מספר שיעור" />
              <input type="time" value={p.start_time} onChange={e => setPeriod(p.key, 'start_time', e.target.value)} aria-label="התחלה" />
              <span>–</span>
              <input type="time" value={p.end_time} onChange={e => setPeriod(p.key, 'end_time', e.target.value)} aria-label="סיום" />
              <button className="pl-link pl-danger-link" onClick={() => setPeriods(ps => ps.filter(x => x.key !== p.key))} aria-label="מחיקת שיעור מהצלצולים">מחיקה</button>
            </div>
          ))}
          <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={addPeriod}>+ שיעור בצלצולים</button>
        </section>

        <section className="pl-col" style={{ gap: 8 }}>
          <strong>שיעורים וחוגים</strong>
          <div className="pl-row pl-schedule-days" role="tablist" aria-label="יום בשבוע">
            {DAY_SHORT.map((d, i) => (
              <button key={i} role="tab" aria-selected={day === i} title={DAY_NAMES[i]}
                className={'pl-slot' + (day === i ? ' pl-slot-on' : '')} onClick={() => setDay(i)}>{d}</button>
            ))}
          </div>
          {dayItems.length === 0 && <span className="pl-muted">אין כלום ביום {DAY_NAMES[day]}.</span>}
          {dayItems.map(i => (
            <div key={i.key} className={'pl-col pl-schedule-edit-item' + (i.kind === 'activity' ? ' pl-schedule-edit-activity' : '')}>
              <div className="pl-row pl-schedule-edit-row">
                <span className="pl-chip">{i.kind === 'lesson' ? 'שיעור' : 'חוג'}</span>
                {i.kind === 'lesson' && (
                  <input type="number" min="0" max="15" value={i.period ?? ''} placeholder="מס׳"
                    onChange={e => setItem(i.key, 'period', e.target.value)} style={{ width: 64 }} aria-label="מספר שיעור" />
                )}
                <input type="text" value={i.title} placeholder={i.kind === 'lesson' ? 'מתמטיקה' : 'שחייה'}
                  onChange={e => setItem(i.key, 'title', e.target.value)} style={{ flex: 1, minWidth: 140 }} aria-label="שם" />
                <button className="pl-link pl-danger-link" onClick={() => setItems(is => is.filter(x => x.key !== i.key))}>מחיקה</button>
              </div>
              <div className="pl-row pl-schedule-edit-row">
                <label className="pl-row">{i.kind === 'lesson' ? 'שעה חריגה' : 'שעה'}
                  <input type="time" value={i.start_time || ''} onChange={e => setItem(i.key, 'start_time', e.target.value)} aria-label="התחלה" />
                  <span>–</span>
                  <input type="time" value={i.end_time || ''} onChange={e => setItem(i.key, 'end_time', e.target.value)} aria-label="סיום" />
                </label>
                <input type="text" value={i.teacher || ''} placeholder="מורה" onChange={e => setItem(i.key, 'teacher', e.target.value)} style={{ width: 120 }} aria-label="מורה" />
                <input type="text" value={i.location || ''} placeholder="מיקום" onChange={e => setItem(i.key, 'location', e.target.value)} style={{ width: 120 }} aria-label="מיקום" />
              </div>
            </div>
          ))}
          <div className="pl-row">
            <button className="pl-link" onClick={() => addItem('lesson')}>+ שיעור</button>
            <button className="pl-link" onClick={() => addItem('activity')}>+ חוג</button>
          </div>
        </section>

        {error && <p className="pl-sub pl-sub-warn" role="alert">{error}</p>}
        <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
          <PixelButton variant="secondary" onClick={onClose}>ביטול</PixelButton>
          <PixelButton variant="main" onClick={save} disabled={saving}>{saving ? 'שומר...' : 'שמירה'}</PixelButton>
        </div>
      </div>
    </Modal>
  )
}
