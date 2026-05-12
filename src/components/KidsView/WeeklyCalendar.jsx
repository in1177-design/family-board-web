import React, { useState } from 'react'
import { useStore } from '../../store'
import {
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks,
  isSameDay, isToday, format, parseISO, startOfDay
} from 'date-fns'
import { he } from 'date-fns/locale'

const DAY_NAMES = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']

export default function WeeklyCalendar({ member }) {
  const calendarEvents = useStore(s => s.calendarEvents[member.id] || [])
  const tasks = useStore(s => s.tasks.filter(t => t.member_id === member.id && t.due_date))
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const referenceDate = weekOffset === 0 ? today : addWeeks(today, weekOffset)
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 0 })
  const weekEnd   = endOfWeek(referenceDate,   { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const getEventsForDay = (day) => {
    const calEvents = calendarEvents.filter(ev => {
      const start = ev.start?.date ? parseISO(ev.start.date) : ev.start?.dateTime ? parseISO(ev.start.dateTime) : null
      return start && isSameDay(start, day)
    })
    const taskEvents = tasks.filter(t => {
      try { return isSameDay(parseISO(t.due_date), day) } catch { return false }
    })
    return { calEvents, taskEvents }
  }

  const [selectedDay, setSelectedDay] = useState(today)
  const { calEvents, taskEvents } = getEventsForDay(selectedDay)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}>← שבוע קודם</button>
        <h3 style={{ color: member.color }}>
          {weekOffset === 0 ? 'השבוע' : weekOffset > 0 ? `+${weekOffset} שבועות` : `${weekOffset} שבועות`}
          <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: '.85rem', marginRight: '.5rem' }}>
            {format(weekStart, 'd/M', { locale: he })} – {format(weekEnd, 'd/M', { locale: he })}
          </span>
        </h3>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)}>שבוע הבא →</button>
      </div>

      {/* Day strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '.4rem', marginBottom: '1.25rem' }}>
        {days.map((day, i) => {
          const { calEvents: ce, taskEvents: te } = getEventsForDay(day)
          const total = ce.length + te.length
          const selected = isSameDay(day, selectedDay)
          const todayDay = isToday(day)

          return (
            <div
              key={i}
              onClick={() => setSelectedDay(day)}
              style={{
                borderRadius: 'var(--r)',
                padding: '.5rem .25rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: selected ? member.color : todayDay ? member.color + '22' : 'var(--surface)',
                border: `2px solid ${selected ? member.color : todayDay ? member.color : 'var(--border)'}`,
                transition: 'all .15s',
                boxShadow: selected ? `0 4px 12px ${member.color}55` : 'none'
              }}
            >
              <div style={{
                fontSize: '.7rem', fontWeight: 600,
                color: selected ? 'rgba(255,255,255,.8)' : 'var(--text-3)'
              }}>
                {DAY_NAMES[i]}
              </div>
              <div style={{
                fontSize: '1.1rem', fontWeight: 800,
                color: selected ? '#fff' : todayDay ? member.color : 'var(--text)',
                margin: '.15rem 0'
              }}>
                {format(day, 'd')}
              </div>
              {total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  {Array.from({ length: Math.min(total, 3) }).map((_, j) => (
                    <div key={j} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: selected ? '#fff' : member.color
                    }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Day detail */}
      <div>
        <h3 style={{ marginBottom: '.75rem', color: member.color }}>
          {format(selectedDay, 'EEEE, d בMMMM', { locale: he })}
          {isToday(selectedDay) && (
            <span style={{
              marginRight: '.5rem', fontSize: '.75rem',
              background: member.color, color: '#fff',
              padding: '.15rem .5rem', borderRadius: 'var(--r-full)'
            }}>היום</span>
          )}
        </h3>

        {calEvents.length === 0 && taskEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>😴</div>
            אין אירועים ביום זה
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {/* Calendar events */}
            {calEvents.map((ev, i) => {
              const start = ev.start?.dateTime ? parseISO(ev.start.dateTime) : null
              const end   = ev.end?.dateTime   ? parseISO(ev.end.dateTime)   : null
              return (
                <div key={i} className="card" style={{
                  padding: '.75rem 1rem',
                  borderRight: `4px solid ${member.color}`,
                  display: 'flex', alignItems: 'center', gap: '.75rem'
                }}>
                  <span style={{ fontSize: '1.3rem' }}>📅</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ev.summary || 'אירוע'}</div>
                    {start && (
                      <div style={{ fontSize: '.8rem', color: 'var(--text-3)' }}>
                        {format(start, 'HH:mm')} {end ? `– ${format(end, 'HH:mm')}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Task due-dates */}
            {taskEvents.map((task, i) => (
              <div key={i} className="card" style={{
                padding: '.75rem 1rem',
                borderRight: `4px solid ${task.completed ? 'var(--text-3)' : 'var(--orange)'}`,
                display: 'flex', alignItems: 'center', gap: '.75rem',
                opacity: task.completed ? .6 : 1
              }}>
                <span style={{ fontSize: '1.3rem' }}>{task.completed ? '✅' : '📝'}</span>
                <div>
                  <div style={{ fontWeight: 600, textDecoration: task.completed ? 'line-through' : 'none' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--orange)' }}>
                    +{task.points} ⭐ משימה
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
