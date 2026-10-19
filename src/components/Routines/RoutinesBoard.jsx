import React, { useEffect, useMemo, useState } from 'react'
import { useStore, api } from '../../store'
import StepForm from './StepForm'
import MemberTabs from '../shared/MemberTabs'
import WindowsBoard from './WindowsBoard'
import { TIMES, ERRORS, memberWindows, rulesText } from './labels'

// לוח ההרגלים (רפרנס: screens/Main.dc_1.html): עמודה לכל חלון, ובכל עמודה ההרגלים, כל אחד עם הימים והשעה שלו.
// בן משפחה אחד בכל פעם, עם בחירה למעלה (המשתמשת, 2026-10-09: "הכל באותו דף, פצל לכל דמות בנפרד")
// fixedMemberId: לוח של בן משפחה אחד, בלי הבחירה למעלה (לשוניות הילד ב"ילדים", 2026-10-18)
export default function RoutinesBoard({ fixedMemberId } = {}) {
  const { members } = useStore()
  const [routines, setRoutines] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { step } לעריכה, או { memberId, timeOfDay } להוספה
  const [memberId, setMemberId] = useState(() => members[0]?.id)
  const member = members.find(m => m.id === (fixedMemberId || memberId)) || members[0]

  const load = () => api.routines.getAll().then(setRoutines).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  // כל ההרגלים של בן משפחה בחלון, גם אם נשמרו בכמה מיכלים
  const stepsOf = (memberId, timeOfDay) => (routines || [])
    .filter(r => r.member_id === memberId && r.timing_type === 'window' && r.time_of_day === timeOfDay)
    .flatMap(r => r.steps.filter(s => s.status === 'active'))

  // עריכה בתוך השורה (2026-10-18). שגיאה חוזרת לשורה, כדי שתוצג שם
  const saveStep = async (step, body) => {
    await api.routines.updateStep({ id: step.id, ...body })
    load()
  }
  // גרירה (2026-10-18): הסדר החדש של החלון שאליו הגיע ההרגל
  const order = async (timeOfDay, stepIds) => {
    await api.routines.setWindowOrder({ memberId: member.id, timeOfDay, stepIds }).catch(e => setError(e.message))
    load()
  }
  const columns = useMemo(() => member && routines
    ? Object.fromEntries(TIMES.map(t => [t.id, stepsOf(member.id, t.id)]))
    : null, [routines, member?.id])

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
        {/* בלי "הרגל חדש" (המשתמשת, 2026-10-19): לכל חלון יש "הוסף הרגל" בכותרת */}
      </div>

      {!fixedMemberId && <MemberTabs members={members} value={member?.id} onChange={setMemberId}
        count={m => TIMES.reduce((n, t) => n + stepsOf(m.id, t.id).length, 0)} />}

      {error && <p className="pl-error">{error}</p>}
      {!routines && !error && <p>טוען…</p>}

      {routines && member && (
        <MemberBoard key={member.id} member={member} columns={columns} onEdit={setEditing} onOrder={order} onDelete={remove} onSave={saveStep} />
      )}

      {/* הוספה ועריכה של הרגל: חלון מודאלי מעל הלוח (2026-10-08) */}
      {editing && <StepForm {...editing} onClose={() => { setEditing(null); load() }} />}
    </div>
  )
}

// ההרגלים של בן משפחה אחד: שלושת החלונות כמו ב"היום של", עם גרירה (WindowsBoard).
// השעות של כל חלון נשנות בכותרת שלו (2026-10-18)
function MemberBoard({ member, columns, onEdit, onOrder, onDelete, onSave }) {
  return (
    <div className="pl-col" style={{ gap: 12, marginTop: 16 }}>
      <WindowsBoard member={member} columns={columns} onOrder={onOrder}
        onEdit={step => onEdit({ step })} onAdd={timeOfDay => onEdit({ memberId: member.id, timeOfDay })} onDelete={onDelete} onSave={onSave} />
    </div>
  )
}
