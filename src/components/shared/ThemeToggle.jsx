import React, { useState } from 'react'

// מעבר בין העיצוב הרגיל לעיצוב החדש (פיקסלים פסטל, החלטה 2026-10-07).
// העיצוב החדש = data-theme="pixel" על <html>, והכללים שלו ב-theme-pixel.css.
// הבחירה נשמרת במכשיר בלבד (localStorage). בלי localStorage: עובד עד רענון
const KEY = 'family_theme'
const PIXEL = 'pixel'

export function readTheme() {
  try { return localStorage.getItem(KEY) === PIXEL ? PIXEL : null } catch { return null }
}

export function applyTheme(theme) {
  if (theme === PIXEL) document.documentElement.dataset.theme = PIXEL
  else delete document.documentElement.dataset.theme
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme)

  const toggle = () => {
    const next = theme === PIXEL ? null : PIXEL
    setTheme(next)
    applyTheme(next)
    try {
      if (next) localStorage.setItem(KEY, next)
      else localStorage.removeItem(KEY)
    } catch { /* בלי שמירה: נשאר עד רענון */ }
  }

  return (
    <button className="pl-theme-toggle" onClick={toggle} aria-pressed={theme === PIXEL}>
      {theme === PIXEL ? 'עיצוב רגיל' : '✨ עיצוב חדש'}
    </button>
  )
}
