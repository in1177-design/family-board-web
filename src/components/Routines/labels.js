// שמות בממשק לשגרות. ברירות המחדל של החלונות זהות ל-lib/routines.js בשרת.
// בממשק: "הרגלים". בקוד ובשרת: steps (צעדים)

export const TIMES = [
  { id: 'morning', label: 'בוקר' },
  { id: 'noon',    label: 'אחר הצהריים' },
  { id: 'evening', label: 'ערב' }
]

// משפט קבוע מתחת לשם החלון ב"היום שלי" (wireframe, 2026-10-07)
export const TAGLINES = {
  morning: 'מתחילים את היום באנרגיה טובה',
  noon:    'ממשיכים בקצב שלך',
  evening: 'מסיימים את היום ברוגע'
}

export const DEFAULT_WINDOWS = {
  morning: { start: '06:30', end: '07:45' },
  noon:    { start: '14:00', end: '17:00' },
  evening: { start: '19:00', end: '20:30' }
}

export function memberWindows(member) {
  const own = member?.windows || {}
  const out = {}
  for (const t of TIMES) out[t.id] = { ...DEFAULT_WINDOWS[t.id], ...(own[t.id] || {}) }
  return out
}

export const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

export const DAYS_RULES = [
  { id: 'every_day',         label: 'כל יום' },
  { id: 'school_days',       label: 'ימי לימודים' },
  { id: 'weekend',           label: 'סופ״ש' },
  { id: 'before_school_day', label: 'לפני יום לימודים' }
]

// הימים שכלל מכסה בשבוע רגיל, בלי חופשות. לתיבות הימים בטופס
export function ruleWeekdays(rule, custom = []) {
  switch (rule) {
    case 'every_day':
    case 'inherit':           return [0, 1, 2, 3, 4, 5, 6]
    case 'school_days':       return [0, 1, 2, 3, 4]
    case 'weekend':           return [5, 6]
    case 'before_school_day': return [6, 0, 1, 2, 3]
    default:                  return custom
  }
}

export function rulesText(rule, custom = []) {
  if (rule === 'custom') return custom.length ? 'ימים ' + custom.map(d => DAY_LETTERS[d]).join(' ') : 'אף יום'
  if (rule === 'inherit') return 'כל יום' // צעדים ישנים, לפני 2026-10-07
  return DAYS_RULES.find(r => r.id === rule)?.label || rule
}

export const ERRORS = {
  no_members:          'צריך לבחור לפחות בן משפחה אחד',
  no_days:             'צריך לבחור לפחות יום אחד',
  step_without_label:  'צריך לתת להרגל שם',
  invalid_time:        'השעה לא תקינה',
  invalid_windows:     'שעת הסיום צריכה להיות אחרי שעת ההתחלה',
  invalid_points:      'מספר הנקודות לא תקין',
  invalid_duration:    'משך הזמן צריך להיות בין 1 ל-600 דקות'
}
