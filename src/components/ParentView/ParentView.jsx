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
import MemberHero from '../shared/MemberHero'
import { memberPhoto } from '../shared/memberPhoto'
import DailyLeaderboard from '../Points/DailyLeaderboard'

// החלטה 2026-10-07: ההגדרות, ההרגלים והמשימות עברו מהלשוניות לתפריט שבפס העליון
const TABS = [
  { id: 'overview',  label: '🏠 סקירה' },
  { id: 'calendar',  label: '📅 יומן' },
  { id: 'myday',     label: 'היום שלי' },
  { id: 'points',    label: '⭐ ניקוד' }
]

// היום לפי שעון ישראל
const israelToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date())

export default function ParentView() {
  const { loadTasks, members, logout, activeMemberId } = useStore()
  const [tab, setTab] = useState('overview')
  // מה נפתח מהתפריט, במקום הלשונית: 'routines', 'todos', 'step' (הרגל חדש), 'todo' (משימה חדשה) או 'settings'
  const [opened, setOpened] = useState(null)

  useEffect(() => {
    loadTasks()
  }, [])

  // ההורה שנבחר. אם אין, ההורה הראשון
  const parent = members.find(m => m.id === activeMemberId) || members.find(m => m.role === 'parent')

  const pickTab = (id) => { setOpened(null); setTab(id) }
  const close = () => setOpened(null)

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', overflow: 'hidden'
    }}>
      {parent && (
        <MemberHero
          member={parent}
          end={<ParentMenu onPick={setOpened} onLogout={logout} />}
        />
      )}

      {/* Tab bar */}
      <nav style={{
        display: 'flex', padding: '.6rem 1rem', gap: '.4rem',
        background: 'var(--surface)', borderBottom: '2px solid var(--border)',
        overflowX: 'auto'
      }}>
        {TABS.map(t => {
          const on = !opened && tab === t.id
          return (
            <button
              key={t.id}
              className="btn"
              onClick={() => pickTab(t.id)}
              style={{
                flex: 1, fontSize: '.9rem', fontWeight: 700, whiteSpace: 'nowrap',
                background: on ? 'var(--purple)' : 'transparent',
                color: on ? '#fff' : 'var(--text-2)',
                borderRadius: 'var(--r)',
                boxShadow: on ? '0 4px 12px rgba(108,99,255,.4)' : 'none',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </nav>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        {opened === 'routines' && <RoutinesBoard />}
        {opened === 'todos'    && <TodosBoard />}
        {opened === 'settings' && <Settings />}
        {opened === 'step'     && <StepForm onClose={close} />}
        {opened === 'todo'     && <TodoForm memberId={activeMemberId} byId={activeMemberId} today={israelToday()} onClose={close} />}

        {!opened && <>
          {tab === 'overview'  && <FamilyOverview />}
          {tab === 'calendar'  && <ParentCalendar />}
          {tab === 'myday'     && activeMemberId && <DayOf viewerId={activeMemberId} />}
          {tab === 'points'    && <><DailyLeaderboard currentId={activeMemberId} /><PointsManager /></>}
        </>}
      </div>
    </div>
  )
}

// "היום שלי" בפאנל ההורים, עם בורר של כל בני המשפחה (החלטה 2026-10-07):
// ההורה רואה את היום של כל ילד בלי לצאת מהפאנל. ברירת המחדל: היום של ההורה עצמו
function DayOf({ viewerId }) {
  const { members } = useStore()
  const [memberId, setMemberId] = useState(viewerId)

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
      <MyDay key={memberId} memberId={memberId} viewerId={viewerId} hideHero />
    </>
  )
}

// תפריט בפס העליון, במקום כפתור היציאה: הרגלים, משימות, הוסף הרגל, הוסף משימה, הגדרות, ויציאה בסוף
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
          <button onClick={() => { setOpen(false); onLogout() }}>🚪 יציאה</button>
        </div>
      )}
    </div>
  )
}
