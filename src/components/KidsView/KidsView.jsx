import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'
import WeeklyCalendar from './WeeklyCalendar'
import TaskList from './TaskList'
import PointsDisplay from './PointsDisplay'

const TABS = [
  { id: 'tasks',    label: '✅ משימות',   emoji: '✅' },
  { id: 'calendar', label: '📅 יומן',     emoji: '📅' },
  { id: 'points',   label: '⭐ נקודות',   emoji: '⭐' }
]

export default function KidsView() {
  const { getActiveMember, setActiveView, activeMemberId, loadTasks, loadCalendarEvents, members } = useStore()
  const member = getActiveMember()
  const [tab, setTab] = useState('tasks')

  useEffect(() => {
    if (activeMemberId) loadTasks(activeMemberId)
  }, [activeMemberId])

  useEffect(() => {
    if (member?.google_calendar_id && activeMemberId) {
      const now = new Date()
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      loadCalendarEvents(activeMemberId, member.google_calendar_id, now.toISOString(), end.toISOString())
    }
  }, [member?.google_calendar_id, activeMemberId])

  if (!member) return null

  const bg = member.color + '18'
  const border = member.color + '44'

  return (
    <div style={{
      height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: `linear-gradient(160deg, ${member.color}22 0%, var(--bg) 60%)`,
      overflow: 'hidden'
    }}>
      {/* ── Header ── */}
      <header style={{
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: member.color,
        boxShadow: `0 4px 20px ${member.color}55`
      }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: '#fff' }}
          onClick={() => setActiveView('home')}
        >
          ← חזרה
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ fontSize: '2rem' }}>{member.avatar}</span>
          <div>
            <h2 style={{ color: '#fff', margin: 0 }}>{member.name}</h2>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: '.85rem' }}>
              ⭐ {member.points} נקודות
            </div>
          </div>
        </div>

        {/* Points pill */}
        <div style={{
          background: 'rgba(255,255,255,.25)', borderRadius: 'var(--r-full)',
          padding: '.4rem 1rem', color: '#fff', fontWeight: 700, fontSize: '1rem'
        }}>
          🏆 {member.points}
        </div>
      </header>

      {/* ── Tab bar ── */}
      <nav style={{
        display: 'flex', padding: '.75rem 1rem', gap: '.5rem',
        background: 'var(--surface)', borderBottom: '2px solid var(--border)'
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className="btn"
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, fontSize: '1rem', fontWeight: 700,
              background: tab === t.id ? member.color : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-2)',
              borderRadius: 'var(--r)',
              boxShadow: tab === t.id ? `0 4px 12px ${member.color}55` : 'none',
              transition: 'all .2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
        {tab === 'tasks'    && <TaskList member={member} />}
        {tab === 'calendar' && <WeeklyCalendar member={member} />}
        {tab === 'points'   && <PointsDisplay member={member} />}
      </div>
    </div>
  )
}
