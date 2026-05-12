import React from 'react'
import { useStore } from '../../store'

export default function FamilyOverview() {
  const { members, tasks, family } = useStore()
  const kids    = members.filter(m => m.role === 'child')
  const parents = members.filter(m => m.role === 'parent')

  const totalTasks     = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const pendingTasks   = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Welcome */}
      <div className="card animate-slide" style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none', color: '#fff', padding: '1.5rem 2rem'
      }}>
        <h2 style={{ color: '#fff', margin: 0 }}>
          שלום! ברוכים הבאים לפאנל הניהול 👑
        </h2>
        <p style={{ color: 'rgba(255,255,255,.8)', marginTop: '.5rem' }}>
          משפחת {family?.name} — {members.length} בני משפחה
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon="📋" label="משימות פתוחות" value={pendingTasks}   color="var(--orange)" />
        <StatCard icon="✅" label="הושלמו"         value={completedTasks} color="var(--green)" />
        <StatCard icon="📊" label="אחוז השלמה"     value={`${completionRate}%`} color="var(--purple)" />
      </div>

      {/* Kids cards */}
      {kids.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-2)' }}>👦👧 הילדים</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {kids.map(kid => <KidCard key={kid.id} kid={kid} tasks={tasks.filter(t => t.member_id === kid.id)} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: '.82rem', color: 'var(--text-3)', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function KidCard({ kid, tasks }) {
  const pending   = tasks.filter(t => !t.completed).length
  const completed = tasks.filter(t =>  t.completed).length
  const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  return (
    <div className="card" style={{ border: `2px solid ${kid.color}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '2.5rem' }}>{kid.avatar}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{kid.name}</div>
          <div style={{ color: kid.color, fontWeight: 700 }}>⭐ {kid.points} נקודות</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem' }}>
        <div style={{ flex: 1, textAlign: 'center', background: 'var(--bg)', borderRadius: 'var(--r)', padding: '.5rem' }}>
          <div style={{ fontWeight: 700, color: 'var(--orange)' }}>{pending}</div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>פתוחות</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', background: 'var(--bg)', borderRadius: 'var(--r)', padding: '.5rem' }}>
          <div style={{ fontWeight: 700, color: 'var(--green)' }}>{completed}</div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>הושלמו</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', background: 'var(--bg)', borderRadius: 'var(--r)', padding: '.5rem' }}>
          <div style={{ fontWeight: 700, color: 'var(--purple)' }}>{rate}%</div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>השלמה</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${rate}%`,
          background: kid.color,
          borderRadius: 'var(--r-full)',
          transition: 'width 1s ease'
        }} />
      </div>
    </div>
  )
}
