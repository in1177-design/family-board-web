import React, { useCallback, useEffect, useState } from 'react'
import { api, useStore } from '../../store'
import { TIMES, TAGLINES, rulesText } from '../Routines/labels'
import StepForm from '../Routines/StepForm'
import TimePicker from './TimePicker'
import TodosSection, { TodoCard } from './TodosSection'
import TodoForm from './TodoForm'
import FoldHead from './FoldHead'
import Icon from '../shared/Icon'
import { stepIcon, WINDOW_IMAGES } from './icons'
import { memberPhoto } from '../shared/memberPhoto'
import PixelCard from '../shared/PixelCard'

const REFRESH_MS = 30000

// החלון של שעה: החלון האחרון שהתחיל עד אותה שעה. לפני הבוקר: בוקר
function windowOf(time, windows) {
  let out = 'morning'
  for (const t of TIMES) if (time >= windows[t.id].start) out = t.id
  return out
}

// סיכום היום ל-Hero ולשורת הסיכום: מה בוצע מתוך כל ההרגלים של היום, המשימות של היום והמשימות שבאיחור.
// משימות "בלי תאריך" לא נספרות, כי הן לא חלק מהיום
export function daySummary(day) {
  const steps = day.routines.flatMap(r => r.steps)
  const todos = [...(day.todos?.overdue || []), ...(day.todos?.today || [])]
  const total = steps.length + todos.length
  const done = steps.filter(s => s.done).length + todos.filter(t => t.done_at).length
  return { total, done }
}

// "היום שלי": שלושת החלונות של היום עם ההרגלים שחלים היום, ומתחתם המשימות.
// מתרענן כשחוזרים למסך וכל 30 שניות, כדי שסימון בטלפון יופיע גם במחשב
// hideHero: במסך הילד ה-hero נמצא בפס העליון, אז כאן לא מציגים אותו.
// viewerId: מי מסתכל, אם זה לא בעל היום. החלטה 2026-10-07: הורה שצופה ביום של ילד
// מסמן ומזיז שעות כמו הילד, עורך כל הרגל, וקובע נקודות להרגל שהוא מוסיף לילד
// onSummary: מקבל את daySummary בכל טעינה, ל-Hero ולשורת הסיכום שמעל
export default function MyDay({ memberId, viewerId, hideHero, onSummary }) {
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

  // גם אחרי סימון (העדכון המיידי במסך), כדי שהאחוז יזוז מיד
  useEffect(() => {
    if (day && onSummary) onSummary(daySummary(day))
  }, [day, onSummary])

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
    // מיד במסך, ואחר כך מהשרת
    const doneAt = done ? new Date().toISOString() : null
    setDay(d => d.todos ? ({
      ...d,
      todos: Object.fromEntries(Object.entries(d.todos).map(([k, list]) =>
        [k, list.map(t => t.id === todo.id ? { ...t, done_at: doneAt } : t)]))
    }) : d)
    try {
      await api.todos.setDone({ id: todo.id, done })
    } catch (e) {
      setError(e.message)
    }
    load()
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
    <div className="pl pl-day" style={{ maxWidth: 'var(--pl-page-max)' }}>
      {!hideHero && <div className="pl-hero">
        {memberPhoto(day.member) && <img className="pl-hero-photo" src={memberPhoto(day.member)} alt={day.member.name} />}
        <div>
          <h2>היום שלי · {day.member.name}</h2>
          <p className="pl-muted">{dateText} · {day.now}</p>
        </div>
      </div>}
      {error && <p className="pl-error">{error}</p>}

      {/* במחשב שלוש עמודות, בטלפון אחד מתחת לשני */}
      <div className="pl-cols3">
      {TIMES.map(t => {
        const runs = day.routines.filter(r => r.time_of_day === t.id)
        const steps = runs.flatMap(r => r.steps.map(s => ({ ...s, run_id: r.run_id })))
        const streak = runs.length === 1 ? runs[0].streak : 0
        return (
          <WindowCard
            key={t.id}
            id={t.id}
            label={t.label}
            tagline={TAGLINES[t.id]}
            window={day.windows[t.id]}
            steps={steps}
            todos={timed.filter(x => windowOf(x.due_time, day.windows) === t.id)}
            today={day.date}
            onToggleTodo={toggleTodo}
            onEditTodo={todo => setEditTodo({ todo })}
            streak={streak}
            windowOver={day.now >= day.windows[t.id].end}
            onMark={mark}
            onSetTime={setTime}
            now={day.now}
            onAdd={() => setEditing({ timeOfDay: t.id })}
          />
        )
      })}
      </div>

      <TodosSection
        todos={restTodos}
        today={day.date}
        onToggle={toggleTodo}
        onAdd={() => setEditTodo({})}
        onEdit={todo => setEditTodo({ todo })}
      />

      {/* הוספת הרגל: בחלון מודאלי מעל היום (2026-10-08).
          הורה שמוסיף לילד: כמו מלוח ההרגלים (בלי selfId), ולכן יכול לקבוע נקודות */}
      {editing && <StepForm {...editing} selfId={parentViewing ? undefined : memberId} memberId={memberId} onClose={() => { setEditing(null); load() }} />}

      {/* הוספה ועריכה של משימה: בחלון מודאלי מעל היום (2026-10-08) */}
      {editTodo && <TodoForm {...editTodo} memberId={memberId} byId={viewer ? viewer.id : memberId} today={day.date} onClose={() => { setEditTodo(null); load() }} />}
    </div>
  )
}

// חלון אחד (wireframe, 2026-10-07): כותרת עם שם, משפט, שעות ומונה, פס התקדמות, הרגל בכל שורה,
// ובתחתית "+ הוספת הרגל" והרצף. הרגל שבוצע נשאר במקומו עם קו עליו.
// כל חלון מתקפל בלחיצה על הכותרת. חלון שהכל בו בוצע מתקפל מעצמו
export function WindowCard({ id, label, tagline, window: w, steps, todos, today, onToggleTodo, onEditTodo, streak, windowOver, onMark, onSetTime, now, onAdd }) {
  // null: לפי המצב (פתוח, ומקופל כשהכל בוצע). true/false: מה שבן המשפחה בחר
  const [open, setOpen] = useState(null)
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
  const folded = open === null ? complete : !open

  return (
    <PixelCard className={'pl-col pl-win pl-win-' + id} style={{ gap: 10 }}>
      <FoldHead foldable folded={folded} onToggle={() => setOpen(folded)}>
        {/* האייקון מוסתר בעיצוב הרגיל. העטיפה נשארת הילד הראשון, כדי שהכותרת תתמתח כמו קודם */}
        <div className="pl-win-head">
          <img src={WINDOW_IMAGES[id]} alt="" className="pl-win-icon px-only" />
          <div>
            <strong style={{ fontSize: 'var(--pl-size-h3)' }}>{complete ? '✓ ' : ''}{label}</strong>
            <span className="pl-muted"> · {w.start}–{w.end}</span>
            <div className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>{tagline}</div>
          </div>
        </div>
        {total > 0 && <span className="pl-chip pl-chip-accent">{doneCount}/{total}</span>}
      </FoldHead>
      {total > 0 && <Progress done={doneCount} total={total} />}
      {!folded && <>
      {windowOver && total > 0 && !complete && <div className="pl-muted">הזמן עבר, אבל אפשר עוד לסיים היום.</div>}
      {total === 0 && <div className="pl-muted">אין הרגלים היום.</div>}
      {items.map(({ kind, item: s }) => kind === 'todo'
        ? <TodoCard key={s.id} todo={s} today={today} inWindow onToggle={onToggleTodo} onEdit={onEditTodo} />
        : <StepCard key={s.id} step={s} window={w} now={now} onChange={() => onMark(s)}
            onSetTime={time => onSetTime(s, time)} />
      )}
      <div className="pl-row" style={{ justifyContent: 'space-between' }}>
        <button className="pl-link" onClick={onAdd}>+ הוספת הרגל</button>
        {streak > 0 && <span className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>🔥 רצף של {streak} {streak === 1 ? 'יום' : 'ימים'}</span>}
      </div>
      </>}
    </PixelCard>
  )
}

// פס התקדמות: כמה בוצע מתוך כמה
export function Progress({ done, total }) {
  return (
    <div className="pl-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      <div style={{ width: `${total ? Math.round(done / total * 100) : 0}%` }} />
    </div>
  )
}

// שורת הרגל (wireframe): סימון, שם, ומתחת הימים. תגית שעה (לחיצה מזיזה להיום), נקודות, ועיפרון לעריכה
export function StepCard({ step, window: w, now, onChange, onSetTime }) {
  const [picking, setPicking] = useState(false)
  // שעה שנקבעה או הוזזה להיום בלבד
  const today = step.time_today && step.time_today !== step.exact_time

  return (
    <div className="pl-col" style={{ gap: 6 }}>
      {/* pl-step-row: בעיצוב החדש המסגרת על כל השורה, כולל השעה והעיפרון, ברוחב קבוע */}
      <div className={'pl-row pl-step-row' + (step.done ? ' pl-step-row-done' : '')} style={{ flexWrap: 'nowrap' }}>
        <label className={'pl-step' + (step.done ? ' pl-step-done' : '')} style={{ flex: 1 }}>
          <input type="checkbox" checked={step.done} onChange={onChange} />
          <Icon name={stepIcon(step)} className="pl-item-icon" />
          <span className="pl-step-name" style={{ flex: 1 }}>
            <span className="pl-step-title">{step.label}</span>
            <span className="pl-sub">
              {rulesText(step.days_rule, step.days_custom)}
              {step.duration_minutes ? ` · ⏱ ${step.duration_minutes} דק׳` : ''}
            </span>
          </span>
          {step.points > 0 && <span className="pl-chip pl-chip-points">+{step.points} ★</span>}
        </label>
        {step.time_today
          ? (
            <button
              className={'pl-chip-button' + (today ? ' pl-chip-button-moved' : '')}
              onClick={() => setPicking(v => !v)}
              title={today ? 'היום בלבד' : 'שנה להיום'}
            >
              {step.time_today}
            </button>
          )
          : (
            // בעיצוב החדש: אייקון שעון במקום הטקסט, כדי שלשם יהיה מקום
            <button className="pl-link pl-muted pl-set-time" onClick={() => setPicking(v => !v)} aria-label="קבע שעה להיום" title="קבע שעה להיום">
              <span className="plain-only">קבע שעה</span>
              <Icon name="clock" />
            </button>
          )}
      </div>
      {picking && (
        <TimePicker
          step={step}
          window={w}
          now={now}
          onPick={time => { setPicking(false); onSetTime(time) }}
          onReset={today ? () => { setPicking(false); onSetTime(null) } : null}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  )
}
