import React, { useState } from 'react'
import { useStore } from '../../store'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

function formatDue(dateStr) {
  if (!dateStr) return null
  try {
    const d = parseISO(dateStr)
    if (isToday(d))    return { label: 'היום',   color: 'var(--orange)' }
    if (isTomorrow(d)) return { label: 'מחר',    color: 'var(--blue)' }
    if (isPast(d))     return { label: 'באיחור!', color: 'var(--red)' }
    return { label: format(d, 'EEEE d בMMMM', { locale: he }), color: 'var(--text-3)' }
  } catch { return null }
}

export default function TaskList({ member }) {
  const { getMemberTasks, completeTask, uncompleteTask } = useStore()
  const [completing, setCompleting] = useState(null)
  const [celebrateId, setCelebrateId] = useState(null)

  const tasks = getMemberTasks(member.id)
  const pending   = tasks.filter(t => !t.completed)
  const completed = tasks.filter(t =>  t.completed)

  const handleComplete = async (task) => {
    if (completing) return
    setCompleting(task.id)
    await completeTask(task.id, member.id)
    setCelebrateId(task.id)
    setTimeout(() => setCelebrateId(null), 2000)
    setCompleting(null)
  }

  const handleUncomplete = async (task) => {
    await uncompleteTask(task.id, member.id)
  }

  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'float 3s ease-in-out infinite' }}>
          🎉
        </div>
        <h3 style={{ color: 'var(--text-2)' }}>אין משימות כרגע!</h3>
        <p>כל הכבוד, סיימת הכל 🌟</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Pending tasks */}
      {pending.length > 0 && (
        <section>
          <h3 style={{ color: 'var(--text-2)', marginBottom: '1rem', fontSize: '.9rem', fontWeight: 700 }}>
            📋 משימות ממתינות ({pending.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {pending.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                member={member}
                celebrating={celebrateId === task.id}
                loading={completing === task.id}
                onComplete={() => handleComplete(task)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h3 style={{ color: 'var(--text-3)', marginBottom: '1rem', fontSize: '.9rem', fontWeight: 700 }}>
            ✅ הושלמו ({completed.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {completed.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                member={member}
                done
                onUncomplete={() => handleUncomplete(task)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TaskCard({ task, member, done, celebrating, loading, onComplete, onUncomplete }) {
  const due = formatDue(task.due_date)

  return (
    <div
      className={`card ${celebrating ? 'animate-pop' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '1rem 1.25rem',
        opacity: done ? .6 : 1,
        border: done ? '1.5px solid var(--border)' : `2px solid ${member.color}33`,
        background: done ? '#FAFAFA' : 'var(--surface)',
        transition: 'all .2s'
      }}
    >
      {/* Checkbox */}
      <button
        onClick={done ? onUncomplete : onComplete}
        disabled={loading}
        style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: done ? member.color : 'var(--border)',
          color: '#fff', fontSize: '1.1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all .2s',
          boxShadow: done ? `0 2px 8px ${member.color}55` : 'none'
        }}
      >
        {loading ? '⏳' : done ? '✓' : '○'}
      </button>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--text-3)' : 'var(--text)' }}>
          {task.title}
        </div>
        {task.description ? (
          <div style={{ fontSize: '.82rem', color: 'var(--text-3)', marginTop: '.15rem' }}>
            {task.description}
          </div>
        ) : null}
        {due && !done && (
          <div style={{ fontSize: '.78rem', color: due.color, fontWeight: 600, marginTop: '.2rem' }}>
            ⏰ {due.label}
          </div>
        )}
      </div>

      {/* Points badge */}
      <div style={{
        background: done ? 'var(--border)' : member.color + '22',
        color: done ? 'var(--text-3)' : member.color,
        padding: '.3rem .7rem',
        borderRadius: 'var(--r-full)',
        fontSize: '.85rem', fontWeight: 700,
        flexShrink: 0
      }}>
        +{task.points} ⭐
      </div>

      {/* Celebrate overlay */}
      {celebrating && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 'inherit',
          background: member.color + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
          pointerEvents: 'none'
        }}>
          🎉 כל הכבוד! +{task.points} ⭐
        </div>
      )}
    </div>
  )
}
