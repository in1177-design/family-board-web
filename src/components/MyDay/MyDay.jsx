import React, { useCallback, useEffect, useState } from 'react'
import { api, useStore } from '../../store'
import { TIMES } from '../Routines/labels'
import StepForm from '../Routines/StepForm'
import TimePicker from './TimePicker'
import TodosSection, { TodoCard } from './TodosSection'
import TodoForm from './TodoForm'
import FoldHead from './FoldHead'
import { memberPhoto } from '../shared/memberPhoto'

const REFRESH_MS = 30000

// החלון של שעה: החלון האחרון שהתחיל עד אותה שעה. לפני הבוקר: בוקר
function windowOf(time, windows) {
  let out = 'morning'
  for (const t of TIMES) if (time >= windows[t.id].start) out = t.id
  return out
}

// "היום שלי": שלושת החלונות של היום עם ההרגלים שחלים היום, ומתחתם המשימות.
// מתרענן כשחוזרים למסך וכל 30 שניות, כדי שסימון בטלפון יופיע גם במחשב
// hideHero: במסך הילד ה-hero נמצא בפס העליון, אז כאן לא מציגים אותו.
// viewerId: מי מסתכל, אם זה לא בעל היום. החלטה 2026-10-07: הורה שצופה ביום של ילד
// מסמן ומזיז שעות כמו הילד, עורך כל הרגל, וקובע נקודות להרגל שהוא מוסיף לילד
export default function MyDay({ memberId, viewerId, hideHero }) {
  const { members } = useStore()
  const viewer = viewerId && viewerId !== memberId && members.find(m => m.id === viewerId)
  const parentViewing = viewer?.role === 'parent'
  const [day, setDay] = useState(null)
  const [error, setError] = useState('')
  // החלטה 2026-10-07: כל בן משפחה מוסיף לעצמו הרגלים ומשימות, בלי אישור
  const [editing, setEditing] = useState(null)   // הרגל: { step } או { timeOfDay }
  const [editTodo, setEditTodo] = useState(null) // משימה: { todo } או {}

  const load = useCallback(() =>
    api.day.get(memberId).then(d => { setDay(d); setError('') }).catch(e => setError(e.message)),
  [memberId])

  useEffect(() => {
    setDay(null)
    load()
    const timer = setInterval(load, REFRESH_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', load)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', load)
    }
  }, [load])

  const mark = async (step) => {
    const done = !step.done
    // מיד במסך, ואחר כך מהשרת
    setDay(d => ({
      ...d,
      routines: d.routines.map(r => r.run_id !== step.run_id ? r : {
        ...r, steps: r.steps.map(s => s.id === step.id ? { ...s, done } : s)
      })
    }))
    try {
      const res = await api.day.markStep({ runId: step.run_id, stepId: step.id, done })
      // הניקוד החדש של בן המשפחה, לפס העליון
      if (res?.points != null) {
        useStore.setState(st => ({ members: st.members.map(m => m.id === memberId ? { ...m, points: res.points } : m) }))
      }
    } catch (e) {
      setError(e.message === 'day_closed' ? 'היום הזה כבר נסגר' : e.message)
    }
    load()
  }

  // הזזת שעה להיום בלבד. null מחזיר לשעה הקבועה
  const setTime = async (step, time) => {
    try {
      await api.day.setTime({ runId: step.run_id, stepId: step.id, time })
    } catch (e) {
      setError(e.message === 'day_closed' ? 'היום הזה כבר נסגר' : e.message)
    }
    load()
  }

  const toggleTodo = async (todo, done) => {
    try {
      await api.todos.setDone({ id: todo.id, done })
    } catch (e) {
      setError(e.message)
    }
    load()
  }

  if (editTodo) {
    return <TodoForm {...editTodo} memberId={memberId} byId={viewer ? viewer.id : memberId} today={day.date} onClose={() => { setEditTodo(null); load() }} />
  }

  if (editing) {
    // הורה שמוסיף לילד: כמו מלוח ההרגלים (בלי selfId), ולכן יכול לקבוע נקודות
    return <StepForm {...editing} selfId={parentViewing ? undefined : memberId} memberId={memberId} onClose={() => { setEditing(null); load() }} />
  }

  if (error && !day) return <div className="pl"><p className="pl-error">{error}</p></div>
  if (!day) return <div className="pl"><p>טוען…</p></div>

  const dateText = new Date(day.date + 'T12:00:00').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  // החלטה 2026-10-07: משימה של היום עם שעה מופיעה בתוך החלון שלה, לפי השעה, יחד עם ההרגלים.
  // משימה בלי שעה, באיחור או בלי תאריך נשארת באזור "משימות"
  const timed = (day.todos?.today || []).filter(t => t.due_date === day.date && t.due_time)
  const timedIds = new Set(timed.map(t => t.id))
  const restTodos = day.todos && { ...day.todos, today: day.todos.today.filter(t => !timedIds.has(t.id)) }

  return (
    <div className="pl" style={{ maxWidth: 520 }}>
      {!hideHero && <div className="pl-hero">
        {memberPhoto(day.member) && <img className="pl-hero-photo" src={memberPhoto(day.member)} alt={day.member.name} />}
        <div>
          <h2>היום שלי · {day.member.name}</h2>
          <p className="pl-muted">{dateText} · {day.now}</p>
        </div>
      </div>}
      {error && <p className="pl-error">{error}</p>}

      {TIMES.map(t => {
        const runs = day.routines.filter(r => r.time_of_day === t.id)
        const steps = runs.flatMap(r => r.steps.map(s => ({ ...s, run_id: r.run_id })))
        const streak = runs.length === 1 ? runs[0].streak : 0
        return (
          <WindowCard
            key={t.id}
            label={t.label}
            window={day.windows[t.id]}
            steps={steps}
            todos={timed.filter(x => windowOf(x.due_time, day.windows) === t.id)}
            today={day.date}
            onToggleTodo={toggleTodo}
            onEditTodo={todo => setEditTodo({ todo })}
            streak={streak}
            windowOver={day.now >= day.windows[t.id].end}
            memberId={memberId}
            canEditAll={parentViewing}
            onMark={mark}
            onSetTime={setTime}
            now={day.now}
            onAdd={() => setEditing({ timeOfDay: t.id })}
            onEdit={(s) => setEditing({ step: s })}
          />
        )
      })}

      <TodosSection
        todos={restTodos}
        today={day.date}
        onToggle={toggleTodo}
        onAdd={() => setEditTodo({})}
        onEdit={todo => setEditTodo({ todo })}
      />
    </div>
  )
}

// חלון אחד: כותרת עם מונה, והרגל בכל כרטיס. הרגל שבוצע נשאר במקומו עם קו עליו.
// החלטה 2026-10-07: חלון שהכל בו בוצע מתקפל לכותרת עם חץ, ולחיצה על הכותרת פותחת וסוגרת
function WindowCard({ label, window: w, steps, todos, today, onToggleTodo, onEditTodo, streak, windowOver, memberId, canEditAll, onMark, onSetTime, now, onAdd, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const total = steps.length + todos.length
  const doneCount = steps.filter(s => s.done).length + todos.filter(t => t.done_at).length

  // קודם הרגלים בלי שעה, לפי הסדר שלהם. אחריהם כל מה שיש לו שעה, הרגלים ומשימות, לפי השעה
  const items = [
    ...steps.filter(s => !s.time_today).map(s => ({ kind: 'step', item: s })),
    ...[
      ...steps.filter(s => s.time_today).map(s => ({ kind: 'step', item: s, time: s.time_today })),
      ...todos.map(t => ({ kind: 'todo', item: t, time: t.due_time }))
    ].sort((a, b) => a.time.localeCompare(b.time))
  ]
  const complete = total > 0 && doneCount === total
  const folded = complete && !expanded

  return (
    <div className="pl-section pl-col" style={{ gap: 10 }}>
      <FoldHead foldable={complete} folded={folded} onToggle={() => setExpanded(v => !v)}>
        <div>
          <strong style={{ fontSize: 'var(--pl-size-h3)' }}>{complete ? '✓ ' : ''}{label}</strong>
          <span className="pl-muted"> · {w.start}–{w.end}</span>
        </div>
        {total > 0 && (
          <span className="pl-row">
            {streak > 0 && <span className="pl-chip pl-chip-warn">רצף {streak} {streak === 1 ? 'יום' : 'ימים'}</span>}
            <span className="pl-chip pl-chip-accent">{doneCount}/{total}</span>
          </span>
        )}
      </FoldHead>
      {!folded && <>
      {windowOver && total > 0 && !complete && <div className="pl-muted">הזמן עבר, אבל אפשר עוד לסיים היום.</div>}
      {total === 0 && <div className="pl-muted">אין הרגלים היום.</div>}
      {items.map(({ kind, item: s }) => kind === 'todo'
        ? <TodoCard key={s.id} todo={s} today={today} onToggle={onToggleTodo} onEdit={onEditTodo} />
        : <StepCard key={s.id} step={s} window={w} now={now} onChange={() => onMark(s)}
            onSetTime={time => onSetTime(s, time)}
            onEdit={canEditAll || s.created_by === memberId ? () => onEdit(s) : null} />
      )}
      <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={onAdd}>+ הוסף הרגל</button>
      </>}
    </div>
  )
}
// כל הרגל: כרטיס, תגית שעה אם יש, ותפריט ⋮
function StepCard({ step, window: w, now, onChange, onSetTime, onEdit }) {
  const [picking, setPicking] = useState(false)
  const [menu, setMenu] = useState(false)
  // שעה שנקבעה או הוזזה להיום בלבד
  const today = step.time_today && step.time_today !== step.exact_time

  const pick = () => { setMenu(false); setPicking(true) }

  return (
    <div className="pl-col" style={{ gap: 6 }}>
      <div className="pl-row" style={{ flexWrap: 'nowrap' }}>
        <label className={'pl-step' + (step.done ? ' pl-step-done' : '')} style={{ flex: 1 }}>
          <input type="checkbox" checked={step.done} onChange={onChange} />
          <span style={{ flex: 1 }}>{step.label}</span>
          {step.points > 0 && <span className="pl-chip pl-chip-points">{step.points} נק׳</span>}
        </label>
        {step.time_today && (
          <button
            className={'pl-chip-button' + (today ? ' pl-chip-button-moved' : '')}
            onClick={() => setPicking(v => !v)}
            title={today ? 'היום בלבד' : 'שנה להיום'}
          >
            {step.time_today}
          </button>
        )}
        <div className="pl-menu">
          <button className="pl-menu-button" onClick={() => setMenu(v => !v)} aria-label="עוד פעולות">⋮</button>
          {menu && (
            <div className="pl-menu-list" onMouseLeave={() => setMenu(false)}>
              <button onClick={pick}>{step.time_today ? 'שנה שעה להיום' : 'קבע שעה להיום'}</button>
              {today && (
                <button onClick={() => { setMenu(false); onSetTime(null) }}>
                  {step.exact_time ? `חזרה לשעה הקבועה (${step.exact_time})` : 'הסר שעה'}
                </button>
              )}
              {onEdit && <button onClick={() => { setMenu(false); onEdit() }}>ערוך הרגל</button>}
            </div>
          )}
        </div>
      </div>
      {picking && (
        <TimePicker
          step={step}
          window={w}
          now={now}
          onPick={time => { setPicking(false); onSetTime(time) }}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  )
}
