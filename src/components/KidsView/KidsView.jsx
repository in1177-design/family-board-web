import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'
import WeeklyCalendar from './WeeklyCalendar'
import PointsDisplay from './PointsDisplay'
import MyDay from '../MyDay/MyDay'
import MemberHero, { AppBar } from '../shared/MemberHero'
import DailyLeaderboard from '../Points/DailyLeaderboard'

const TABS = [
  { id: 'myday',    label: 'היום שלי',  text: 'היום שלי', icon: 'sun' },
  { id: 'calendar', label: '📅 יומן',    text: 'יומן',     icon: 'calendar' },
  { id: 'points',   label: '⭐ ניקוד',   text: 'ניקוד',    icon: 'star' }
]

export default function KidsView() {
  const { getActiveMember, activeMemberId, loadTasks, loadCalendarEvents } = useStore()
  const member = getActiveMember()
  const [tab, setTab] = useState('myday')
  // סיכום היום מ-MyDay, לאחוז ב-Hero ולשורת הסיכום
  const [summary, setSummary] = useState(null)
  useEffect(() => { setSummary(null) }, [activeMemberId])

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
      <AppBar tabs={TABS} current={tab} onPick={setTab} />

      {/* ── Content: ה-Hero גולל יחד עם הדף, כמו ב-wireframe ── */}
      <div className="pl-under-tabs" style={{ flex: 1, overflow: 'auto' }}>
        <MemberHero member={member} summary={tab === 'myday' ? summary : null} />
        <div style={{ padding: '1.25rem' }}>
          {tab === 'myday'    && <MyDay memberId={member.id} hideHero onSummary={setSummary} />}
          {tab === 'calendar' && <WeeklyCalendar member={member} />}
          {tab === 'points'   && <><DailyLeaderboard currentId={member.id} /><PointsDisplay member={member} /></>}
        </div>
      </div>
    </div>
  )
}
