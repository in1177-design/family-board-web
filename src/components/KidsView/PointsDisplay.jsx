import React, { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { api } from '../../store'

const MILESTONES = [
  { points: 50,  emoji: '🥉', label: 'מתחיל', color: '#CD7F32' },
  { points: 100, emoji: '🥈', label: 'בינוני', color: '#C0C0C0' },
  { points: 200, emoji: '🥇', label: 'מתקדם', color: '#FFD700' },
  { points: 350, emoji: '💎', label: 'מצטיין', color: '#4FC3F7' },
  { points: 500, emoji: '🏆', label: 'אלוף!',  color: '#FF7043' },
]

export default function PointsDisplay({ member }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    api.points?.getHistory(member.id).then(h => setHistory(h || []))
  }, [member.id])

  const pts = member.points || 0
  const nextMilestone = MILESTONES.find(m => m.points > pts)
  const currentMilestone = [...MILESTONES].reverse().find(m => m.points <= pts)
  const progress = nextMilestone
    ? ((pts - (currentMilestone?.points || 0)) / (nextMilestone.points - (currentMilestone?.points || 0))) * 100
    : 100

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Big points display */}
      <div className="card text-center" style={{
        padding: '2rem',
        background: `linear-gradient(135deg, ${member.color}22 0%, ${member.color}11 100%)`,
        border: `2px solid ${member.color}44`,
        marginBottom: '1.5rem'
      }}>
        <div style={{ fontSize: '4rem', animation: 'float 3s ease-in-out infinite', marginBottom: '.5rem' }}>
          {currentMilestone?.emoji || '⭐'}
        </div>
        <div style={{ fontSize: '3.5rem', fontWeight: 900, color: member.color, lineHeight: 1 }}>
          {pts}
        </div>
        <div style={{ color: 'var(--text-2)', fontWeight: 600, marginTop: '.25rem' }}>נקודות</div>
        {currentMilestone && (
          <div style={{
            marginTop: '.75rem',
            background: currentMilestone.color + '33',
            color: currentMilestone.color,
            borderRadius: 'var(--r-full)', padding: '.3rem .8rem',
            fontWeight: 700, fontSize: '.9rem', display: 'inline-block'
          }}>
            {currentMilestone.emoji} {currentMilestone.label}
          </div>
        )}
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '.9rem' }}>
              עוד {nextMilestone.points - pts} נקודות ל-{nextMilestone.emoji} {nextMilestone.label}
            </span>
            <span style={{ color: 'var(--text-3)', fontSize: '.85rem' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{
            height: 16, background: 'var(--border)', borderRadius: 'var(--r-full)', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', width: `${Math.min(progress, 100)}%`,
              background: `linear-gradient(90deg, ${member.color}, ${member.color}99)`,
              borderRadius: 'var(--r-full)',
              transition: 'width 1s ease',
              boxShadow: `0 2px 8px ${member.color}55`
            }} />
          </div>
        </div>
      )}

      {/* Milestones timeline */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🗺️ מפת ההישגים</h3>
        <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', paddingBottom: '.5rem' }}>
          {MILESTONES.map((m, i) => {
            const achieved = pts >= m.points
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '.25rem', minWidth: 70, textAlign: 'center', padding: '.75rem .5rem',
                borderRadius: 'var(--r)',
                background: achieved ? m.color + '22' : 'var(--bg)',
                border: `2px solid ${achieved ? m.color : 'var(--border)'}`,
                opacity: achieved ? 1 : .5,
                transition: 'all .2s'
              }}>
                <div style={{ fontSize: '2rem', filter: achieved ? 'none' : 'grayscale(1)' }}>{m.emoji}</div>
                <div style={{ fontSize: '.7rem', fontWeight: 700, color: achieved ? m.color : 'var(--text-3)' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-3)' }}>{m.points} ⭐</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>📜 היסטוריית נקודות</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {history.slice(0, 15).map((h, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '.6rem .75rem',
                background: 'var(--bg)',
                borderRadius: 'var(--r)',
                fontSize: '.88rem'
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{h.reason || 'בונוס'}</div>
                  <div style={{ color: 'var(--text-3)', fontSize: '.78rem' }}>
                    {format(parseISO(h.created_at), "EEEE d בMMM בשעה HH:mm", { locale: he })}
                  </div>
                </div>
                <div style={{
                  fontWeight: 800, color: h.points > 0 ? 'var(--green)' : 'var(--red)',
                  fontSize: '1rem'
                }}>
                  {h.points > 0 ? '+' : ''}{h.points} ⭐
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
