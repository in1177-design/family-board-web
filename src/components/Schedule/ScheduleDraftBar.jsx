import React from 'react'
import PixelButton from '../shared/PixelButton'
import { DAY_SHORT } from './WeeklySchedule'

// הפס מעל טיוטה מתמונה (2026-10-18): הטיוטה מוצגת במערכת עצמה, כמו שתיראה אחרי השמירה (המשתמשת בחרה).
// כאן: כמה נקרא ומה לבדוק. השמירה והביטול בפס שנדבק לתחתית המסך (DraftActions), כדי שיהיו קרובים
// גם כשגוללים לחוגים למטה (המשתמשת, 2026-10-18: "כפתור השמירה מאוד רחוק מהחוגים"). שום דבר לא נשמר עד "שמירת המערכת"
const WARNINGS = {
  activity_needs_time: 'לחוג חסרה שעה',
  lesson_needs_period_or_time: 'לשיעור חסר מספר',
  missing_title: 'חסר שם',
  bad_time: 'שעה לא תקינה',
  bad_period: 'מספר שיעור לא תקין',
  bad_weekday: 'יום לא ברור'
}

function warningText(w) {
  const where = [
    DAY_SHORT[w.weekday] ? 'יום ' + DAY_SHORT[w.weekday] : '',
    w.period !== null && w.period !== undefined ? 'שיעור ' + w.period : ''
  ].filter(Boolean).join(', ')
  const what = w.type === 'unreadable' ? (w.note || 'לא נקרא')
    : w.type === 'period' ? 'שעת צלצול לא נקראה'
    : (WARNINGS[w.note] || 'לא נקרא')
  return [where, w.title ? `"${w.title}"` : '', what].filter(Boolean).join(': ')
}

// חוגים בלבד: כמה חוגים חדשים נקראו. אחרת: מה יש בטיוטה
function countsOf(draft) {
  if (draft.scope === 'activities') return `${draft.readItems} חוגים חדשים`
  const lessons = draft.items.filter(i => i.kind === 'lesson').length
  const activities = draft.items.length - lessons
  return [
    `${lessons} שיעורים`,
    activities ? `${activities} חוגים` : '',
    draft.readPeriods ? `${draft.periods.length} צלצולים` : ''
  ].filter(Boolean).join(' · ')
}

export default function ScheduleDraftBar({ draft, replacing }) {
  const onlyActivities = draft.scope === 'activities'
  return (
    <section className="sd-bar" aria-label="טיוטה מהתמונה">
      <div className="sd-title">
        <strong>{onlyActivities ? 'חוגים מהתמונה' : 'טיוטה מהתמונה'}</strong>
        <span>{countsOf(draft)}</span>
      </div>
      <p className="sd-hint">
        כך תיראה המערכת. לחיצה על שיעור או חוג משנה אותו, ותא ריק מוסיף שיעור.
        {replacing && ' השמירה תחליף את המערכת הקיימת.'}
        {onlyActivities && ' החוגים החדשים נוספו לחוגים הקיימים, והשיעורים לא משתנים.'}
        {!onlyActivities && !draft.readPeriods && !draft.periods.length && ' לא נמצאו שעות צלצולים, ואפשר להוסיף אותן אחרי השמירה.'}
      </p>
      {draft.warnings.length > 0 && (
        <div className="sd-warnings">
          <strong>{draft.warnings.length === 1 ? 'דבר אחד לבדיקה' : `${draft.warnings.length} דברים לבדיקה`}</strong>
          <ul>{draft.warnings.map((w, i) => <li key={i}>{warningText(w)}</li>)}</ul>
        </div>
      )}
    </section>
  )
}

// הפס שנדבק לתחתית המסך כל עוד יש טיוטה: מה נקרא, שגיאת שמירה, ביטול ושמירה
export function DraftActions({ draft, saving, error, onSave, onCancel }) {
  return (
    <div className="sd-float" role="region" aria-label="שמירת הטיוטה">
      <div className="sd-float-text">
        <strong>{draft.scope === 'activities' ? 'חוגים מהתמונה' : 'טיוטה מהתמונה'}</strong>
        <span>{error ? <span className="sd-error" role="alert">{error}</span> : countsOf(draft) + ' · עוד לא נשמר'}</span>
      </div>
      <div className="sd-actions">
        <PixelButton variant="secondary" onClick={onCancel} disabled={saving}>ביטול</PixelButton>
        <PixelButton variant="main" onClick={onSave} disabled={saving}>{saving ? 'שומר...' : 'שמירה'}</PixelButton>
      </div>
    </div>
  )
}
