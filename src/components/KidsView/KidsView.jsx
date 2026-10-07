import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'
import WeeklyCalendar from './WeeklyCalendar'
import PointsDisplay from './PointsDisplay'
import MyDay from '../MyDay/MyDay'
import MemberHero from '../shared/MemberHero'
import DailyLeaderboard from '../Points/DailyLeaderboard'

const TABS = [
  { id: 'myday',    label: 'היום שלי' },
  { id: 'calendar', label: '📅 יומן',     emoji: '📅' },
  { id: 'points',   label: '⭐ ניקוד',    emoji: '⭐' }
]

export default function KidsView() {
  const { getActiveMember, activeMemberId, loadTasks, loadCalendarEvents } = useStore()
  const member = getActiveMember()
  const [tab, setTab] = useState('myday')

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

  return (
    <div style={{
      height: '100%',
      display: 'flex', flexDirection: 'column',
      background: `linear-gradient(160deg, ${member.color}22 0%, var(--bg) 60%)`,
      overflow: 'hidden'
    }}>
      <MemberHero member={member} />

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
        {tab === 'myday'    && <MyDay memberId={member.id} hideHero />}
        {tab === 'calendar' && <WeeklyCalendar member={member} />}
        {tab === 'points'   && <><DailyLeaderboard currentId={member.id} /><PointsDisplay member={member} /></>}
      </div>
    </div>
  )
}
