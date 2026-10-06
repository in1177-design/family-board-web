// שמות בממשק למשימות: תאריכים וחזרה
import { DAY_LETTERS } from '../Routines/labels'

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export function addDays(date, n) {
  const t = new Date(date + 'T00:00:00Z')
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10)
}

export const weekdayOf = (date) => new Date(date + 'T00:00:00Z').getUTCDay()
const dm = (date) => `${Number(date.slice(8))}.${Number(date.slice(5, 7))}`

// "היום", "מחר", "אתמול", או "יום ה׳ 9.10"
export function dateText(date, today) {
  if (!date) return 'בלי תאריך'
  if (date === today) return 'היום'
  if (date === addDays(today, 1)) return 'מחר'
  if (date === addDays(today, -1)) return 'אתמול'
  return `יום ${DAY_LETTERS[weekdayOf(date)]} ${dm(date)}`
}

const WORK_WEEK = [0, 1, 2, 3, 4]

export function repeatText(r) {
  if (!r) return ''
  const n = r.every || 1
  switch (r.unit) {
    case 'day':   return n === 1 ? 'כל יום' : `כל ${n} ימים`
    case 'week': {
      const days = r.weekdays || []
      if (n === 1 && days.join() === WORK_WEEK.join()) return 'כל יום חול'
      const list = days.map(d => DAY_LETTERS[d]).join(' ')
      return (n === 1 ? 'כל שבוע' : `כל ${n} שבועות`) + ` ב${list}`
    }
    case 'month': return (n === 1 ? 'כל חודש' : `כל ${n} חודשים`) + ` ב-${r.day}`
    case 'year':  return (n === 1 ? 'כל שנה' : `כל ${n} שנים`) + ` ב-${r.day}.${r.month}`
    default:      return ''
  }
}

// האפשרויות המהירות, לפי התאריך של המשימה (כמו ב-To Do)
export function repeatPresets(date) {
  const wd = weekdayOf(date)
  const day = Number(date.slice(8))
  const month = Number(date.slice(5, 7))
  return [
    { id: 'day',      label: 'כל יום',                         repeat: { unit: 'day', every: 1 } },
    { id: 'week',     label: `כל שבוע ביום ${DAY_NAMES[wd]}`,  repeat: { unit: 'week', every: 1, weekdays: [wd] } },
    { id: 'workweek', label: 'כל יום חול (א׳–ה׳)',              repeat: { unit: 'week', every: 1, weekdays: WORK_WEEK } },
    { id: 'month',    label: `כל חודש ב-${day}`,                repeat: { unit: 'month', every: 1, day } },
    { id: 'year',     label: `כל שנה ב-${day}.${month}`,        repeat: { unit: 'year', every: 1, month, day } }
  ]
}
