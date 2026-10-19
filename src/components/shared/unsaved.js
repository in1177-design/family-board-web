import { useSyncExternalStore } from 'react'

// שינויים שלא נשמרו (2026-10-18): מסך עם טיוטה (למשל מערכת מתמונה) רושם את עצמו כאן,
// וכל מעבר מסך עובר דרך guard. אם יש טיוטה, המעבר מחכה, ו-UnsavedPrompt שואל: לשמור, לצאת בלי לשמור, או לחזור.
// entry: { save: () => Promise<boolean>, discard: () => void }
let entry = null
let pending = null
const subs = new Set()
const emit = () => subs.forEach(f => f())

export function setUnsaved(next) { entry = next }
export function clearUnsaved(which) { if (!which || entry === which) entry = null }
export const hasUnsaved = () => !!entry

// מעבר מסך: מיד אם אין טיוטה, ואחרת אחרי התשובה בחלון
export function guard(action) {
  if (!entry) return action()
  pending = action
  emit()
}

export function usePendingLeave() {
  return useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => pending)
}

// התשובה מהחלון. 'save': שומר, וממשיך רק אם השמירה הצליחה. 'discard': זורק את הטיוטה וממשיך. 'stay': נשאר
export async function answerLeave(choice) {
  const action = pending
  if (choice === 'stay' || !action) { pending = null; emit(); return true }
  if (choice === 'save' && entry && !(await entry.save())) return false
  if (choice === 'discard' && entry) entry.discard()
  entry = null
  pending = null
  emit()
  action()
  return true
}
