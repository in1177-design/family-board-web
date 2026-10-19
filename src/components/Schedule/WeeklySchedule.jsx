import React, { useEffect, useRef, useState } from 'react'
import { api } from '../../store'
import PixelCard from '../shared/PixelCard'
import { useNarrow } from '../MyDay/MyDay'
import ScheduleEditor from './ScheduleEditor'
import ScheduleItemModal from './ScheduleItemModal'
import ScheduleUpload from './ScheduleUpload'
import ScheduleDraftBar, { DraftActions } from './ScheduleDraftBar'
import { buildWeek } from './week'
import { LessonsGrid, ActivitiesGrid } from './ScheduleGrid'
import { subjectStyle, subjectVars } from './subjects'
import Icon from '../shared/Icon'
import { setUnsaved, clearUnsaved } from '../shared/unsaved'
import Modal from '../shared/Modal'
import EditMenu from './EditMenu'

// מערכת שעות שבועית (החלטה 2026-10-12): במקום היומן. תבנית קבועה לפי יום בשבוע, בלי תאריכים ולא קשורה ל-Google.
// שתי רשתות כרטיסים באותן עמודות (ScheduleGrid.jsx, לפי העיצוב של המשתמשת מ-2026-10-13): השיעורים, ומתחת "חוגים".
// השעות מחושבות בשרת (week, מ-lib/schedule.js). בטלפון: יום אחד עם בורר ימים, ו"כל השבוע" פותח את הטבלאות.
// canEdit: לכל טבלה כפתור "עריכה". במצב עריכה כל תא לחיץ, ונפתח חלון לשם, שעה וצבע (ScheduleItemModal).
// תא ריק בטבלת השיעורים מוסיף שיעור. מערכת הצלצולים: "צלצולים" בעריכת השיעורים (ScheduleEditor)
// הכנסת מערכת (פרוסה ב2, 2026-10-18): לילד בלי מערכת, שתי בחירות: העלאת תמונה או קובץ (ScheduleUpload), או הכנסה ידנית (ScheduleEditor).
// לילד עם מערכת: "העלאה" בשורת הכלים.
// הטיוטה מהתמונה מוצגת במערכת עצמה, במצב עריכה, עם פס "טיוטה" למעלה (המשתמשת, 2026-10-18: לא אהבה את העורך כמסך אישור).
// השינויים בטיוטה נשמרים בעותק מקומי (draftOps), ורק "שמירת המערכת" כותבת לשרת
export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
export const DAY_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

// היום בשבוע לפי שעון ישראל (0 = ראשון)
const israelWeekday = () => {
  const name = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' })
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name)
}

const hasContent = (d) => d.lessons.length > 0 || d.activities.length > 0
const range = (start, end) => start ? (end ? `${start}–${end}` : start) : ''
// הצבע של שיעור או חוג (subjects.js): לאייקון המספר בתצוגת יום
const tint = (item) => { const st = subjectStyle(item); return { ...subjectVars(st), background: st.color, color: st.ink } }

let draftId = 0
const newDraftId = () => 'draft-' + (++draftId)
// פריט לשמירה בשרת: רק השדות של הטבלה
const forSave = ({ kind, weekday, period, start_time, end_time, title, teacher, location, color, icon }) => ({
  kind, weekday, period: period ?? null, start_time: start_time || null, end_time: end_time || null,
  title, teacher: teacher || null, location: location || null, ...(color ? { color } : {}), ...(icon ? { icon } : {})
})
const SAVE_ERRORS = {
  bad_time: 'יש שעה לא תקינה, או שעת סיום לפני ההתחלה.',
  bad_period: 'יש מספר שיעור לא תקין.',
  missing_title: 'יש שיעור או חוג בלי שם.',
  lesson_needs_period_or_time: 'יש שיעור בלי מספר ובלי שעה.',
  activity_needs_time: 'יש חוג בלי שעה.'
}

// tabs: בחירת הילד אצל ההורה. מוצגת בשורה אחת עם כפתורי ההוספה והעריכה
export default function WeeklySchedule({ member, canEdit, tabs }) {
  const narrow = useNarrow()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState(israelWeekday)
  const [all, setAll] = useState(false)
  const [editLessons, setEditLessons] = useState(false)
  const [editActivities, setEditActivities] = useState(false)
  const [modalItem, setModalItem] = useState(null)
  const [bells, setBells] = useState(false)
  const [upload, setUpload] = useState(false)
  // "+ הוספת חוגים": חלון בחירה בין תמונה או קובץ להכנסה ידנית (טרמינולוגיה, 2026-10-18)
  const [addChoice, setAddChoice] = useState(false)
  // טיוטה מתמונה: { items, periods, warnings, readItems, readPeriods }. items עם id זמני
  const [draft, setDraft] = useState(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftError, setDraftError] = useState('')

  const load = () => api.schedule.get(member.id)
    .then(d => { setData(d); setError('') })
    .catch(e => setError('לא הצלחתי לטעון את המערכת. ' + (e.message || '')))
  useEffect(() => { setData(null); setDraft(null); setEditLessons(false); setEditActivities(false); load() }, [member.id])

  // טיוטה שלא נשמרה (2026-10-18): כל מעבר מסך שואל קודם (UnsavedPrompt), ורענון או סגירה של הדפדפן מקבלים אזהרה.
  // draftActions: הפעולות העדכניות (saveDraft משתנה בכל ציור)
  const draftActions = useRef(null)
  useEffect(() => {
    if (!draft) return
    const entry = { save: () => draftActions.current.save(), discard: () => draftActions.current.discard() }
    setUnsaved(entry)
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => { clearUnsaved(entry); window.removeEventListener('beforeunload', warn) }
  }, [!!draft])

  // בחירת הילד נשארת גם בזמן הטעינה, כדי שהשורה לא תקפוץ
  const pending = (text) => (
    <div className="pl pl-schedule" style={{ maxWidth: 'var(--pl-page-max)', margin: '0 auto' }}>
      {tabs && <div className="sg-top">{tabs}</div>}
      <p className="pl-muted">{text}</p>
    </div>
  )
  if (error) return pending(error)
  if (!data) return pending('טוען...')

  // טיוטה: מה שנקרא מחליף את הקיים, רק אם נקרא (תמונה של צלצולים בלבד לא מוחקת שיעורים).
  // חוגים בלבד (upload === 'activities'): החוגים החדשים מתווספים לכל מה שיש, וחוג שכבר קיים (אותו שם, יום ושעה) לא נכפל
  const startDraft = (d) => {
    const scope = upload === 'activities' ? 'activities' : 'all'
    setUpload(false)
    setDraftError('')
    if (scope === 'activities') {
      const key = (i) => [i.title.trim(), i.weekday, i.start_time].join('|')
      const have = new Set(data.items.filter(i => i.kind === 'activity').map(key))
      const added = d.items.filter(i => i.kind === 'activity' && !have.has(key(i))).map(i => ({ ...i, id: newDraftId() }))
      setDraft({ scope, items: [...data.items, ...added], periods: data.periods, warnings: d.warnings, readItems: added.length, readPeriods: 0 })
      setTimeout(() => document.querySelector('.sg-frame-activities, .sg-activities-day')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      return
    }
    setDraft({
      scope,
      items: d.items.length ? d.items.map(i => ({ ...i, id: newDraftId() })) : data.items,
      periods: d.periods.length ? d.periods : data.periods,
      warnings: d.warnings, readItems: d.items.length, readPeriods: d.periods.length
    })
  }
  const draftOps = {
    create: ({ member_id, ...body }) => { setDraft(dr => ({ ...dr, items: [...dr.items, { ...body, id: newDraftId() }] })); return Promise.resolve() },
    update: ({ id, ...body }) => { setDraft(dr => ({ ...dr, items: dr.items.map(i => i.id === id ? { ...i, ...body } : i) })); return Promise.resolve() },
    delete: (id) => { setDraft(dr => ({ ...dr, items: dr.items.filter(i => i.id !== id) })); return Promise.resolve() }
  }
  const saveDraft = async () => {
    setSavingDraft(true)
    setDraftError('')
    try {
      if (draft.readPeriods) {
        await api.schedule.setPeriods({ memberId: member.id, periods: draft.periods.map(({ period, start_time, end_time }) => ({ period, start_time, end_time })) })
      }
      await api.schedule.replace({ memberId: member.id, items: draft.items.map(forSave) })
      setDraft(null)
      load()
      return true
    } catch (e) {
      setDraftError(SAVE_ERRORS[e.message] || 'לא הצלחתי לשמור. ' + (e.message || ''))
      return false
    } finally {
      setSavingDraft(false)
    }
  }
  const cancelDraft = () => { if (confirm('לבטל את הטיוטה? שום דבר לא יישמר.')) setDraft(null) }
  draftActions.current = { save: saveDraft, discard: () => setDraft(null) }

  // מה שמוצג: הטיוטה, או המערכת מהשרת
  const view = draft ? { items: draft.items, periods: draft.periods, week: buildWeek(draft.items, draft.periods) } : data
  const editL = !!draft || editLessons
  const editA = !!draft || editActivities
  const flagged = draft && new Set(draft.warnings.filter(w => w.weekday != null && w.period != null).map(w => w.weekday + '|' + w.period))

  const today = israelWeekday()
  // א׳–ו׳ תמיד, שבת רק אם יש בה משהו
  const days = view.week.filter(d => d.weekday < 6 || hasContent(d))
  const noLessons = !days.some(d => d.lessons.length)
  const noActivities = !days.some(d => d.activities.length)
  const oneDay = narrow && !all
  const empty = canEdit && !draft && noLessons && noActivities && !data.periods.length
  const manual = () => { setUpload(false); setBells(true) }
  const shown = oneDay ? days.filter(d => d.weekday === picked) : days
  // פריט מהשרת (עם start/end מחושבים) לחלון: רק השדות של הפריט עצמו
  const open = (item) => setModalItem(view.items.find(i => i.id === item.id) || item)

  const editButton = (on, set, label) => canEdit && (
    <button className={'sg-btn' + (on ? ' sg-btn-on' : '')} aria-pressed={on} onClick={() => set(v => !v)}>
      {on ? 'סיום ' + label : label}
    </button>
  )
  const weekToggle = narrow && (
    <button className="sg-btn" aria-pressed={all} onClick={() => setAll(v => !v)}>{all ? 'יום אחד' : 'כל השבוע'}</button>
  )
  const addLesson = (weekday, period) => setModalItem({ kind: 'lesson', weekday, period })
  const lessonsActions = weekToggle && <div className="sg-actions">{weekToggle}</div>
  const addActivity = () => setModalItem({ kind: 'activity', weekday: oneDay ? picked : today < 6 ? today : 0 })
  // חוגים (טרמינולוגיה, 2026-10-18): "+ הוספת חוגים" פותח בחירה בין תמונה לידני, ו"עריכת חוגים" משנה חוג קיים.
  // בטיוטה: רק הוספה ידנית ("+ חוג"), כי כבר באמצע קריאה מתמונה
  // הכפתורים בשורה העליונה, בצד שמאל, מול בחירת הילד (2026-10-18). כפתור "עריכה" אחד עם תפריט
  // (המשתמשת, 2026-10-18): מערכת בית הספר (קובץ חדש או ידנית) וחוגים (מתמונה או ידנית).
  // עריכה ידנית מפעילה את מצב העריכה של אותו חלק, ובו "צלצולים" או "+ חוג" ו"סיום עריכה"
  const startEdit = (lessons) => { setEditLessons(lessons); setEditActivities(!lessons) }
  const menuGroups = [
    { title: 'מערכת בית הספר', items: [
      { label: 'העלאת קובץ חדש', hint: 'צילום או PDF. מחליף את המערכת אחרי בדיקה', onPick: () => setUpload('all') },
      { label: 'עריכה ידנית', hint: 'שיעורים, מורים וצלצולים', onPick: () => startEdit(true) }
    ] },
    { title: 'חוגים', items: [
      { label: 'הוספה מתמונה או קובץ', hint: 'החוגים נוספים לקיימים', onPick: () => setUpload('activities') },
      { label: 'עריכה ידנית', hint: 'הוספה, שינוי ומחיקה של חוגים', onPick: () => startEdit(false) }
    ] }
  ]
  const topActions = canEdit && !empty && (
    <div className="sg-actions">
      {(draft || editActivities) && <button className="sg-btn" onClick={addActivity}>+ חוג</button>}
      {!draft && editLessons && <button className="sg-btn" onClick={() => setBells(true)}>צלצולים</button>}
      {!draft && editLessons && editButton(true, setEditLessons, 'עריכת מערכת')}
      {!draft && editActivities && editButton(true, setEditActivities, 'עריכת חוגים')}
      {!draft && !editLessons && !editActivities && <EditMenu groups={menuGroups} />}
    </div>
  )
  const top = (tabs || topActions) && <div className="sg-top">{tabs}{topActions}</div>

  // בלי הכותרת "מערכת שבועית" (המשתמשת, 2026-10-13). המקרא וכפתורי העריכה בשורה אחת בתוך המסגרת, מעל הלוח
  const modals = <>
    {modalItem && <ScheduleItemModal member={member} item={modalItem} items={view.items} periods={view.periods} onClose={() => setModalItem(null)}
      onSaved={draft ? () => {} : load} {...(draft ? { ops: draftOps } : {})} />}
    {upload && <ScheduleUpload member={member} scope={upload} onClose={() => setUpload(false)}
      onManual={upload === 'activities' ? () => { setUpload(false); addActivity() } : manual} onDraft={startDraft} />}
    {bells && <ScheduleEditor member={member} data={data} onClose={() => setBells(false)} onSaved={load} />}
    {addChoice && (
      <Modal title={'הוספת חוגים ל' + member.name} onClose={() => setAddChoice(false)}>
        <div className="su-choices">
          <button className="su-choice" onClick={() => { setAddChoice(false); setUpload('activities') }}>
            <Icon name="camera" className="su-choice-icon" />
            <strong>מתמונה או קובץ</strong>
            <span className="pl-muted">לוח חוגים או אימונים. החוגים נקראים מהתמונה, ובודקים אותם לפני השמירה.</span>
          </button>
          <button className="su-choice" onClick={() => { setAddChoice(false); addActivity() }}>
            <Icon name="pencil" className="su-choice-icon" />
            <strong>הכנסה ידנית</strong>
            <span className="pl-muted">חוג אחד: שם, יום ושעה.</span>
          </button>
        </div>
      </Modal>
    )}
  </>

  if (empty) {
    return (
      <div className="pl pl-schedule" style={{ maxWidth: 'var(--pl-page-max)', margin: '0 auto' }}>
        {top}
        <section className="sg-frame su-empty">
          <strong className="sg-title">עוד אין מערכת שעות ל{member.name}</strong>
          <div className="su-choices">
            <button className="su-choice" onClick={() => setUpload('all')}>
              <Icon name="camera" className="su-choice-icon" />
              <strong>העלאת תמונה או קובץ</strong>
              <span className="pl-muted">צילום או PDF של המערכת, ואפשר גם של הצלצולים. בודקים ומתקנים לפני השמירה.</span>
            </button>
            <button className="su-choice" onClick={manual}>
              <Icon name="pencil" className="su-choice-icon" />
              <strong>הכנסה ידנית</strong>
              <span className="pl-muted">צלצולים, שיעורים וחוגים לפי יום.</span>
            </button>
          </div>
        </section>
        {modals}
      </div>
    )
  }

  return (
    <div className={'pl pl-schedule' + (draft ? ' pl-schedule-draft' : '')} style={{ maxWidth: 'var(--pl-page-max)', margin: '0 auto' }}>
      {top}
      {draft && <ScheduleDraftBar draft={draft} replacing={draft.scope === 'all' && data.items.length > 0 && draft.readItems > 0} />}
      {oneDay ? <>
        {lessonsActions && <div className="sg-toolbar sg-toolbar-bare">{lessonsActions}</div>}
        <div className="pl-row pl-schedule-days" role="tablist" aria-label="יום בשבוע">
          {days.map(d => (
            <button key={d.weekday} role="tab" aria-selected={picked === d.weekday}
              className={'pl-slot' + (picked === d.weekday ? ' pl-slot-on' : '') + (d.weekday === today ? ' pl-schedule-today' : '')}
              onClick={() => setPicked(d.weekday)}>
              {DAY_SHORT[d.weekday]}
            </button>
          ))}
        </div>
        {editL && !draft && <p className="pl-muted pl-schedule-hint">לחיצה על שיעור משנה אותו.</p>}
        {shown.map(d => <DayLessons key={d.weekday} day={d} isToday={d.weekday === today} editing={editL} onPick={open}
          onAdd={() => addLesson(d.weekday, Math.max(0, ...d.lessons.map(l => l.period || 0)) + 1)} />)}
      </> : (
        <section className="sg-frame">
          {lessonsActions && <div className="sg-toolbar">{lessonsActions}</div>}
          {editL && !draft && <p className="pl-muted pl-schedule-hint">לחיצה על שיעור משנה אותו. לחיצה על תא ריק מוסיפה שיעור.</p>}
          {noLessons && !editL
            ? <p className="pl-muted">עוד אין שיעורים{canEdit ? '. אפשר להוסיף ב"עריכת מערכת".' : '.'}</p>
            : <LessonsGrid days={days} periods={view.periods} today={today} editing={editL} onPick={open} onAdd={addLesson} flagged={flagged} />}
        </section>
      )}

      <section className={oneDay ? 'sg-activities-day' : 'sg-frame sg-frame-activities'}>
        <div className={'sg-toolbar' + (oneDay ? ' sg-toolbar-bare' : '')}><strong className="sg-title">חוגים</strong></div>
        {editA && !draft && <p className="pl-muted pl-schedule-hint">לחיצה על חוג משנה את השם, השעה או הצבע.</p>}
        {noActivities
          ? canEdit && !draft
            ? <div className="sg-empty-actions">
                <span className="pl-muted">עוד אין חוגים.</span>
                <button className="pl-link" onClick={() => setAddChoice(true)}>+ הוספת חוגים</button>
              </div>
            : <p className="pl-muted">אין חוגים.</p>
          : oneDay
            ? shown.map(d => <DayActivities key={d.weekday} day={d} editing={editA} onPick={open} />)
            : <ActivitiesGrid days={days} editing={editA} onPick={open} />}
      </section>

      {draft && <DraftActions draft={draft} saving={savingDraft} error={draftError} onSave={saveDraft} onCancel={cancelDraft} />}
      {modals}
    </div>
  )
}

// תוכן של תא: במצב עריכה כפתור שממלא את התא, אחרת טקסט
function Pickable({ editing, onClick, label, children, className = '' }) {
  if (!editing) return <div className={className}>{children}</div>
  return <button className={'pl-schedule-pick ' + className} onClick={onClick} aria-label={label}>{children}</button>
}

// בטלפון: השיעורים של יום אחד
function DayLessons({ day, isToday, editing, onPick, onAdd }) {
  return (
    <PixelCard className={'pl-schedule-day' + (isToday ? ' pl-schedule-day-today' : '')}>
      <div className="pl-schedule-day-head">
        <strong>{DAY_NAMES[day.weekday]}</strong>
        {isToday && <span className="pl-chip pl-chip-accent">היום</span>}
      </div>
      {day.school && <div className="pl-schedule-school">בית ספר <span className="pl-schedule-range">{range(day.school.start, day.school.end)}</span></div>}
      {!day.lessons.length && <p className="pl-muted">אין לימודים</p>}
      {day.lessons.length > 0 && (
        <ol className="pl-schedule-list">
          {day.lessons.map(l => (
            <li key={l.id}>
              <Pickable editing={editing} onClick={() => onPick(l)} label={`עריכת ${l.title}`} className="pl-schedule-item">
                <span className="pl-schedule-num" style={tint(l)}>{l.period ?? '·'}</span>
                <span className="pl-schedule-title">{l.title}{l.icon && <Icon name={l.icon} className="pl-schedule-item-icon" />}</span>
                <span className="pl-schedule-time">{range(l.start, l.end)}</span>
              </Pickable>
            </li>
          ))}
        </ol>
      )}
      {editing && <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={onAdd}>+ שיעור</button>}
    </PixelCard>
  )
}

// בטלפון: החוגים של יום אחד
function DayActivities({ day, editing, onPick }) {
  return (
    <PixelCard className="pl-schedule-day">
      {!day.activities.length && <p className="pl-muted">אין חוגים ביום {DAY_NAMES[day.weekday]}</p>}
      {day.activities.length > 0 && (
        <ul className="pl-schedule-list pl-schedule-activities">
          {day.activities.map(a => (
            <li key={a.id}>
              <Pickable editing={editing} onClick={() => onPick(a)} label={`עריכת ${a.title}`} className="pl-schedule-item pl-schedule-activity">
                <span className="pl-schedule-num" aria-hidden="true" style={tint(a)}>★</span>
                <span className="pl-schedule-title">{a.title}{a.icon && <Icon name={a.icon} className="pl-schedule-item-icon" />}</span>
                <span className="pl-schedule-time">{range(a.start, a.end)}</span>
              </Pickable>
            </li>
          ))}
        </ul>
      )}
    </PixelCard>
  )
}
