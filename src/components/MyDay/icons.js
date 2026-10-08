import { hasIcon } from '../shared/Icon'
import sunImg from '../../assets/window-icons/pixel-sun.svg'
import sunsetImg from '../../assets/window-icons/pixel-sunset.svg'
import moonImg from '../../assets/window-icons/pixel-moon.svg'

// איזה אייקון לכל הרגל ומשימה בעיצוב החדש (החלטה 2026-10-07):
// 1. step.icon, אם הוא שם של אייקון קיים. 2. לפי ההרגל בספרייה. 3. לפי מילה בשם. 4. ברירת מחדל

const BY_LIBRARY = {
  'lib-m-dress': 'shirt',      'lib-m-breakfast': 'apple',   'lib-m-teeth': 'brush',
  'lib-m-bed': 'bed',          'lib-m-bag': 'backpack',      'lib-n-hang': 'backpack',
  'lib-n-lunchbox': 'apple',   'lib-n-homework': 'notebook', 'lib-n-room': 'home',
  'lib-n-read': 'book-open',   'lib-e-shower': 'sparkles',   'lib-e-clothes': 'shirt',
  'lib-e-bag': 'backpack',     'lib-e-teeth': 'brush',       'lib-e-charge': 'plug',
  'lib-e-water': 'mug'
}

// הראשון שמתאים קובע. "שיעורי" לפני "פסנתר", כדי ש"שיעור פסנתר" יקבל פסנתר
const BY_WORD = [
  [/פסנתר|נגינה|גיטרה|שיר/, 'keyboard-music'],
  [/שיניים/, 'brush'],
  [/מים|לשתות/, 'mug'],
  [/תיק/, 'backpack'],
  [/לקרוא|קריאה|ספר/, 'book-open'],
  [/בגדים|להתלבש|חולצה/, 'shirt'],
  [/מיטה|לישון|שינה/, 'bed'],
  [/אוכל|ארוחה|לאכול/, 'apple'],
  [/שיעורי|ללמוד|מבחן|חשבון/, 'notebook'],
  [/חדר|לסדר|לנקות/, 'home'],
  [/להטעין|טלפון|מכשיר/, 'plug'],
  [/כלב|חתול/, 'dog'],
  [/משחק/, 'gamepad'],
  [/צמח|עציץ|להשקות/, 'tree'],
  [/מקלחת|אמבטיה/, 'sparkles']
]

const byWord = (text = '') => BY_WORD.find(([re]) => re.test(text))?.[1]

export function stepIcon(step) {
  if (step.icon && hasIcon(step.icon)) return step.icon
  return BY_LIBRARY[step.library_step_id] || byWord(step.label) || 'sparkles'
}

export function todoIcon(todo) {
  // אייקון שנבחר בטופס (2026-10-08), אחר כך לפי מילה בשם
  if (todo.icon && hasIcon(todo.icon)) return todo.icon
  return byWord(todo.title) || 'note'
}


// ציור צבעוני לכל חלון (2026-10-07, מהמשתמשת, בתיקייה pixel-icons). מוצג כתמונה, לא inline,
// כי לכל קובץ יש id פנימי, ושלושה חלונות באותו דף היו מתנגשים
export const WINDOW_IMAGES = { morning: sunImg, noon: sunsetImg, evening: moonImg }
