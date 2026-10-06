import React, { useEffect, useState } from 'react'
import { useStore, api } from '../../store'
import StepForm from './StepForm'
import { TIMES, ERRORS, memberWindows, rulesText } from './labels'

// מלוח השגרות (רפרנס: screens/Main.dc_1.html): שורה לכל בן משפחה, עמודה לכל חלון.
// בכל תא: ההרגלים של החלון, כל אחד עם הימים והשעה שלו
export default function RoutinesBoard() {
  const { members } = useStore()
  const [routines, setRoutines] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { step } לעריכה, או { memberId, timeOfDay } להוספה

  const load = () => api.routines.getAll().then(setRoutines).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  if (editing) return <StepForm {...editing} onClose={() => { setEditing(null); load() }} />

  // כל ההרגלים של בן משפחה בחלון, גם אם נשמרו בכמה מיכלים
  const stepsOf = (memberId, timeOfDay) => (routines || [])
    .filter(r => r.member_id === memberId && r.timing_type === 'window' && r.time_of_day === timeOfDay)
    .flatMap(r => r.steps.filter(s => s.status === 'active'))

  const move = async (step, dir) => {
    await api.routines.moveStep({ id: step.id, dir }).catch(e => setError(e.message))
    load()
  }

  return (
    <div className="pl">
      <div className="pl-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2>הרגלים</h2>
          <p>מה כל אחד עושה כל יום בבוקר, בצהריים ובערב</p>
        </div>
        <button className="pl-primary" onClick={() => setEditing({})}>הרגל חדש</button>
      </div>

      {error && <p className="pl-error">{error}</p>}
      {!routines && !error && <p>טוען…</p>}

      {routines && (
        <table className="pl-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>בן משפחה</th>
              {TIMES.map(t => <th key={t.id}>{t.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <MemberRow key={m.id} member={m} stepsOf={stepsOf} onEdit={setEditing} onMove={move} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function MemberRow({ member, stepsOf, onEdit, onMove }) {
  const [editWindows, setEditWindows] = useState(false)
  const windows = memberWindows(member)

  return (
    <tr>
      <td>
        <div><strong>{member.name}</strong></div>
        <div className="pl-muted">{member.role === 'parent' ? 'הורה' : 'ילד/ה'}</div>
        <button className="pl-link pl-muted" onClick={() => setEditWindows(v => !v)}>
          {editWindows ? 'סגור שעות' : 'שנה שעות'}
        </button>
        {editWindows && <WindowsForm member={member} onDone={() => setEditWindows(false)} />}
      </td>
      {TIMES.map(t => {
        const steps = stepsOf(member.id, t.id)
        const w = windows[t.id]
        return (
          <td key={t.id}>
            <div className="pl-col">
              <div className="pl-muted">{w.start}–{w.end}</div>
              {steps.map((s, i) => (
                <StepCell key={s.id} step={s} first={i === 0} last={i === steps.length - 1}
                  onEdit={() => onEdit({ step: s })} onMove={dir => onMove(s, dir)} />
              ))}
              <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={() => onEdit({ memberId: member.id, timeOfDay: t.id })}>
                + הוסף הרגל
              </button>
            </div>
          </td>
        )
      })}
    </tr>
  )
}

function StepCell({ step, first, last, onEdit, onMove }) {
  return (
    <div className="pl-box pl-col" style={{ gap: 4, padding: '8px 12px' }}>
      <div className="pl-row" style={{ justifyContent: 'space-between' }}>
        <button className="pl-link" onClick={onEdit}><strong>{step.label}</strong></button>
        <span className="pl-row" style={{ gap: 2 }}>
          <button className="pl-link pl-muted" disabled={first} onClick={() => onMove(-1)} title="למעלה">↑</button>
          <button className="pl-link pl-muted" disabled={last} onClick={() => onMove(1)} title="למטה">↓</button>
        </span>
      </div>
      <div className="pl-row" style={{ gap: 4 }}>
        <span className="pl-chip">{rulesText(step.days_rule, step.days_custom)}</span>
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
