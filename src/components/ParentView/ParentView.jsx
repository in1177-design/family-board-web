import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store'
import PointsManager from './PointsManager'
import Settings from './Settings'
import FamilyOverview from './FamilyOverview'
import ParentCalendar from './ParentCalendar'
import RoutinesBoard from '../Routines/RoutinesBoard'
import StepForm from '../Routines/StepForm'
import MyDay from '../MyDay/MyDay'
import TodosBoard from '../MyDay/TodosBoard'
import TodoForm from '../MyDay/TodoForm'
import MemberHero, { AppBar, DaySummary } from '../shared/MemberHero'
import { memberPhoto } from '../shared/memberPhoto'
import DailyLeaderboard from '../Points/DailyLeaderboard'
import StyleLab from '../Design/StyleLab'
import StyleGuide from '../Design/StyleGuide'

// החלטה 2026-10-07: ההגדרות, ההרגלים והמשימות עברו מהלשוניות לתפריט שבפס העליון
const TABS = [
  { id: 'overview',  label: '🏠 סקירה',  text: 'סקירה',    icon: 'home' },
  { id: 'calendar',  label: '📅 יומן',   text: 'יומן',     icon: 'calendar' },
  { id: 'myday',     label: 'היום שלי', text: 'היום שלי', icon: 'sun' },
  { id: 'points',    label: '⭐ ניקוד',  text: 'ניקוד',    icon: 'star' }
]

// היום לפי שעון ישראל
const israelToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date())

export default function ParentView() {
  const { loadTasks, members, logout, activeMemberId } = useStore()
  const [tab, setTab] = useState('overview')
  // מה נפתח מהתפריט, במקום הלשונית: 'routines', 'todos', 'settings',
  // 'lab' (מעבדת סגנונות) או 'guide' (מדריך סגנון)
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

  const pickTab = (id) => { setOpened(null); setTab(id) }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', overflow: 'hidden'
    }}>
      <AppBar tabs={TABS} current={opened ? null : tab} onPick={pickTab} />

      {/* Content: ה-Hero גולל יחד עם הדף, כמו אצל הילד */}
      <div className="pl-under-tabs" style={{ flex: 1, overflow: 'auto' }}>
      {parent && (
        <MemberHero
          member={parent}
          summary={!opened && tab === 'myday' ? summary : null}
          end={<ParentMenu onPick={w => w === 'todo' ? setAddTodo(true) : w === 'step' ? setAddStep(true) : setOpened(w)} onLogout={logout} />}
        />
      )}
      <div style={{ padding: '1.5rem' }}>
        {opened === 'routines' && <RoutinesBoard />}
        {opened === 'todos'    && <TodosBoard />}
        {opened === 'settings' && <Settings />}
        {opened === 'lab'      && <StyleLab onTry={t => { setTrial(t); setOpened('guide') }} />}
        {opened === 'guide'    && <StyleGuide trial={trial} onClearTrial={() => setTrial(null)} onTry={setTrial} />}

        {!opened && <>
          {tab === 'overview'  && <FamilyOverview />}
          {tab === 'calendar'  && <ParentCalendar />}
          {tab === 'myday'     && activeMemberId && <DayOf viewerId={activeMemberId} summary={summary} onSummary={setSummary} />}
          {tab === 'points'    && <><DailyLeaderboard currentId={activeMemberId} /><PointsManager /></>}
        </>}
        {addStep && <StepForm onClose={() => setAddStep(false)} />}
        {addTodo && <TodoForm memberId={activeMemberId} byId={activeMemberId} today={israelToday()} onClose={() => setAddTodo(false)} />}
      </div>
      </div>
    </div>
  )
}

// "היום שלי" בפאנל ההורים, עם בורר של כל בני המשפחה (החלטה 2026-10-07):
// ההורה רואה את היום של כל ילד בלי לצאת מהפאנל. ברירת המחדל: היום של ההורה עצמו
function DayOf({ viewerId, summary, onSummary }) {
  const { members } = useStore()
  const [memberId, setMemberId] = useState(viewerId)
  const own = memberId === viewerId
  useEffect(() => { if (!own) onSummary(null) }, [own, onSummary])

  return (
    <>
      <div className="pl pl-bare pl-row" style={{ justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {members.map(m => (
          <button
            key={m.id}
            className={'pl-switcher-item' + (m.id === memberId ? ' pl-switcher-current' : '')}
            onClick={() => setMemberId(m.id)}
          >
            {memberPhoto(m) && <img className="pl-switcher-photo" src={memberPhoto(m)} alt="" />}
            {m.name}
          </button>
        ))}
      </div>
      {/* key: יום חדש לכל בן משפחה, בלי טפסים פתוחים מהקודם */}
      {own && <DaySummary summary={summary} />}
      <MyDay key={memberId} memberId={memberId} viewerId={viewerId} hideHero onSummary={own ? onSummary : undefined} />
    </>
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
          <button onClick={() => pick('routines')}>הרגלים</button>
          <button onClick={() => pick('todos')}>משימות</button>
          <button onClick={() => pick('step')}>+ הוסף הרגל</button>
          <button onClick={() => pick('todo')}>+ הוסף משימה</button>
          <button onClick={() => pick('settings')}>⚙️ הגדרות</button>
          <button onClick={() => pick('lab')}>🧪 מעבדת סגנונות</button>
          <button onClick={() => pick('guide')}>📘 מדריך סגנון</button>
          <button onClick={() => { setOpen(false); onLogout() }}>🚪 יציאה</button>
        </div>
      )}
    </div>
  )
}
