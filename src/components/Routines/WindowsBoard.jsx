import React, { useEffect, useState } from 'react'
import { ERRORS, daysRules, memberWindows } from './labels'
import { useStore } from '../../store'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TIMES, TAGLINES, DAY_LETTERS, ruleWeekdays } from './labels'
import PixelCard from '../shared/PixelCard'
import IconPicker from '../shared/IconPicker'
import Icon from '../shared/Icon'
import { stepIcon, WINDOW_IMAGES } from '../MyDay/icons'

// לוח ההרגלים של בן משפחה אחד, באותו עיצוב כמו "היום של" (המשתמשת, 2026-10-18): שלושה חלונות, בוקר, צהריים וערב.
// הסדר בגרירה, במקום החצים: בידית ⋮⋮ שבצד השורה, גם בעכבר וגם במגע (בטלפון גרירה של כל השורה מתנגשת בגלילה).
// אפשר לגרור גם לחלון אחר. בסוף הגרירה נשמר הסדר של החלון שאליו הגיע ההרגל (PUT /api/routines/window-order)
const LINE_ICONS = { morning: 'sun', noon: 'sunset', evening: 'moon' }

// onSave(step, body): עריכה בתוך השורה (2026-10-18). onEdit(step): הטופס המלא ("עוד הגדרות")
export default function WindowsBoard({ member, columns, onEdit, onAdd, onDelete, onOrder, onSave }) {
  // עותק מקומי של החלונות, כדי שהגרירה תזוז מיד. מתעדכן מהשרת כשלא גוררים
  const [cols, setCols] = useState(columns)
  const [dragId, setDragId] = useState(null)
  useEffect(() => { if (!dragId) setCols(columns) }, [columns])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  // החלון של הרגל, או החלון עצמו (כשגוררים לחלון ריק)
  const colOf = (id) => cols[id] ? id : TIMES.map(t => t.id).find(t => cols[t].some(s => s.id === id))
  const stepOf = (id) => Object.values(cols).flat().find(s => s.id === id)

  const onDragOver = ({ active, over }) => {
    if (!over) return
    const from = colOf(active.id), to = colOf(over.id)
    if (!from || !to || from === to) return
    setCols(c => {
      const moving = c[from].find(s => s.id === active.id)
      const at = c[to].findIndex(s => s.id === over.id)
      const list = [...c[to]]
      list.splice(at < 0 ? list.length : at, 0, moving)
      return { ...c, [from]: c[from].filter(s => s.id !== active.id), [to]: list }
    })
  }

  const onDragEnd = ({ active, over }) => {
    setDragId(null)
    if (!over) { setCols(columns); return }
    const col = colOf(active.id)
    let list = cols[col]
    const a = list.findIndex(s => s.id === active.id), b = list.findIndex(s => s.id === over.id)
    if (b >= 0 && a !== b) list = arrayMove(list, a, b)
    setCols(c => ({ ...c, [col]: list }))
    onOrder(col, list.map(s => s.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={({ active }) => setDragId(active.id)} onDragOver={onDragOver} onDragEnd={onDragEnd}
      onDragCancel={() => { setDragId(null); setCols(columns) }}>
      {/* טבלה לרוחב (המשתמשת, 2026-10-18): החלונות אחד מתחת לשני, ובכל חלון שורה לכל הרגל עם עמודות מיושרות */}
      <div className="wb wb-stack">
        {TIMES.map(t => (
          <PixelCard key={t.id} className={'pl-col pl-win pl-win-' + t.id} style={{ gap: 10 }}>
            {/* הכותרת לפי העיצוב של המשתמשת (2026-10-19): שם ומשפט, "שעות" (לחיצה משנה), "הרגלים" (כמה), ו"הוסף הרגל" בצד השני */}
            <div className="pl-fold-head wb-head">
              <div className="pl-win-head">
                <img src={WINDOW_IMAGES[t.id]} alt="" className="pl-win-icon px-only" />
                <Icon name={LINE_ICONS[t.id]} className="pl-win-icon-line plain-only" />
                <div>
                  <strong style={{ fontSize: 'var(--pl-size-h3)' }}>{t.label}</strong>
                  <div className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>{TAGLINES[t.id]}</div>
                </div>
              </div>
              <div className="wb-stat"><WindowTime member={member} timeOfDay={t.id} /><span className="wb-stat-label">שעות</span></div>
              <div className="wb-stat"><span className="wb-stat-num">{cols[t.id].length}</span><span className="wb-stat-label">הרגלים</span></div>
              <button className="wb-add-btn" onClick={() => onAdd(t.id)}>הוסף הרגל</button>
            </div>
            {cols[t.id].length > 0 && <div className="wb-grid wb-thead" aria-hidden="true">
              <span /><span>שם</span><span>ימים</span><span>משך</span><span>שעה</span><span>נק׳</span><span /><span />
            </div>}
            <Column id={t.id} steps={cols[t.id]} member={member} onEdit={onEdit} onDelete={onDelete} onSave={onSave} />
          </PixelCard>
        ))}
      </div>
      <DragOverlay>{dragId && stepOf(dragId) ? <Row step={stepOf(dragId)} member={member} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}

// רשימת ההרגלים של חלון. גם חלון ריק מקבל גרירה (useDroppable)
function Column({ id, steps, member, onEdit, onDelete, onSave }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <SortableContext id={id} items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={'wb-list' + (isOver && !steps.length ? ' wb-list-over' : '')}>
        {!steps.length && <div className="pl-muted wb-empty">אין הרגלים. אפשר לגרור לכאן.</div>}
        {steps.map(s => <SortableRow key={s.id} step={s} member={member} onEdit={() => onEdit(s)} onDelete={() => onDelete(s)} onSave={body => onSave(s, body)} />)}
      </div>
    </SortableContext>
  )
}

function SortableRow({ step, member, onEdit, onDelete, onSave }) {
  // עריכה בתוך השורה, באותו מקום (המשתמשת, 2026-10-18). בזמן עריכה אין גרירה
  const [editing, setEditing] = useState(false)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: step.id, disabled: editing })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? 'wb-ghost' : ''}>
      {editing
        ? <EditRow step={step} member={member} onSave={onSave} onDone={() => setEditing(false)} />
        : <Row step={step} member={member} onStartEdit={() => setEditing(true)} onDelete={onDelete}
        handle={<button ref={setActivatorNodeRef} className="wb-handle" aria-label={'גרירה של ' + step.label} title="גרירה לסידור" {...attributes} {...listeners}>⋮⋮</button>} />}
    </div>
  )
}

// שורת הרגל במסגרת משלה: ידית, אייקון, שם (לחיצה פותחת עריכה), ומתחת הימים, משך הזמן והשעה. נקודות, ופח קטן למחיקה.
// הימים כאותיות א׳–ש׳, והימים שבהם ההרגל מופיע מודגשים (המשתמשת, 2026-10-18: "צריך להציג באילו ימים")
function Row({ step, member, handle, onStartEdit, onDelete, overlay }) {
  const days = ruleWeekdays(step.days_rule, step.days_custom, member.school_days || undefined)
  return (
    <div className={'wb-grid wb-row' + (overlay ? ' wb-overlay' : '')}>
      {handle || <span className="wb-handle" aria-hidden="true">⋮⋮</span>}
      <span className="wb-name">
        <span className="wb-icon-box"><Icon name={stepIcon(step)} className="pl-item-icon" /></span>
        <span className="pl-step-title">{step.label}</span>
      </span>
      <span className="wb-days" aria-label={'ימים: ' + days.map(d => DAY_LETTERS[d]).join(' ')}>
        {DAY_LETTERS.map((l, d) => <span key={d} className={days.includes(d) ? 'wb-day-on' : 'wb-day'} aria-hidden="true">{l.replace('׳', '')}</span>)}
      </span>
      <span className="wb-cell">{step.duration_minutes ? `${step.duration_minutes} דק׳` : ''}</span>
      <span className="wb-cell">{step.exact_time && <><Icon name="clock" className="wb-cell-icon" line />{step.exact_time}</>}</span>
      <span className="wb-cell">{Number.isInteger(step.points) && <>{step.points} <span className="wb-star">★</span></>}</span>
      {onStartEdit ? <button className="wb-delete wb-edit" onClick={onStartEdit} aria-label={'עריכת ' + step.label} title="עריכה"><Icon name="pencil" /></button> : <span />}
      {onDelete ? <button className="wb-delete" onClick={onDelete} aria-label={'מחיקת ' + step.label} title="מחיקה"><Icon name="trash" /></button> : <span />}
    </div>
  )
}

// השורה במצב עריכה, באותו מקום ובשורה אחת (המשתמשת, 2026-10-18), לפי הסדר:
// אייקון (לחיצה מחליפה), שם (קצר), הימים (נראים בדיוק כמו אחרי השמירה, ולחיצה על אות מחליפה יום), אחריהם בורר ימים מהיר,
// משך מרשימה נפתחת (כמו בטופס המשימה), שעה, נקודות עם − ו-+, ובסוף ✓ שמירה ו-✕ ביטול.
// השמירה שולחת את כל השדות של הטופס, כדי ששום דבר לא יימחק
const DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90]

function EditRow({ step, member, onSave, onDone }) {
  const schoolDays = member.school_days || undefined
  const [icon, setIcon] = useState(step.icon || '')
  const [label, setLabel] = useState(step.label)
  const [rule, setRule] = useState(step.days_rule === 'inherit' ? 'every_day' : step.days_rule)
  const [custom, setCustom] = useState(step.days_custom || [])
  const [duration, setDuration] = useState(step.duration_minutes || '')
  const [time, setTime] = useState(step.exact_time || '')
  const [points, setPoints] = useState(Number.isInteger(step.points) ? step.points : 2)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const days = ruleWeekdays(rule, custom, schoolDays)
  const durations = duration && !DURATIONS.includes(Number(duration)) ? [...DURATIONS, Number(duration)].sort((x, y) => x - y) : DURATIONS

  // אות שנלחצה: הימים הופכים ל"ימים מסוימים", עם היום הזה או בלעדיו
  const toggleDay = (d) => {
    const next = days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort()
    setRule('custom'); setCustom(next)
  }
  // בורר מהיר: כלל, או "ימים מסוימים" עם הימים שמסומנים עכשיו
  const pickRule = (r) => { if (r === 'custom') setCustom(days); setRule(r) }

  const save = async () => {
    setSaving(true); setError('')
    try {
      await onSave({
        label, library_step_id: step.library_step_id || null, days_rule: rule, days_custom: rule === 'custom' ? custom : [],
        exact_time: time || null,
        duration_minutes: duration ? Number(duration) : null,
        points,
        ...(icon !== (step.icon || '') ? { icon } : {})
      })
      onDone()
    } catch (e) {
      setError(ERRORS[e.message] || e.message || 'לא הצלחתי לשמור')
      setSaving(false)
    }
  }
  const onKey = (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') save(); if (e.key === 'Escape') onDone() }

  return (
    <div className="wb-row wb-row-edit" onKeyDown={onKey}>
      {/* אותן עמודות כמו השורה הרגילה והכותרות (המשתמשת, 2026-10-18: "לפזר באופן יפה") */}
      <div className="wb-grid wb-edit-line">
        <span className="wb-handle wb-handle-off" aria-hidden="true">⋮⋮</span>
        <span className="wb-name">
          <span className="wb-edit-icon"><IconPicker value={icon} auto={stepIcon({ ...step, icon: '' , label })} onChange={setIcon} /></span>
          <input type="text" className="wb-input wb-edit-name" value={label} onChange={e => setLabel(e.target.value)} aria-label="שם ההרגל" autoFocus />
        </span>
        <span className="wb-edit-days">
        <span className="wb-days" role="group" aria-label="ימים">
          {DAY_LETTERS.map((l, d) => (
            <button key={d} type="button" className={days.includes(d) ? 'wb-day-on' : 'wb-day'} aria-pressed={days.includes(d)}
              aria-label={l} onClick={() => toggleDay(d)}>{l.replace('׳', '')}</button>
          ))}
        </span>
        <select className="wb-input wb-rule" value={rule} onChange={e => pickRule(e.target.value)} aria-label="בחירת ימים מהירה">
          {daysRules(member.role).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          <option value="custom">ימים מסוימים</option>
        </select>
        </span>
        <select className="wb-input wb-edit-duration" value={duration} onChange={e => setDuration(e.target.value)} aria-label="משך">
          <option value="">בלי משך</option>
          {durations.map(d => <option key={d} value={d}>{d} דק׳</option>)}
        </select>
        <input className="wb-input wb-edit-time" type="time" value={time} onChange={e => setTime(e.target.value)} aria-label="שעה" />
        <span className="wb-stepper" role="group" aria-label="נקודות">
          <button type="button" onClick={() => setPoints(p => Math.max(0, p - 1))} aria-label="פחות נקודה" disabled={points <= 0}>−</button>
          <span className="wb-stepper-value">{points} <span className="wb-star">★</span></span>
          <button type="button" onClick={() => setPoints(p => Math.min(99, p + 1))} aria-label="עוד נקודה" disabled={points >= 99}>+</button>
        </span>
        <button className="wb-delete wb-save" onClick={save} disabled={saving} aria-label="שמירה" title="שמירה">✓</button>
        <button className="wb-delete" onClick={onDone} disabled={saving} aria-label="ביטול" title="ביטול">✕</button>
      </div>
      {error && <span className="sd-error" role="alert">{error}</span>}
    </div>
  )
}

// חלון הזמן בכותרת, במקום המשפט (המשתמשת, 2026-10-18): "06:30–08:00" ו"שינוי". שינוי פותח שתי שעות באותו מקום.
// נשמר בבן המשפחה (members.windows), רק החלון הזה משתנה
function WindowTime({ member, timeOfDay }) {
  const { updateMember } = useStore()
  const current = memberWindows(member)[timeOfDay]
  const [editing, setEditing] = useState(false)
  const [start, setStart] = useState(current.start)
  const [end, setEnd] = useState(current.end)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const open = () => { setStart(current.start); setEnd(current.end); setError(''); setEditing(true) }
  const save = async () => {
    setSaving(true); setError('')
    try {
      await updateMember({ id: member.id, windows: { ...memberWindows(member), [timeOfDay]: { start, end } } })
      setEditing(false)
    } catch (e) {
      setError(ERRORS[e.message] || e.message || 'לא הצלחתי לשמור')
    } finally {
      setSaving(false)
    }
  }

  // השעות עצמן הן הכפתור: לחיצה פותחת שינוי (עיפרון קטן מופיע במעבר עכבר)
  if (!editing) return (
    <button className="wb-window-range" onClick={open} title="שינוי השעות" aria-label={`שעות ${current.start} עד ${current.end}, שינוי`}>
      <span dir="ltr">{current.start}–{current.end}</span><Icon name="pencil" className="wb-window-pen" line />
    </button>
  )
  return (
    <div className="wb-window wb-window-edit" onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}>
      <input type="time" className="wb-input" value={start} onChange={e => setStart(e.target.value)} aria-label="התחלה" autoFocus />
      <span aria-hidden="true">–</span>
      <input type="time" className="wb-input" value={end} onChange={e => setEnd(e.target.value)} aria-label="סיום" />
      <button className="wb-delete wb-save" onClick={save} disabled={saving} aria-label="שמירה" title="שמירה">✓</button>
      <button className="wb-delete" onClick={() => setEditing(false)} disabled={saving} aria-label="ביטול" title="ביטול">✕</button>
      {error && <span className="sd-error" role="alert">{error}</span>}
    </div>
  )
}
