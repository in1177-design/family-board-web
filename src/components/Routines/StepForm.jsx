import React, { useEffect, useState } from 'react'
import { useStore, api } from '../../store'
import { TIMES, DAYS_RULES, DAY_LETTERS, ERRORS, memberWindows, ruleWeekdays } from './labels'

const DEFAULT_POINTS = 2
const MAX_POINTS = 99

// הוספה או עריכה של הרגל: מה (מהספרייה או חדש) ← באילו ימים ← שעה
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
  // החלטה 2026-10-07: רק הורה משנה נקודות. ילד שמוסיף לעצמו מקבל את ברירת המחדל
  const self = selfId && members.find(m => m.id === selfId)
  const canSetPoints = !self || self.role === 'parent'
  const [library, setLibrary] = useState([])
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
    ...(canSetPoints && { points })
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

  return (
    <div className="pl" style={{ maxWidth: 640 }}>
      <div className="pl-row" style={{ justifyContent: 'space-between' }}>
        <h2>{isNew ? 'הרגל חדש' : step.label}</h2>
        <button className="pl-link" onClick={onClose}>חזרה</button>
      </div>

      {/* למי ומתי: רק כשמוסיפים בלי תא מסוים */}
      {isNew && !fixedMember && (
        <div className="pl-section">
          <h3>למי</h3>
          <div className="pl-row">
            {members.map(m => (
              <label key={m.id} className="pl-row" style={{ gap: 4 }}>
                <input type="checkbox" checked={memberIds.includes(m.id)}
                  onChange={() => setMemberIds(ids => ids.includes(m.id) ? ids.filter(x => x !== m.id) : [...ids, m.id])} />
                {m.name}
              </label>
            ))}
          </div>
          {memberIds.length > 1 && <p className="pl-muted">ההרגל יתווסף לכל אחד בנפרד, ואפשר לערוך כל אחד בנפרד.</p>}
        </div>
      )}
      {isNew && !timeOfDay && (
        <div className="pl-section">
          <h3>באיזה חלון</h3>
          <div className="pl-row">
            {TIMES.map(t => (
              <label key={t.id} className="pl-row" style={{ gap: 4 }}>
                <input type="radio" name="time" checked={time === t.id} onChange={() => setTime(t.id)} />
                {t.label}
                {windowFor(t.id) && <span className="pl-muted">{windowFor(t.id).start}–{windowFor(t.id).end}</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 1. המשימה */}
      <div className="pl-section">
        <h3>1. ההרגל</h3>
        <div className="pl-col">
          {isNew && (
            <select value="" onChange={e => pickLibrary(e.target.value)}>
              <option value="">בחירה מהספרייה…</option>
              {libOrder.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          )}
          <input
            type="text"
            value={label}
            placeholder={isNew ? 'או לכתוב הרגל חדש' : ''}
            onChange={e => { setLabel(e.target.value); setLibraryId(null) }}
          />
        </div>
      </div>

      {/* 2. ימים */}
      <div className="pl-section">
        <h3>2. באילו ימים</h3>
        <div className="pl-row">
          {DAYS_RULES.map(r => (
            <label key={r.id} className="pl-row" style={{ gap: 4 }}>
              <input type="radio" name="rule" checked={rule === r.id} onChange={() => setRule(r.id)} />
              {r.label}
            </label>
          ))}
        </div>
        <div className="pl-row" style={{ marginTop: 8 }}>
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

      {/* 3. שעה */}
      <div className="pl-section">
        <h3>3. שעה (לא חובה)</h3>
        <div className="pl-row">
          <input type="time" value={exactTime} onChange={e => setExactTime(e.target.value)} />
          {exactTime && <button className="pl-link" onClick={() => setExactTime('')}>בלי שעה</button>}
        </div>
        <p className="pl-muted">למשל תרופה ב-08:00. בלי שעה, ההרגל פשוט בחלון.</p>
      </div>

      {/* 4. נקודות: רק הורה */}
      {canSetPoints && (
        <div className="pl-section">
          <h3>4. נקודות</h3>
          <div className="pl-row">
            <button onClick={() => setPoints(p => Math.max(0, p - 1))} disabled={points <= 0} aria-label="פחות נקודות">−</button>
            <strong style={{ minWidth: 32, textAlign: 'center' }}>{points}</strong>
            <button onClick={() => setPoints(p => Math.min(MAX_POINTS, p + 1))} disabled={points >= MAX_POINTS} aria-label="עוד נקודות">+</button>
          </div>
          <p className="pl-muted">נכנסות לניקוד מיד כשמסמנים את ההרגל.</p>
        </div>
      )}

      <div className="pl-section pl-row">
        <button className="pl-primary" onClick={save} disabled={saving || !label.trim() || (isNew && !memberIds.length)}>שמור</button>
        <button onClick={onClose}>ביטול</button>
        {!isNew && <button onClick={remove} style={{ marginInlineStart: 'auto' }}>מחק</button>}
      </div>
      {error && <p className="pl-error">{error}</p>}
    </div>
  )
}
