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

// כמו בשרת (lib/routines.js, החלטה 2026-10-09): בוקר עד 8, צהריים 13:00–19:30, ערב 19:00–22:00
export const DEFAULT_WINDOWS = {
  morning: { start: '06:30', end: '08:00' },
  noon:    { start: '13:00', end: '19:30' },
  evening: { start: '19:00', end: '22:00' }
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

// הימים שכלל מכסה בשבוע רגיל, בלי חופשות. לתיבות הימים בטופס.
// schoolDays: ימי הלימודים של בן המשפחה (members.school_days, 2026-10-09). בלי: א׳–ה׳
export function ruleWeekdays(rule, custom = [], schoolDays = [0, 1, 2, 3, 4]) {
  const all = [0, 1, 2, 3, 4, 5, 6]
  switch (rule) {
    case 'every_day':
    case 'inherit':           return all
    case 'school_days':       return [...schoolDays]
    case 'weekend':           return all.filter(d => !schoolDays.includes(d))
    // היום שלפני יום לימודים: d שלמחרתו ((d+1) % 7) יש לימודים
    case 'before_school_day': return all.filter(d => schoolDays.includes((d + 1) % 7))
    default:                  return custom
  }
}

// להורה אין ימי לימודים אלא ימי עבודה (המשתמשת, 2026-10-09). אותו כלל ואותו שדה (school_days), שם אחר
const PARENT_LABELS = { school_days: 'ימי עבודה', before_school_day: 'לפני יום עבודה' }

// הכללים עם השמות לבן המשפחה: role = 'parent' או 'child'
export function daysRules(role) {
  return role === 'parent' ? DAYS_RULES.map(r => ({ ...r, label: PARENT_LABELS[r.id] || r.label })) : DAYS_RULES
}

export function rulesText(rule, custom = [], role) {
  if (rule === 'custom') return custom.length ? 'ימים ' + custom.map(d => DAY_LETTERS[d]).join(' ') : 'אף יום'
  if (rule === 'inherit') return 'כל יום' // צעדים ישנים, לפני 2026-10-07
  return daysRules(role).find(r => r.id === rule)?.label || rule
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
