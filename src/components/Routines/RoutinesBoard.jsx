import React, { useEffect, useState } from 'react'
import { useStore, api } from '../../store'
import StepForm from './StepForm'
import MemberTabs from '../shared/MemberTabs'
import { TIMES, ERRORS, memberWindows, rulesText } from './labels'

// לוח ההרגלים (רפרנס: screens/Main.dc_1.html): עמודה לכל חלון, ובכל עמודה ההרגלים, כל אחד עם הימים והשעה שלו.
// בן משפחה אחד בכל פעם, עם בחירה למעלה (המשתמשת, 2026-10-09: "הכל באותו דף, פצל לכל דמות בנפרד")
export default function RoutinesBoard() {
  const { members } = useStore()
  const [routines, setRoutines] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { step } לעריכה, או { memberId, timeOfDay } להוספה
  const [memberId, setMemberId] = useState(() => members[0]?.id)
  const member = members.find(m => m.id === memberId) || members[0]

  const load = () => api.routines.getAll().then(setRoutines).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  // כל ההרגלים של בן משפחה בחלון, גם אם נשמרו בכמה מיכלים
  const stepsOf = (memberId, timeOfDay) => (routines || [])
    .filter(r => r.member_id === memberId && r.timing_type === 'window' && r.time_of_day === timeOfDay)
    .flatMap(r => r.steps.filter(s => s.status === 'active'))

  const move = async (step, dir) => {
    await api.routines.moveStep({ id: step.id, dir }).catch(e => setError(e.message))
    load()
  }

  // מחיקה מהירה מהלוח (2026-10-09), עם אישור אחד
  const remove = async (step) => {
    if (!confirm(`למחוק את ההרגל "${step.label}"?`)) return
    await api.routines.deleteStep(step.id).catch(e => setError(e.message))
    load()
  }

  return (
    <div className="pl">
      <div className="pl-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2>הרגלים</h2>
          <p>מה כל אחד עושה כל יום בבוקר, בצהריים ובערב</p>
        </div>
        <button className="pl-primary" onClick={() => setEditing(member ? { memberId: member.id } : {})}>הרגל חדש</button>
      </div>

      <MemberTabs members={members} value={member?.id} onChange={setMemberId}
        count={m => TIMES.reduce((n, t) => n + stepsOf(m.id, t.id).length, 0)} />

      {error && <p className="pl-error">{error}</p>}
      {!routines && !error && <p>טוען…</p>}

      {routines && member && (
        <MemberBoard key={member.id} member={member} stepsOf={stepsOf} onEdit={setEditing} onMove={move} onDelete={remove} />
      )}

      {/* הוספה ועריכה של הרגל: חלון מודאלי מעל הלוח (2026-10-08) */}
      {editing && <StepForm {...editing} onClose={() => { setEditing(null); load() }} />}
    </div>
  )
}

// ההרגלים של בן משפחה אחד: שלוש עמודות, חלון בכל אחת. השעות של החלונות נשנות מכאן
function MemberBoard({ member, stepsOf, onEdit, onMove, onDelete }) {
  const [editWindows, setEditWindows] = useState(false)

  return (
    <div className="pl-col" style={{ gap: 12, marginTop: 16 }}>
      <div className="pl-row">
        <button className="pl-link pl-muted" onClick={() => setEditWindows(v => !v)}>
          {editWindows ? 'סגור שעות' : 'שעות החלונות של ' + member.name}
        </button>
      </div>
      {editWindows && <WindowsForm member={member} onDone={() => setEditWindows(false)} />}
      <div className="pl-cols3">
        {TIMES.map(t => {
          const steps = stepsOf(member.id, t.id)
          return (
            <div key={t.id} className="pl-section pl-col" style={{ gap: 8 }}>
              <strong style={{ fontSize: 'var(--pl-size-h3)' }}>{t.label}</strong>
              {steps.length === 0 && <div className="pl-muted">אין הרגלים.</div>}
              {steps.map((s, i) => (
                <StepCell key={s.id} step={s} role={member.role} first={i === 0} last={i === steps.length - 1}
                  onEdit={() => onEdit({ step: s })} onMove={dir => onMove(s, dir)} onDelete={() => onDelete(s)} />
              ))}
              <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={() => onEdit({ memberId: member.id, timeOfDay: t.id })}>
                + הוסף הרגל
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepCell({ step, first, last, onEdit, onMove, onDelete, role }) {
  return (
    <div className="pl-box pl-col" style={{ gap: 4, padding: '8px 12px' }}>
      <div className="pl-row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <button className="pl-link" onClick={onEdit}><strong>{step.label}</strong></button>
        <span className="pl-row" style={{ gap: 2, flexWrap: 'nowrap' }}>
          <button className="pl-link pl-muted" disabled={first} onClick={() => onMove(-1)} title="למעלה">↑</button>
          <button className="pl-link pl-muted" disabled={last} onClick={() => onMove(1)} title="למטה">↓</button>
          <button className="pl-icon-button pl-quick-delete" onClick={onDelete} aria-label={'מחק את ' + step.label} title="מחיקה">✕</button>
        </span>
      </div>
      <div className="pl-row" style={{ gap: 4 }}>
        <span className="pl-chip">{rulesText(step.days_rule, step.days_custom, role)}</span>
        {step.exact_time && <span className="pl-chip pl-chip-accent">{step.exact_time}</span>}
        {Number.isInteger(step.points) && <span className="pl-chip pl-chip-points">{step.points} נק׳</span>}
      </div>
    </div>
  )
}

function WindowsForm({ member, onDone }) {
  const { updateMember } = useStore()
  const [windows, setWindows] = useState(memberWindows(member))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (t, key, value) => setWindows(w => ({ ...w, [t]: { ...w[t], [key]: value } }))

  const save = async (value) => {
    setSaving(true)
    setError('')
    try {
      await updateMember({ id: member.id, windows: value })
      onDone()
    } catch (e) {
      setError(ERRORS[e.message] || e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pl-col pl-box" style={{ marginTop: 8 }}>
      {TIMES.map(t => (
        <label key={t.id} className="pl-row">
          <span style={{ minWidth: 90 }}>{t.label}</span>
          <input type="time" value={windows[t.id].start} onChange={e => set(t.id, 'start', e.target.value)} />
          –
          <input type="time" value={windows[t.id].end} onChange={e => set(t.id, 'end', e.target.value)} />
        </label>
      ))}
      {error && <div className="pl-error">{error}</div>}
      <div className="pl-row">
        <button className="pl-primary" disabled={saving} onClick={() => save(windows)}>שמור שעות</button>
        <button disabled={saving} onClick={() => save(null)}>חזרה לברירת המחדל</button>
      </div>
    </div>
  )
}
