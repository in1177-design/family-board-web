import React, { useEffect, useState } from 'react'
import { useStore, api } from '../../store'
import { TIMES, DAYS_RULES, DAY_LETTERS, ERRORS, memberWindows, ruleWeekdays } from './labels'
import Modal from '../shared/Modal'
import PixelButton from '../shared/PixelButton'
import { memberPhoto } from '../shared/memberPhoto'
import Icon from '../shared/Icon'
import IconPicker from '../shared/IconPicker'
import { stepIcon } from '../MyDay/icons'

const DEFAULT_POINTS = 2
const MAX_POINTS = 99
// משכי זמן מוכנים, בדקות
const DURATIONS = [10, 15, 20, 30, 45, 60]

// הוספה או עריכה של הרגל, בחלון מודאלי (מגירה מלמטה בטלפון), כמו טופס המשימה (2026-10-08):
// מה (עם אייקון) ← למי ← באיזה חלון ← באילו ימים, ומתחת תוספות: שעה, משך זמן, נקודות
// step: עריכה. memberId/timeOfDay: הוספה מתא מסוים. selfId: ילד שמוסיף לעצמו מתוך "היום שלי"
export default function StepForm({ step, memberId, timeOfDay, selfId, onClose }) {
  const { members } = useStore()
  const isNew = !step
  const fixedMember = selfId || memberId

  const [memberIds, setMemberIds] = useState(fixedMember ? [fixedMember] : [])
  const [time, setTime]   = useState(timeOfDay || 'morning')
  const [label, setLabel] = useState(step?.label || '')
  const [libraryId, setLibraryId] = useState(step?.library_step_id || null)
  const [rule, setRule]   = useState(step && step.days_rule !== 'inherit' ? step.days_rule : 'every_day')
  const [custom, setCustom] = useState(step?.days_custom || [])
  const [exactTime, setExactTime] = useState(step?.exact_time || '')
  const [points, setPoints] = useState(Number.isInteger(step?.points) ? step.points : DEFAULT_POINTS)
  // אילו תוספות פתוחות. בעריכה: שעה שכבר יש, ונקודות שאינן ברירת המחדל
  const [open, setOpen] = useState({ time: !!step?.exact_time, duration: !!step?.duration_minutes, points: Number.isInteger(step?.points) && step.points !== DEFAULT_POINTS })
  // משך זמן בדקות (טקסט בשדה), ואייקון שנבחר ('' = לפי השם)
  const [duration, setDuration] = useState(step?.duration_minutes ? String(step.duration_minutes) : '')
  const [icon, setIcon] = useState(step?.icon || '')
  // החלטה 2026-10-07: רק הורה משנה נקודות. ילד שמוסיף לעצמו מקבל את ברירת המחדל
  const self = selfId && members.find(m => m.id === selfId)
  const canSetPoints = !self || self.role === 'parent'
  const [library, setLibrary] = useState([])
  // הרשימה של הספרייה פתוחה
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.routines.library().then(setLibrary).catch(() => {}) }, [])

  const days = ruleWeekdays(rule, custom)

  // שינוי תיבה הופך את הכלל ל"ימים מסוימים"
  const toggleDay = (d) => {
    setCustom(days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort())
    setRule('custom')
  }

  const pickLibrary = (id) => {
    const item = library.find(l => l.id === id)
    if (!item) return
    setLabel(item.label)
    setLibraryId(item.id)
  }

  const body = {
    label: label.trim(),
    library_step_id: libraryId,
    days_rule: rule,
    days_custom: rule === 'custom' ? custom : [],
    exact_time: exactTime || null,
    ...(canSetPoints && { points }),
    icon,
    // משך זמן: רק כשקבעו, או שהיה (008_duration_and_icons.sql)
    ...((duration || step?.duration_minutes) ? { duration_minutes: duration ? Number(duration) : null } : {})
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        await api.routines.addStep({
          member_ids: memberIds, time_of_day: time, ...body,
          ...(selfId ? { created_by: selfId } : {})
        })
      } else {
        await api.routines.updateStep({ id: step.id, ...body })
      }
      onClose()
    } catch (e) {
      setError(ERRORS[e.message] || e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm(`למחוק את "${step.label}"?`)) return
    await api.routines.deleteStep(step.id)
    onClose()
  }

  const libOrder = [...library.filter(l => l.default_time_of_day === time), ...library.filter(l => l.default_time_of_day !== time)]
  const windowFor = (t) => memberIds.length === 1 ? memberWindows(members.find(m => m.id === memberIds[0]))[t] : null

  // תוספות (כמו בטופס משימה, 2026-10-08): שעה ונקודות נפתחות בכפתור. בעריכה: מה שכבר יש פתוח
  const EXTRAS = [
    { id: 'time', icon: 'clock', label: 'הגדר שעה' },
    { id: 'duration', icon: 'hourglass', label: 'משך זמן' },
    ...(canSetPoints ? [{ id: 'points', icon: 'star', label: 'קבע נקודות' }] : [])
  ].filter(x => !open[x.id])
  const hide = (k) => {
    setOpen(o => ({ ...o, [k]: false }))
    if (k === 'time') setExactTime('')
    if (k === 'points') setPoints(DEFAULT_POINTS)
    if (k === 'duration') setDuration('')
  }
  const slot = (on) => 'pl-slot' + (on ? ' pl-slot-on' : '')

  return (
    <Modal title={isNew ? 'הרגל חדש' : 'עריכת הרגל'} onClose={onClose}>
      {/* מה */}
      <div className="pl-section">
        <h3>מה ההרגל?</h3>
        {/* שורה אחת: אייקון, ושדה טקסט עם כפתור קטן בתוכו שפותח את ההרגלים מהספרייה (2026-10-08) */}
        <div className="pl-name-row">
          <IconPicker value={icon} auto={stepIcon({ label, library_step_id: libraryId })} onChange={setIcon} />
          <div className="pl-input-pick">
            <input
              type="text"
              value={label}
              placeholder={isNew ? 'לכתוב הרגל, או לבחור מהספרייה' : ''}
              onChange={e => { setLabel(e.target.value); setLibraryId(null) }}
              autoFocus
            />
            {isNew && libOrder.length > 0 && (
              <button className="pl-input-pick-btn" onClick={() => setPicking(v => !v)} aria-expanded={picking}>
                📚 מהספרייה
              </button>
            )}
          </div>
        </div>
        {picking && (
          <div className="pl-pick-list" role="listbox" aria-label="הרגלים מהספרייה">
            {libOrder.map(l => (
              <button key={l.id} role="option" aria-selected={libraryId === l.id}
                className={libraryId === l.id ? 'pl-pick-on' : ''}
                onClick={() => { pickLibrary(l.id); setPicking(false) }}>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* למי: תמונות, אפשר כמה. רק כשמוסיפים בלי בן משפחה קבוע */}
      {isNew && !fixedMember && (
        <div className="pl-section">
          <h3>למי?</h3>
          <div className="pl-who" role="group" aria-label="למי">
            {members.map(m => {
              const on = memberIds.includes(m.id)
              return (
                <button
                  key={m.id}
                  aria-pressed={on}
                  className={'pl-who-item' + (on ? ' pl-who-on' : '')}
                  onClick={() => setMemberIds(ids => on ? ids.filter(x => x !== m.id) : [...ids, m.id])}
                >
                  {memberPhoto(m)
                    ? <img className="pl-who-photo" src={memberPhoto(m)} alt="" />
                    : <span className="pl-who-photo">{m.avatar || '👤'}</span>}
                  <span>{m.name}</span>
                </button>
              )
            })}
          </div>
          {memberIds.length > 1 && <p className="pl-muted">ההרגל יתווסף לכל אחד בנפרד, ואפשר לערוך כל אחד בנפרד.</p>}
        </div>
      )}

      {/* באיזה חלון: שלושה כפתורים בשורה. רק כשמוסיפים בלי חלון מסוים */}
      {isNew && !timeOfDay && (
        <div className="pl-section">
          <h3>באיזה חלון?</h3>
          <div className="pl-slots" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {TIMES.map(t => (
              <button key={t.id} className={slot(time === t.id)} onClick={() => setTime(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {windowFor(time) && <p className="pl-muted">{windowFor(time).start}–{windowFor(time).end}</p>}
        </div>
      )}

      {/* באילו ימים: ארבעת הכללים בשורה, והימים מתחת */}
      <div className="pl-section pl-col" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>באילו ימים?</h3>
        <div className="pl-slots" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {DAYS_RULES.map(r => (
            <button key={r.id} className={slot(rule === r.id)} onClick={() => setRule(r.id)}>{r.label}</button>
          ))}
        </div>
        <div className="pl-row">
          {DAY_LETTERS.map((l, d) => (
            <label key={d} className="pl-row" style={{ gap: 2 }}>
              <input type="checkbox" disabled={rule === 'before_school_day'} checked={days.includes(d)} onChange={() => toggleDay(d)} />
              {l}
            </label>
          ))}
        </div>
        {rule === 'before_school_day' && <p className="pl-muted">מופיעה בכל יום שלמחרתו יש לימודים, לפי לוח החופשות.</p>}
        {(rule === 'school_days' || rule === 'weekend') && <p className="pl-muted">בחופשות: ימי לימודים לא חלים, וסופ״ש כן.</p>}
      </div>

      {/* תוספות: כל כפתור פותח את הסקציה שלו */}
      {EXTRAS.length > 0 && (
        <div className="pl-row pl-extras">
          {EXTRAS.map(x => <button key={x.id} className="pl-extra" onClick={() => setOpen(o => ({ ...o, [x.id]: true }))}><Icon name={x.icon} />{x.label}</button>)}
        </div>
      )}

      {open.time && (
        <div className="pl-section pl-col" style={{ gap: 8 }}>
          <ExtraHead title="שעה" onRemove={() => hide('time')} />
          <input type="time" value={exactTime} onChange={e => setExactTime(e.target.value)} style={{ alignSelf: 'flex-start' }} />
          <p className="pl-muted">למשל תרופה ב-08:00. בלי שעה, ההרגל פשוט בחלון.</p>
        </div>
      )}

      {/* משך זמן, בדקות: למשל לקרוא ספר 30 דק׳ */}
      {open.duration && (
        <div className="pl-section pl-col" style={{ gap: 8 }}>
          <ExtraHead title="משך זמן" onRemove={() => hide('duration')} />
          <div className="pl-row" style={{ gap: 6 }}>
            {DURATIONS.map(d => (
              <button key={d} className={slot(Number(duration) === d)} style={{ minWidth: 56 }} onClick={() => setDuration(String(d))}>{d}</button>
            ))}
            <label className="pl-row" style={{ gap: 4 }}>
              <input type="number" min="1" max="600" value={duration} onChange={e => setDuration(e.target.value)} style={{ width: 80 }} />
              דק׳
            </label>
          </div>
        </div>
      )}

      {/* נקודות: רק הורה */}
      {canSetPoints && open.points && (
        <div className="pl-section pl-col" style={{ gap: 8 }}>
          <ExtraHead title="נקודות" onRemove={() => hide('points')} />
          <div className="pl-row">
            <button onClick={() => setPoints(p => Math.max(0, p - 1))} disabled={points <= 0} aria-label="פחות נקודות">−</button>
            <strong style={{ minWidth: 32, textAlign: 'center' }}>{points}</strong>
            <button onClick={() => setPoints(p => Math.min(MAX_POINTS, p + 1))} disabled={points >= MAX_POINTS} aria-label="עוד נקודות">+</button>
          </div>
          <p className="pl-muted">נכנסות לניקוד מיד כשמסמנים את ההרגל. בלי לפתוח: {DEFAULT_POINTS}.</p>
        </div>
      )}

      {/* שמור (Main.pixel, רחב) ובטל (Secondary.pixel, קטן), כמו בטופס משימה */}
      <div className="pl-col pl-form-actions">
        <div className="pl-form-buttons">
          <PixelButton variant="main" onClick={save} disabled={saving || !label.trim() || (isNew && !memberIds.length)}>שמור</PixelButton>
          <PixelButton variant="secondary" className="pl-form-cancel" onClick={onClose}>בטל</PixelButton>
        </div>
        {!isNew && <button className="pl-link pl-danger-link" onClick={remove}>מחק הרגל</button>}
      </div>
      {error && <p className="pl-error">{error}</p>}
    </Modal>
  )
}

// כותרת של תוספת, עם "הסר" שסוגר אותה ומחזיר לברירת המחדל
function ExtraHead({ title, onRemove }) {
  return (
    <div className="pl-row" style={{ justifyContent: 'space-between' }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <button className="pl-link pl-muted" onClick={onRemove}>הסר</button>
    </div>
  )
}
