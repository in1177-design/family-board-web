import React, { useSyncExternalStore } from 'react'
import { useStore } from '../../store'

// שני עיצובים (החלטה 2026-10-09): "משחקי" = פיקסלים פסטל (data-theme="pixel" על <html>, theme-pixel.css),
// "מעודן" = העיצוב הרגיל (שישתנה לעיצוב חדש).
// הבחירה של כל בן משפחה ב-DB (members.theme: playful / refined), כך שהיא עוברת בין מכשירים.
// בן משפחה שעוד לא בחר, ומסך הבית: מה שנבחר במכשיר (localStorage). בלי localStorage: עובד עד רענון
const KEY = 'family_theme'
const PIXEL = 'pixel'

export function readTheme() {
  try { return localStorage.getItem(KEY) === PIXEL ? PIXEL : null } catch { return null }
}

function saveDeviceTheme(theme) {
  try {
    if (theme) localStorage.setItem(KEY, theme)
    else localStorage.removeItem(KEY)
  } catch { /* בלי שמירה: נשאר עד רענון */ }
}

// העיצוב של בן משפחה: מה שהוא בחר, ואם לא בחר, מה שנבחר במכשיר
export function memberTheme(member) {
  if (member?.theme === 'playful') return PIXEL
  if (member?.theme === 'refined') return null
  return readTheme()
}

// העיצוב הנוכחי, ומתעדכן כשמחליפים. App משתמש בזה כדי לצייר הכל מחדש (למשל אווטרים שונים בכל עיצוב)
export function useThemeName() {
  return useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme || null)
}
function subscribeTheme(onChange) {
  const obs = new MutationObserver(onChange)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}

export function applyTheme(theme) {
  if (theme === PIXEL) document.documentElement.dataset.theme = PIXEL
  else delete document.documentElement.dataset.theme
}

// כפתור מעבר בין העיצובים בפס האפליקציה. עם member: שומר בפרופיל שלו. בלי: רק במכשיר
export default function ThemeToggle({ member }) {
  const { updateMember } = useStore()
  const theme = useThemeName()

  const toggle = () => {
    const next = theme === PIXEL ? null : PIXEL
    applyTheme(next)
    saveDeviceTheme(next)
    if (member) updateMember({ id: member.id, theme: next ? 'playful' : 'refined' }).catch(() => {})
  }

  return (
    <button className="pl-theme-toggle" onClick={toggle} aria-pressed={theme === PIXEL}>
      {theme === PIXEL ? 'עיצוב מעודן' : '✨ עיצוב משחקי'}
    </button>
  )
}
