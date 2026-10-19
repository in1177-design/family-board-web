import React from 'react'
import { useThemeName } from './ThemeToggle'

// שתי סדרות אייקונים באותם שמות (החלטה 2026-10-09):
// משחקי: Pixelarticons (MIT, src/assets/icons/LICENSE). מעודן: Lucide, קו דק ומינימליסטי (ISC, src/assets/icons-line/LICENSE).
// מוצגים inline, כדי שהצבע יבוא מ-currentColor. האייקון מתחלף עם העיצוב
const load = (files) => Object.fromEntries(Object.entries(files).map(([path, svg]) => [path.split('/').pop().slice(0, -4), svg]))
const PIXEL = load(import.meta.glob('../../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true }))
const LINE = load(import.meta.glob('../../assets/icons-line/*.svg', { query: '?raw', import: 'default', eager: true }))

export const hasIcon = (name) => !!PIXEL[name]
// השמות לבחירה בטופס: של סדרת הפיקסלים. לכל אחד יש גם אייקון קו
export const ICON_NAMES = Object.keys(PIXEL).sort()

// line: תמיד אייקון קו, גם במשחקי (למשל השעון בלוח ההרגלים, 2026-10-19)
export default function Icon({ name, className = '', line }) {
  const theme = useThemeName()
  const pixel = !line && theme === 'pixel'
  // אייקון שיש רק בסדרה אחת (למשל sunset, רק בקו): מה שיש
  const svg = (pixel ? PIXEL[name] || LINE[name] : LINE[name] || PIXEL[name])
  if (!svg) return null
  return <span className={'pl-icon ' + (pixel ? '' : 'pl-icon-line ') + className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}
