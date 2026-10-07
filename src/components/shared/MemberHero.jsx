import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { memberPhoto } from './memberPhoto'

// Hero בראש המסך של בן משפחה, ילד או הורה: תמונה, שם, תאריך ושעה, ונקודות.
// שלוש עמודות, כך שה-Hero תמיד באמצע. end: מה שמופיע בצד השני, ליד הנקודות (למשל תפריט)
export default function MemberHero({ member, end }) {
  const { setActiveView } = useStore()
  // השעה מתעדכנת כל 30 שניות
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const photo = memberPhoto(member)

  return (
    <header style={{
      padding: '1rem 1.5rem',
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
        {photo
          ? <img src={photo} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff' }} />
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

      {/* במסך צר הנקודות והתפריט יורדים לשתי שורות */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: '.5rem', justifySelf: 'end' }}>
        <div style={{
          background: 'rgba(255,255,255,.25)', borderRadius: 'var(--r-full)',
          padding: '.4rem 1rem', color: '#fff', fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap'
        }}>
          ⭐ {member.points || 0}
        </div>
        {end}
      </div>
    </header>
  )
}
