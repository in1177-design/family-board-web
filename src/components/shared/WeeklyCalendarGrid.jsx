import React, { useRef, useEffect, useState } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks,
  isSameDay, isToday, format, parseISO
} from 'date-fns'
import { he } from 'date-fns/locale'

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5) // 05–23
const HOUR_H = 64 // px per hour
const DAY_START = 5 * 60 // minutes from midnight
const TOTAL_H = HOURS.length * HOUR_H
const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

function toMin(dateTimeStr) {
  const d = parseISO(dateTimeStr)
  return d.getHours() * 60 + d.getMinutes()
}

export default function WeeklyCalendarGrid({ members = [], eventsMap = {}, tasksMap = {} }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const scrollRef = useRef(null)

  const today = new Date()
  const ref = addWeeks(today, weekOffset)
  const weekStart = startOfWeek(ref, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(ref, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const nowMin = today.getHours() * 60 + today.getMinutes()
  const nowTop = (nowMin - DAY_START) * (HOUR_H / 60)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = Math.max(0, (7 - 5) * HOUR_H - 20)
      scrollRef.current.scrollTop = scrollTo
    }
  }, [])

  const getDayEvents = (day, memberId) =>
    (eventsMap[memberId] || []).filter(ev => {
      const dt = ev.start?.dateTime || ev.start?.date
      if (!dt) return false
      try { return isSameDay(parseISO(dt), day) } catch { return false }
    })

  const getDayTasks = (day, memberId) =>
    (tasksMap[memberId] || []).filter(t => {
      try { return t.due_date && isSameDay(parseISO(t.due_date), day) } catch { return false }
    })

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}>← שבוע קודם</button>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700 }}>
            {format(weekStart, 'd/M', { locale: he })} – {format(weekEnd, 'd/M', { locale: he })}
          </span>
          {weekOffset === 0 && (
            <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--purple)' }}>השבוע</span>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)}>שבוע הבא →</button>
      </div>

      {/* Grid */}
      <div ref={scrollRef} style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '68vh', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
        <div style={{ minWidth: 520 }}>

          {/* Header row */}
          <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 20, background: 'var(--surface)', borderBottom: '2px solid var(--border)' }}>
            <div style={{ width: 48, flexShrink: 0 }} />
            {days.map((day, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '.45rem .1rem',
                background: isToday(day) ? 'var(--purple)' : 'transparent',
                color: isToday(day) ? '#fff' : 'var(--text)',
                fontWeight: 700, fontSize: '.82rem'
              }}>
                <div style={{ fontSize: '.65rem', opacity: .7 }}>{DAY_NAMES[i]}</div>
                {format(day, 'd')}
              </div>
            ))}
          </div>

          {/* Body */}
          <div style={{ display: 'flex', position: 'relative' }}>

            {/* Time labels */}
            <div style={{ width: 48, flexShrink: 0, position: 'relative', height: TOTAL_H, background: 'var(--surface)', zIndex: 10 }}>
              {HOURS.map(h => (
                <div key={h} style={{
                  position: 'absolute',
                  top: (h - 5) * HOUR_H - 9,
                  right: 6, left: 0,
                  fontSize: '.65rem',
                  color: 'var(--text-3)',
                  textAlign: 'right',
                  userSelect: 'none'
                }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, di) => (
              <div key={di} style={{
                flex: 1,
                position: 'relative',
                height: TOTAL_H,
                borderLeft: '1px solid var(--border)',
                borderRight: di === 6 ? '1px solid var(--border)' : 'none',
                background: isToday(day) ? 'rgba(108,99,255,.04)' : 'transparent'
              }}>
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} style={{
                    position: 'absolute',
                    top: (h - 5) * HOUR_H,
                    left: 0, right: 0,
                    borderTop: `1px solid var(--border)`,
                    opacity: h % 2 === 0 ? 0.6 : 0.25
                  }} />
                ))}

                {/* Current time indicator */}
                {weekOffset === 0 && isToday(day) && nowTop >= 0 && nowTop <= TOTAL_H && (
                  <div style={{
                    position: 'absolute', top: nowTop,
                    left: 0, right: 0,
                    borderTop: '2px solid #ff4444', zIndex: 10, pointerEvents: 'none'
                  }}>
                    <div style={{
                      position: 'absolute', top: -5, right: -4,
                      width: 9, height: 9, borderRadius: '50%', background: '#ff4444'
                    }} />
                  </div>
                )}

                {/* Events & tasks */}
                {members.flatMap(member => {
                  const results = []
                  const dayEvents = getDayEvents(day, member.id)
                  const dayTasks = getDayTasks(day, member.id)

                  dayEvents.forEach((ev, ei) => {
                    const startDT = ev.start?.dateTime
                    const endDT = ev.end?.dateTime

                    if (!startDT) {
                      results.push(
                        <div key={`${member.id}-allday-${ei}`} title={ev.summary} style={{
                          position: 'absolute', top: 2 + ei * 17,
                          left: 2, right: 2,
                          background: member.color, color: '#fff',
                          borderRadius: 3, padding: '1px 4px',
                          fontSize: '.65rem', fontWeight: 700,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          zIndex: 4
                        }}>
                          {members.length > 1 && `${member.avatar} `}{ev.summary}
                        </div>
                      )
                      return
                    }

                    const startMin = toMin(startDT)
                    const endMin = endDT ? toMin(endDT) : startMin + 30
                    const top = (startMin - DAY_START) * (HOUR_H / 60)
                    const height = Math.max((endMin - startMin) * (HOUR_H / 60), 22)
                    if (top < 0 || top > TOTAL_H) return

                    results.push(
                      <div key={`${member.id}-ev-${ei}`} title={`${ev.summary}${members.length > 1 ? ' · ' + member.name : ''}`} style={{
                        position: 'absolute', top, height,
                        left: 2, right: 2,
                        background: member.color + 'dd', color: '#fff',
                        borderRadius: 4, padding: '2px 5px',
                        fontSize: '.7rem', fontWeight: 700,
                        overflow: 'hidden', boxSizing: 'border-box',
                        zIndex: 3, cursor: 'default',
                        borderRight: `3px solid ${member.color}`
                      }}>
                        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {members.length > 1 && `${member.avatar} `}{ev.summary}
                        </div>
                        {height > 30 && (
                          <div style={{ fontSize: '.6rem', opacity: .85 }}>
                            {format(parseISO(startDT), 'HH:mm')}
                            {endDT ? ` – ${format(parseISO(endDT), 'HH:mm')}` : ''}
                          </div>
                        )}
                      </div>
                    )
                  })

                  dayTasks.forEach((task, ti) => {
                    results.push(
                      <div key={`${member.id}-task-${ti}`} title={task.title} style={{
                        position: 'absolute', top: 2 + ti * 17,
                        left: 2, right: 2,
                        background: task.completed ? 'var(--text-3)' : 'var(--orange)',
                        color: '#fff', borderRadius: 3,
                        padding: '1px 4px', fontSize: '.65rem', fontWeight: 700,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        zIndex: 4, opacity: task.completed ? .55 : 1
                      }}>
                        📝 {task.title}
                      </div>
                    )
                  })

                  return results
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
