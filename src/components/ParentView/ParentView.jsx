import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'
import TaskManager from './TaskManager'
import PointsManager from './PointsManager'
import Settings from './Settings'
import FamilyOverview from './FamilyOverview'
import ParentCalendar from './ParentCalendar'

const TABS = [
  { id: 'overview',  label: '🏠 סקירה' },
  { id: 'calendar',  label: '📅 יומן' },
  { id: 'tasks',     label: '📝 משימות' },
  { id: 'points',    label: '⭐ נקודות' },
  { id: 'settings',  label: '⚙️ הגדרות' }
]

export default function ParentView() {
  const { setActiveView, loadTasks, members, logout } = useStore()
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    loadTasks()
  }, [])

  const kids = members.filter(m => m.role === 'child')

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,.3)'
      }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'rgba(255,255,255,.7)' }}
          onClick={() => setActiveView('home')}
        >
          ← חזרה
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ fontSize: '1.8rem' }}>👑</span>
          <div>
            <h2 style={{ color: '#fff', margin: 0 }}>פאנל ניהול</h2>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.82rem' }}>
              {kids.length} ילדים | {members.length} בני משפחה
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'rgba(255,255,255,.5)', fontSize: '.8rem' }}
          onClick={logout}
          title="יציאה"
        >
          🚪 יציאה
        </button>
      </header>

      {/* Tab bar */}
      <nav style={{
        display: 'flex', padding: '.6rem 1rem', gap: '.4rem',
        background: 'var(--surface)', borderBottom: '2px solid var(--border)',
        overflowX: 'auto'
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className="btn"
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, fontSize: '.9rem', fontWeight: 700, whiteSpace: 'nowrap',
              background: tab === t.id ? 'var(--purple)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-2)',
              borderRadius: 'var(--r)',
              boxShadow: tab === t.id ? '0 4px 12px rgba(108,99,255,.4)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        {tab === 'overview'  && <FamilyOverview />}
        {tab === 'calendar'  && <ParentCalendar />}
        {tab === 'tasks'     && <TaskManager />}
        {tab === 'points'    && <PointsManager />}
        {tab === 'settings'  && <Settings />}
      </div>
    </div>
  )
}
