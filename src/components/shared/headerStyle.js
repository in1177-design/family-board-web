// שתי גרסאות לכותרת בטלפון (המשתמשת, 2026-10-10: "עוד גרסה, בלי למחוק את הקודמת, שיהיה טוגל"):
// 'band': פס צבעוני עם התמונה במרכז (הראשונה). 'photo': התמונה גדולה על כל הרוחב, בלי פס, והברכה בכרטיס מתחת.
// נשמר במכשיר (localStorage) ומוחל כ-data-mhdr על <html>. ה-CSS ב-plain.css וב-theme-pixel.css
const KEY = 'family_mobile_header'
export const HEADER_STYLES = [
  { id: 'band',  title: 'פס צבעוני' },
  { id: 'photo', title: 'תמונה גדולה' }
]

export function readHeaderStyle() {
  try { return localStorage.getItem(KEY) === 'photo' ? 'photo' : 'band' } catch { return 'band' }
}

export function applyHeaderStyle(style) {
  document.documentElement.dataset.mhdr = style === 'photo' ? 'photo' : 'band'
}

export function saveHeaderStyle(style) {
  applyHeaderStyle(style)
  try { localStorage.setItem(KEY, style) } catch { /* בלי שמירה: נשאר עד רענון */ }
}
