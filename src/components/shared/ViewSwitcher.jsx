import React from 'react'
import { useStore } from '../../store'
import { memberPhoto } from './memberPhoto'
import { guard } from './unsaved'
import { useThemeName, applyTheme, memberTheme, readTestTheme, setTestTheme } from './ThemeToggle'

// בורר משתמשים בראש הדף: מעבר מהיר לתצוגה של כל בן משפחה, מכל מסך.
// מפאנל ההורים עוברים ישר. ממקום אחר, ילד עם PIN דורש את ה-PIN שלו, כמו במסך הבית.
// זמני, לבדיקות בלבד (2026-10-12): פס שחור, ובסופו "מדריך סגנון" שפותח את המדריך המלא מכל מסך.
// טוגל עיצוב (2026-10-18): מחליף מיד כל מסך בין מעודן למשחקי, וגובר על הבחירה של בן המשפחה עד "לפי הפרופיל" (✕).
// guideOpen, onGuide: המדריך פתוח, ופתיחה וסגירה שלו (App). מעבר לבן משפחה או למסך הבית סוגר אותו
export default function ViewSwitcher({ guideOpen, onGuide }) {
  const { members, activeView, activeMemberId, setActiveView } = useStore()
  const theme = useThemeName()
  const forced = readTestTheme()
  const flipTheme = () => {
    const next = theme === 'pixel' ? 'refined' : 'pixel'
    setTestTheme(next)
    applyTheme(next === 'pixel' ? 'pixel' : null)
  }
  // חזרה לעיצוב של מי שבמסך
  const clearTheme = () => {
    setTestTheme(null)
    const shown = members.find(m => m.id === activeMemberId) || members.find(m => m.role === 'parent')
    applyTheme(activeView === 'home' ? memberTheme(null) : memberTheme(shown))
  }

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
      onClick={() => guard(onClick)}
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
      <span className="pl-switcher-theme">
        <button className="pl-switcher-item" onClick={flipTheme} aria-pressed={theme === 'pixel'}
          title="מחליף את העיצוב בכל המסכים, לבדיקה">
          {theme === 'pixel' ? '🎮 משחקי' : '◻ מעודן'}
        </button>
        {forced && <button className="pl-switcher-item" onClick={clearTheme} aria-label="עיצוב לפי הפרופיל" title="עיצוב לפי הפרופיל">✕</button>}
      </span>
    </nav>
  )
}
