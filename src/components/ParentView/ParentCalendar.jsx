import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'
import WeeklyCalendarGrid from '../shared/WeeklyCalendarGrid'

export default function ParentCalendar() {
  const { members, tasks, calendarEvents, loadCalendarEvents } = useStore()
  const [activeTab, setActiveTab] = useState('shared')

  useEffect(() => {
    members.forEach(m => {
      if (m.google_calendar_id) {
        loadCalendarEvents(m.id, m.google_calendar_id)
      }
    })
  }, [members.length])

  const tasksMap = {}
  members.forEach(m => {
    tasksMap[m.id] = tasks.filter(t => t.member_id === m.id && t.due_date)
  })

  const displayMembers = activeTab === 'shared'
    ? members
    : members.filter(m => m.id === activeTab)

  const activeMember = members.find(m => m.id === activeTab)

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '.25rem' }}>
        <button
          className={`btn btn-sm ${activeTab === 'shared' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('shared')}
        >
          👨‍👩‍👧‍👦 משותף
        </button>
        {members.map(m => (
          <button
            key={m.id}
            className="btn btn-sm"
            onClick={() => setActiveTab(m.id)}
            style={{
              background: activeTab === m.id ? m.color : 'var(--surface)',
              color: activeTab === m.id ? '#fff' : 'var(--text)',
              border: `2px solid ${activeTab === m.id ? m.color : 'var(--border)'}`,
              fontWeight: 700
            }}
          >
            {m.avatar} {m.name}
          </button>
        ))}
      </div>

      {/* No calendar notice */}
      {activeTab !== 'shared' && activeMember && !activeMember.google_calendar_id && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-3)', background: 'var(--surface)', borderRadius: 'var(--r)', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.4rem' }}>📅</div>
          <p>{activeMember.name} לא מחובר/ת ליומן Google</p>
          <p style={{ fontSize: '.82rem' }}>לכי להגדרות → Google Calendar לחיבור</p>
        </div>
      )}

      <WeeklyCalendarGrid
        members={displayMembers}
        eventsMap={calendarEvents}
        tasksMap={tasksMap}
      />
    </div>
  )
}
