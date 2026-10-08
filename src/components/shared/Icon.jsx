import React from 'react'

// אייקוני פיקסלים מ-Pixelarticons (MIT, src/assets/icons/LICENSE), לעיצוב החדש (החלטה 2026-10-07).
// מוצגים inline, כדי שהצבע יבוא מ-currentColor. במצב העיצוב הרגיל הם מוסתרים (plain.css)
const files = import.meta.glob('../../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true })
const ICONS = Object.fromEntries(Object.entries(files).map(([path, svg]) => [path.split('/').pop().slice(0, -4), svg]))

export const hasIcon = (name) => !!ICONS[name]
export const ICON_NAMES = Object.keys(ICONS).sort()

export default function Icon({ name, className = '' }) {
  const svg = ICONS[name]
  if (!svg) return null
  return <span className={'pl-icon ' + className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}
