// המערכת לתצוגה, מחושבת בדפדפן: אותה לוגיקה כמו buildWeek ב-family_Board_server/lib/schedule.js.
// בשימוש לטיוטה מתמונה (2026-10-18), שעוד לא נשמרה ולכן אין לה week מהשרת. שינוי כאן צריך להיות גם שם

function timeOf(item, byNumber) {
  if (item.start_time) return { start: item.start_time, end: item.end_time || null }
  const p = item.period !== null && item.period !== undefined ? byNumber.get(item.period) : null
  return p ? { start: p.start_time, end: p.end_time } : { start: null, end: null }
}

export function buildWeek(items = [], periods = []) {
  const byNumber = new Map(periods.map(p => [p.period, p]))
  const withTime = (i) => { const t = timeOf(i, byNumber); return { ...i, start: t.start, end: t.end } }
  const byStart = (a, b) => (a.start || '99:99').localeCompare(b.start || '99:99')

  return Array.from({ length: 7 }, (_, weekday) => {
    const today = items.filter(i => i.weekday === weekday).map(withTime)
    const lessons = today.filter(i => i.kind === 'lesson')
      .sort((a, b) => (a.period ?? 99) - (b.period ?? 99) || byStart(a, b))
    const activities = today.filter(i => i.kind === 'activity').sort(byStart)
    const timed = lessons.filter(l => l.start)
    const school = timed.length
      ? { start: timed.map(l => l.start).sort()[0], end: timed.map(l => l.end || l.start).sort().at(-1) }
      : null
    return { weekday, lessons, activities, school }
  })
}
