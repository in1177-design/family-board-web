import React, { useState } from 'react'
import { useStore } from '../../store'
import { memberPhoto } from './memberPhoto'

const ROLE_LABEL = { parent: 'הורה', child: 'ילד/ה' }

export default function HomeScreen() {
  const { members, setActiveView } = useStore()
  const [pinTarget, setPinTarget] = useState(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const kids   = members.filter(m => m.role === 'child')
  const parents = members.filter(m => m.role === 'parent')

  const handleMemberClick = (member) => {
    if (member.role === 'parent') {
      setActiveView('parent', member.id)
    } else {
      if (member.pin) {
        setPinTarget(member)
        setPin('')
        setPinError(false)
      } else {
        setActiveView('kid', member.id)
      }
    }
  }

  const submitPin = (completedPin) => {
    const entered = completedPin ?? pin
    if (entered === pinTarget.pin) {
      setActiveView('kid', pinTarget.id)
      setPinTarget(null)
    } else {
      setPinError(true)
      setPin('')
      setTimeout(() => setPinError(false), 1500)
    }
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'
  const dayName = now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(160deg, #667eea 0%, #a18cd1 50%, #fbc2eb 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', gap: '2rem', overflow: 'auto'
    }}>
      {/* Header */}
      <div className="text-center animate-slide">
        <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🌟</div>
        <h1 style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
          {greeting}!
        </h1>
        <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '1.1rem', marginTop: '.5rem' }}>
          {dayName}
        </p>
        <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.95rem', marginTop: '.25rem' }}>
          מי אתה היום?
        </p>
      </div>

      {/* Member cards */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
        justifyContent: 'center', maxWidth: 900
      }}>
        {members.map((m, i) => (
          <MemberCard
            key={m.id}
            member={m}
            delay={i * 80}
            onClick={() => handleMemberClick(m)}
          />
        ))}
      </div>

      {/* PIN Modal */}
      {pinTarget && (
        <div className="modal-overlay" onClick={() => setPinTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-2">
              <div style={{ fontSize: '3rem' }}>{pinTarget.avatar}</div>
              <h2 style={{ marginTop: '.5rem' }}>שלום {pinTarget.name}!</h2>
              <p>הכנס/י את הקוד הסודי שלך</p>
            </div>
            <PinInput
              value={pin}
              onChange={setPin}
              onSubmit={submitPin}
              error={pinError}
            />
            {pinError && (
              <p style={{ color: 'var(--red)', textAlign: 'center', marginTop: '.5rem', fontWeight: 600 }}>
                קוד שגוי, נסה/י שוב
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MemberCard({ member, delay, onClick }) {
  const tasks = useStore(s => s.tasks.filter(t => t.member_id === member.id && !t.completed))

  return (
    <div
      className="card card-hover animate-slide"
      onClick={onClick}
      style={{
        width: 200, padding: '2rem 1.5rem',
        textAlign: 'center',
        border: `3px solid ${member.color}`,
        animationDelay: `${delay}ms`,
        position: 'relative'
      }}
    >
      {/* Avatar */}
      <div style={{
        fontSize: '3.5rem', lineHeight: 1,
        marginBottom: '.75rem',
        animation: 'float 3s ease-in-out infinite'
      }}>
        {memberPhoto(member)
          ? <img src={memberPhoto(member)} alt="" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }} />
          : member.avatar || '👤'}
      </div>

      {/* Name */}
      <h3 style={{ color: member.color, marginBottom: '.25rem' }}>{member.name}</h3>
      <span style={{
        fontSize: '.75rem', color: 'var(--text-3)',
        background: 'var(--bg)', padding: '.15rem .6rem',
        borderRadius: 'var(--r-full)'
      }}>
        {member.role === 'parent' ? '👑 הורה' : '⭐ ילד/ה'}
      </span>

      {/* Points badge (kids only) */}
      {member.role === 'child' && (
        <div style={{
          marginTop: '.75rem',
          background: member.color + '22',
          borderRadius: 'var(--r-full)',
          padding: '.3rem .8rem',
          fontSize: '.9rem', fontWeight: 700, color: member.color
        }}>
          ⭐ {member.points || 0} נקודות
        </div>
      )}

      {/* Pending tasks badge */}
      {tasks.length > 0 && (
        <div style={{
          position: 'absolute', top: -8, left: -8,
          background: 'var(--orange)', color: '#fff',
          borderRadius: '50%', width: 26, height: 26,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.8rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,.2)'
        }}>
          {tasks.length}
        </div>
      )}
    </div>
  )
}

function PinInput({ value, onChange, onSubmit, error }) {
  const digits = [value[0]||'', value[1]||'', value[2]||'', value[3]||'']

  return (
    <div>
      <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', marginBottom: '1rem' }}>
        {digits.map((d, i) => (
          <div key={i} style={{
            width: 52, height: 64,
            border: `3px solid ${error ? 'var(--red)' : d ? 'var(--purple)' : 'var(--border)'}`,
            borderRadius: 'var(--r)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 700,
            color: 'var(--purple)',
            transition: 'border-color .2s',
            background: d ? '#F0EDFF' : 'var(--surface)'
          }}>
            {d ? '●' : ''}
          </div>
        ))}
      </div>
      {/* Numpad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem' }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
          <button
            key={i}
            disabled={k === ''}
            className="btn btn-ghost"
            style={{
              height: 52, fontSize: '1.3rem', fontWeight: 600,
              borderRadius: 'var(--r)',
              border: '1.5px solid var(--border)',
              opacity: k === '' ? 0 : 1
            }}
            onClick={() => {
              if (k === '⌫') {
                onChange(value.slice(0, -1))
              } else if (value.length < 4) {
                const next = value + k
                onChange(next)
                if (next.length === 4) setTimeout(() => onSubmit(next), 150)
              }
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
