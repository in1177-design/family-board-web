import React, { useSyncExternalStore } from 'react'
import { useStore } from '../../store'

// שני עיצובים (החלטה 2026-10-09): "משחקי" = פיקסלים פסטל (data-theme="pixel" על <html>, theme-pixel.css),
// "מעודן" = העיצוב הרגיל (שישתנה לעיצוב חדש).
// הבחירה של כל בן משפחה ב-DB (members.theme: playful / refined), כך שהיא עוברת בין מכשירים.
// בן משפחה שעוד לא בחר, ומסך הבית: מה שנבחר במכשיר (localStorage). בלי localStorage: עובד עד רענון
const KEY = 'family_theme'
const PIXEL = 'pixel'
// עקיפה לבדיקות (פס הבדיקות, 2026-10-18): 'pixel' או 'refined' גובר על הבחירה של כל בן משפחה, בכל מסך.
// נשמר רק במכשיר, ולא משנה את הפרופילים
const TEST_KEY = 'family_theme_test'

export function readTestTheme() {
  try { const v = localStorage.getItem(TEST_KEY); return v === PIXEL || v === 'refined' ? v : null } catch { return null }
}

export function setTestTheme(value) {
  try {
    if (value) localStorage.setItem(TEST_KEY, value)
    else localStorage.removeItem(TEST_KEY)
  } catch { /* בלי שמירה: נשאר עד רענון */ }
}

export function readTheme() {
  const test = readTestTheme()
  if (test) return test === PIXEL ? PIXEL : null
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
  const test = readTestTheme()
  if (test) return test === PIXEL ? PIXEL : null
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
