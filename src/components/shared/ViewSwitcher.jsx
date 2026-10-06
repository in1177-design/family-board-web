import React from 'react'
import { useStore } from '../../store'
import { memberPhoto } from './memberPhoto'

// בורר משתמשים בראש הדף: מעבר מהיר לתצוגה של כל בן משפחה, מכל מסך.
// מפאנל ההורים עוברים ישר. ממקום אחר, ילד עם PIN דורש את ה-PIN שלו, כמו במסך הבית
export default function ViewSwitcher() {
  const { members, activeView, activeMemberId, setActiveView } = useStore()

  const current = activeView === 'home' ? 'home' : activeMemberId || 'home'

  const pick = (m) => {
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
      {item('home', 'מסך הבית', () => setActiveView('home'))}
      {members.map(m => item(m.id, m.name, () => pick(m), memberPhoto(m)))}
    </nav>
  )
}
