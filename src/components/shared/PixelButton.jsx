import React from 'react'
import { stairPolygon } from '../Design/frame'

// PixelButton (החלטה 2026-10-08, לפי רפרנס של המשתמשת): כפתור עם מסגרת פיקסלים במדרגות,
// מילוי בהיר, ופס צל כהה יותר בתחתית מבפנים. בלחיצה הפס מתכווץ, כאילו הכפתור נלחץ.
// color: מסגרת. text: צבע הטקסט. fill: מילוי. shade: פס הצל. b: עובי המסגרת וגודל מדרגה. n: מדרגות בכל פינה.
// depth: גובה פס הצל. הסגנון ב-plain.css (.px-btn), בלי קשר לעיצוב שנבחר
export const PIXEL_BUTTON_DEFAULTS = { color: '#F25CCB', text: '#F25CCB', fill: '#FFE6FA', shade: '#F9A8E8', b: 3, n: 1, depth: 8 }

// סוגים מוכנים (2026-10-08, מהמשתמשת): <PixelButton variant="main">. props נוספים גוברים על הסוג
export const PIXEL_BUTTON_VARIANTS = {
  // Main.pixel: טורקיז מלא, טקסט בהיר, 2 מדרגות
  main: { color: '#1FA595', text: '#FFFDF8', fill: '#1FA595', shade: '#1C877B', b: 3, n: 2, depth: 4 },
  // Secondary.pixel: אפור. מסגרת אפורה בהירה, מילוי קרם, טקסט אפור כהה, מדרגה אחת
  secondary: { color: '#D9D9D9', text: '#575757', fill: '#FFFDF8', shade: '#F0EFEF', b: 3, n: 1, depth: 4 }
}

export function pixelButtonVars(p) {
  const given = Object.fromEntries(Object.entries(p || {}).filter(([, v]) => v !== undefined))
  const { color, fill, shade, b, n, depth } = { ...PIXEL_BUTTON_DEFAULTS, ...given }
  // צבע הטקסט: כמו המסגרת, אם לא נתנו אחר
  const text = given.text || color
  return {
    '--pb-c': color, '--pb-text': text, '--pb-fill': fill, '--pb-shade': shade,
    '--pb-b': b + 'px', '--pb-depth': depth + 'px', '--pb-clip': stairPolygon(n, b)
  }
}

export default function PixelButton({ variant, color, text, fill, shade, b, n, depth, className = '', style, children, ...rest }) {
  const base = PIXEL_BUTTON_VARIANTS[variant] || {}
  return (
    <button
      className={'px-btn ' + className}
      style={{ ...pixelButtonVars({ ...base, ...defined({ color, text, fill, shade, b, n, depth }) }), ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}

// רק הערכים שנתנו, כדי שלא ידרסו את הסוג
const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))
