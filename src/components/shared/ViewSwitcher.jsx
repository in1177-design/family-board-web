import React from 'react'
import { useStore } from '../../store'
import { memberPhoto } from './memberPhoto'

// בורר משתמשים בראש הדף: מעבר מהיר לתצוגה של כל בן משפחה, מכל מסך.
// מפאנל ההורים עוברים ישר. ממקום אחר, ילד עם PIN דורש את ה-PIN שלו, כמו במסך הבית.
// זמני, לבדיקות בלבד (2026-10-12): פס שחור, ובסופו "מדריך סגנון" שפותח את המדריך המלא מכל מסך.
// guideOpen, onGuide: המדריך פתוח, ופתיחה וסגירה שלו (App). מעבר לבן משפחה או למסך הבית סוגר אותו
export default function ViewSwitcher({ guideOpen, onGuide }) {
  const { members, activeView, activeMemberId, setActiveView } = useStore()

  const current = guideOpen ? 'guide' : activeView === 'home' ? 'home' : activeMemberId || 'home'

  const pick = (m) => {
    onGuide(false)
    if (m.role === 'parent') return setActiveView('parent', m.id)
    if (m.pin && activeView !== 'parent') {
      const entered = window.prompt(`PIN של ${m.name}`)
      if (entered !== m.pin) return
    }
    setActiveView('kid', m.id)
  }

  const item = (id, label, onClick, photo) => (
    <button
      key={id}
      className={'pl-switcher-item' + (current === id ? ' pl-switcher-current' : '')}
      onClick={onClick}
    >
      {photo && <img className="pl-switcher-photo" src={photo} alt="" />}
      {label}
    </button>
  )

  return (
    <nav className="pl pl-switcher">
      {item('home', 'מסך הבית', () => { onGuide(false); setActiveView('home') })}
      {members.map(m => item(m.id, m.name, () => pick(m), memberPhoto(m)))}
      {item('guide', 'מדריך סגנון', () => onGuide(true))}
    </nav>
  )
}
