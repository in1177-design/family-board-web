import React, { useEffect, useRef, useState } from 'react'
import { guard } from '../shared/unsaved'
import { useStore } from '../../store'
import PointsManager from './PointsManager'
import Settings from './Settings'
import FamilyOverview from './FamilyOverview'
import WeeklySchedule from '../Schedule/WeeklySchedule'
import KidsToday from '../Schedule/KidsToday'
import RoutinesBoard from '../Routines/RoutinesBoard'
import StepForm from '../Routines/StepForm'
import MyDay from '../MyDay/MyDay'
import TodosBoard from '../MyDay/TodosBoard'
import TodoForm from '../MyDay/TodoForm'
import MemberHero, { AppBar } from '../shared/MemberHero'
import { memberPhoto } from '../shared/memberPhoto'
import DailyLeaderboard from '../Points/DailyLeaderboard'
import StyleGuide from '../Design/StyleGuide'

// החלטה 2026-10-07: ההגדרות, ההרגלים והמשימות עברו מהלשוניות לתפריט שבפס העליון.
// הסדר (המשתמשת, 2026-10-18): היום שלי, ילדים, מערכת שבועית, היכל תהילה. "סקירה" עברה לתפריט ☰, כי לא בשימוש.
// "מערכת שבועית" של ההורה עצמו, ו"ילדים" נפתח לרשימת הילדים. ParentCalendar (Google) נשאר בקוד עד ההחלטה על Google
const TABS = [
  { id: 'myday',     label: 'היום שלי', text: 'היום שלי', icon: 'sun' },
  { id: 'kids',      label: 'ילדים', text: 'ילדים', icon: 'smile' },
  { id: 'schedule',  label: 'מערכת שבועית', text: 'מערכת שבועית', icon: 'calendar' },
  { id: 'points',    label: '⭐ היכל תהילה', text: 'היכל תהילה', icon: 'star' }
]

// הלשוניות מתחת ל"ילדים" כשנבחר ילד (המשתמשת, 2026-10-18):
// "היום של [שם]": "היום שלי" של הילד, כמו שהוא רואה אותו. "עריכת הרגלים ומשימות": שני הלוחות באותו דף
const KID_TABS = [
  { id: 'day',      text: kid => 'היום של ' + kid.name },
  { id: 'edit',     text: () => 'עריכת הרגלים ומשימות' },
  { id: 'schedule', text: () => 'מערכת שעות' }
]

// היום לפי שעון ישראל
const israelToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date())

export default function ParentView() {
  const { loadTasks, members, logout, activeMemberId } = useStore()
  const [tab, setTab] = useState('myday')
  // מה נפתח מהתפריט, במקום הלשונית: 'routines', 'todos', 'settings',
  // או 'guide' (מדריך סגנון). מעבדת הסגנונות כדף נפרד הוסרה (2026-10-12): כל מה שבה נפתח מתוך המדריך
  const [opened, setOpened] = useState(null)
  // סיכום היום של ההורה עצמו, לאחוז ב-Hero. כשצופים ביום של ילד: אין
  const [summary, setSummary] = useState(null)
  // סגנון שנשלח מ"נסה במדריך" במעבדה, ומוחל רק על החלונות במדריך הסגנון. נמחק ברענון
  const [trial, setTrial] = useState(null)
  // "+ הוסף משימה" מהתפריט: חלון מודאלי מעל מה שפתוח (2026-10-08)
  const [addTodo, setAddTodo] = useState(false)
  // "+ הוסף הרגל" מהתפריט: גם חלון מודאלי
  const [addStep, setAddStep] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [])

  // ההורה שנבחר. אם אין, ההורה הראשון
  const parent = members.find(m => m.id === activeMemberId) || members.find(m => m.role === 'parent')

  // מעבר מסך עובר דרך guard: אם יש טיוטה שלא נשמרה, קודם שואלים (unsaved.js)
  const pickTab = (id) => guard(() => { setOpened(null); setTab(id) })

  // "ילדים" (המשתמשת, 2026-10-18): בתפריט "כל הילדים" (המערכת של היום, עמודה לכל ילד) ואז הילדים.
  // ילד שנבחר: המערכת המלאה שלו עם עריכה, ועל הלשונית התמונה והשם שלו במקום הסמיילי ו"ילדים"
  const kids = members.filter(m => m.role !== 'parent')
  const [kidId, setKidId] = useState(null)
  const kid = kids.find(m => m.id === kidId) || null
  const showKid = tab === 'kids' && !opened && kid
  // לשוניות הילד (המשתמשת, 2026-10-18): שורה מתחת ללשוניות הראשיות. נפתח קודם "היום של [שם]"
  const [kidTab, setKidTab] = useState('day')
  const pickKid = id => guard(() => { setOpened(null); setKidId(id); setTab('kids'); setKidTab('day') })
  const tabs = TABS.map(t => t.id !== 'kids' ? t : {
    ...t, text: showKid ? kid.name : t.text, face: showKid ? kid : null,
    menu: { members: kids, value: kid?.id ?? null, onSelect: pickKid, allLabel: 'כל הילדים' }
  })

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', overflow: 'hidden'
    }}>
      <AppBar tabs={tabs} current={opened || tab === 'overview' ? null : tab} onPick={pickTab} member={parent} />

      {/* Content: ה-Hero גולל יחד עם הדף, כמו אצל הילד */}
      <div className="pl-under-tabs" style={{ flex: 1, overflow: 'auto' }}>
      {parent && (
        <MemberHero
          member={parent}
          summary={summary}
          tabs={tabs} current={opened || tab === 'overview' ? null : tab} onPick={pickTab}
          end={<ParentMenu onPick={w => w === 'todo' ? setAddTodo(true) : w === 'step' ? setAddStep(true) : w === 'overview' ? pickTab('overview') : guard(() => setOpened(w))} onLogout={() => guard(logout)} />}
        />
      )}
      <div style={{ padding: '1.5rem' }}>
      <div className="parent-page">
        {opened === 'routines' && <RoutinesBoard />}
        {opened === 'todos'    && <TodosBoard />}
        {opened === 'settings' && <Settings />}
        {opened === 'guide'    && <StyleGuide trial={trial} onClearTrial={() => setTrial(null)} onTry={setTrial} />}

        {!opened && <>
          {tab === 'overview'  && <FamilyOverview />}
          {tab === 'schedule'  && parent && <WeeklySchedule key={parent.id} member={parent} canEdit />}
          {tab === 'kids'      && (kid ? <>
            <div className="pl pl-bare kid-tabs" role="tablist" aria-label={'הלוחות של ' + kid.name}>
              {KID_TABS.map(t => (
                <button key={t.id} role="tab" aria-selected={kidTab === t.id}
                  className={'kid-tab' + (kidTab === t.id ? ' kid-tab-on' : '')} onClick={() => guard(() => setKidTab(t.id))}>
                  {t.text(kid)}
                </button>
              ))}
            </div>
            {kidTab === 'day'      && <MyDay key={kid.id} memberId={kid.id} viewerId={activeMemberId} hideHero />}
            {kidTab === 'edit'     && <div className="kid-edit">
              <RoutinesBoard key={'r' + kid.id} fixedMemberId={kid.id} />
              <TodosBoard key={'t' + kid.id} fixedMemberId={kid.id} />
            </div>}
            {kidTab === 'schedule' && <WeeklySchedule key={kid.id} member={kid} canEdit />}
          </> : <KidsToday kids={kids} onPick={pickKid} />)}
          {tab === 'myday'     && activeMemberId && <MyDay key={activeMemberId} memberId={activeMemberId} viewerId={activeMemberId} hideHero onSummary={setSummary} />}
          {tab === 'points'    && <><DailyLeaderboard currentId={activeMemberId} /><PointsManager /></>}
        </>}
        {addStep && <StepForm onClose={() => setAddStep(false)} />}
        {addTodo && <TodoForm memberId={activeMemberId} byId={activeMemberId} today={israelToday()} onClose={() => setAddTodo(false)} />}
      </div>
      </div>
      </div>
    </div>
  )
}

// תפריט בפס העליון, במקום כפתור היציאה: הרגלים, משימות, הוסף הרגל, הוסף משימה, הגדרות, דפי העיצוב, ויציאה בסוף
function ParentMenu({ onPick, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // לחיצה מחוץ לתפריט סוגרת אותו
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const pick = (what) => { setOpen(false); onPick(what) }

  return (
    <div className="pl pl-bare pl-menu" ref={ref}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ color: '#fff', fontSize: '1.4rem' }}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="תפריט"
        title="תפריט"
      >
        ☰
      </button>
      {open && (
        <div className="pl-menu-list">
          <button onClick={() => pick('overview')}>🏠 סקירה</button>
          <button onClick={() => pick('routines')}>הרגלים</button>
          <button onClick={() => pick('todos')}>משימות</button>
          <button onClick={() => pick('step')}>+ הוסף הרגל</button>
          <button onClick={() => pick('todo')}>+ הוסף משימה</button>
          <button onClick={() => pick('settings')}>⚙️ הגדרות</button>
          <button onClick={() => pick('guide')}>📘 מדריך סגנון</button>
          <button onClick={() => { setOpen(false); onLogout() }}>🚪 יציאה</button>
        </div>
      )}
    </div>
  )
}
