import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'
import WeeklyCalendar from './WeeklyCalendar'
import PointsDisplay from './PointsDisplay'
import MyDay from '../MyDay/MyDay'
import { memberPhoto } from '../shared/memberPhoto'

const TABS = [
  { id: 'myday',    label: 'היום שלי' },
  { id: 'calendar', label: '📅 יומן',     emoji: '📅' },
  { id: 'points',   label: '⭐ נקודות',   emoji: '⭐' }
]

export default function KidsView() {
  const { getActiveMember, setActiveView, activeMemberId, loadTasks, loadCalendarEvents, members } = useStore()
  const member = getActiveMember()
  const [tab, setTab] = useState('myday')
  // השעה ב-hero, מתעדכנת כל 30 שניות
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

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
      height: '100%',
      display: 'flex', flexDirection: 'column',
      background: `linear-gradient(160deg, ${member.color}22 0%, var(--bg) 60%)`,
      overflow: 'hidden'
    }}>
      {/* ── Header ── */}
      <header style={{
        padding: '1rem 1.5rem',
        // שלוש עמודות: ה-Hero תמיד באמצע, גם כשהכפתורים בצדדים ברוחב שונה
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '.75rem',
        background: member.color,
        boxShadow: `0 4px 20px ${member.color}55`
      }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: '#fff', justifySelf: 'start' }}
          onClick={() => setActiveView('home')}
        >
          ← חזרה
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {memberPhoto(member)
            ? <img src={memberPhoto(member)} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff' }} />
            : <span style={{ fontSize: '3rem' }}>{member.avatar}</span>}
          <div>
            <h2 style={{ color: '#fff', margin: 0 }}>{member.name}</h2>
            <div style={{ color: 'rgba(255,255,255,.85)', fontSize: '.95rem' }}>
              {now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}
              {now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}
            </div>
          </div>
        </div>

        {/* Points pill */}
        <div style={{
          background: 'rgba(255,255,255,.25)', borderRadius: 'var(--r-full)',
          padding: '.4rem 1rem', color: '#fff', fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', justifySelf: 'end'
        }}>
          ⭐ {member.points || 0}
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
        {tab === 'myday'    && <MyDay memberId={member.id} hideHero />}
        {tab === 'calendar' && <WeeklyCalendar member={member} />}
        {tab === 'points'   && <PointsDisplay member={member} />}
      </div>
    </div>
  )
}
