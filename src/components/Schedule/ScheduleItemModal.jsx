import React, { useState } from 'react'
import { api } from '../../store'
import Modal from '../shared/Modal'
import PixelButton from '../shared/PixelButton'
import Icon from '../shared/Icon'
import { DAY_NAMES, DAY_SHORT } from './WeeklySchedule'
import { COLOR_CHOICES } from './subjects'
import IconPicker from '../shared/IconPicker'

// עריכה של שיעור או חוג אחד מהטבלה (2026-10-12): במצב עריכה לוחצים על תא, ונפתח החלון הזה.
// חוג: שם, מדריך, מיקום, ימים, שעות וצבע. שיעור: שם, מורה, צבע, ושעה חריגה (בלי: השעה מהצלצולים).
// "שינוי לכל השיעורים בשם הזה": השם, המורה, המיקום, האייקון והצבע עוברים לכל הפריטים מאותו סוג עם אותו שם (למשל כל המתמטיקה).
// השעה והיום משתנים רק בפריט שנלחץ.
// item: פריט קיים, או טיוטה ({ kind, weekday, period }) מלחיצה על תא ריק או על "+ חוג". items: כל הפריטים של בן המשפחה
// הצבעים: קבוצות המקצועות (subjects.js). "לפי השם": בלי צבע שמור, והצבע לפי שם השיעור.
// ops: לאן נשמר השינוי. ברירת מחדל: השרת (api.schedule). בטיוטה מתמונה (2026-10-18): עותק מקומי, שנשמר רק ב"שמירת המערכת"
//
// עיצוב מחדש לחוג (המשתמשת, 2026-10-18: "החלון ממש לא ברור, במיוחד שעות"):
// האייקון באותה שורה עם השם; מדריך ומיקום; ימים ככפתורי א׳–ש׳, וכמה ימים בבת אחת יוצרים חוג לכל יום;
// שעות עם "מתחיל" ו"נגמר" והמשך; מחיקה עם אייקון פח.
// לפי הסקיצה של המשתמשת (2026-10-18, 1–6): כותרות לחלקים, "(רשות)", ✓ בצבע שנבחר, יום נבחר עם קו תחתון חזק,
// שורת סיכום של מה שיישמר, כותרת "עריכת חוג" או "חוג חדש", וכפתורים "שמירת שינויים" ו"מחיקת חוג".
// שיעור (המשתמשת, 2026-10-18): אותו חלון, עם מיקום (ריק = בית הספר) וכפתורי ימים: אותו שיעור, באותו מספר שיעור,
// בכל יום שנבחר. בלי שורת הסיכום ("נראה שזה מבלבל")
const ERRORS = {
  missing_title: 'צריך לתת שם',
  bad_time: 'שעה לא תקינה, או שעת סיום לפני ההתחלה',
  activity_needs_time: 'לחוג צריך שעת התחלה',
  lesson_needs_period_or_time: 'לשיעור צריך מספר שיעור או שעה',
  bad_color: 'הצבע לא תקין',
  no_days: 'צריך לבחור לפחות יום אחד'
}

// המשך ליד השעות, כדי שיהיה ברור מה נבחר: "שעה ו-15 דק׳"
function duration(start, end) {
  if (!start || !end || end <= start) return ''
  const [h1, m1] = start.split(':').map(Number)
  const [h2, m2] = end.split(':').map(Number)
  const min = h2 * 60 + m2 - (h1 * 60 + m1)
  const h = Math.floor(min / 60)
  const m = min % 60
  return [h ? (h === 1 ? 'שעה' : `${h} שעות`) : '', m ? `${m} דק׳` : ''].filter(Boolean).join(' ו-')
}

// מורה שכתוב בתוך השם, למשל "מתמטיקה - קארין" בלי מורה (המשתמשת, 2026-10-18: "המורה אמורה להיות כתובה בשדה של מורה,
// ובכותרת רק שם השיעור"). מפצלים רק כשמה שאחרי המקף הוא מורה שכבר מופיע אצל אותו בן משפחה, כדי ש"אמירים - מתמטיקה"
// או "גו - פד" לא יתפצלו. השמירה מתקנת את הנתונים
function splitTeacher(item, items) {
  if (item.teacher || !item.title) return { title: item.title || '', teacher: item.teacher || '' }
  const m = item.title.match(/^(.*\S)\s*[-–]\s*(\S.*)$/)
  if (!m) return { title: item.title, teacher: '' }
  const teachers = new Set(items.map(i => (i.teacher || '').trim()).filter(Boolean))
  return teachers.has(m[2].trim()) ? { title: m[1].trim(), teacher: m[2].trim() } : { title: item.title, teacher: '' }
}

// periods: מערכת הצלצולים. בשיעור, השעות בחלון מוצגות לפי הצלצול (המשתמשת, 2026-10-18: "שעה לא מוגדרת כשלוחצים על עריכה"),
// ונשמרות כשעה חריגה רק אם שינו אותן
export default function ScheduleItemModal({ member, item, items = [], periods = [], onClose, onSaved, ops = api.schedule }) {
  const isNew = !item.id
  const lesson = item.kind === 'lesson'
  const [split] = useState(() => splitTeacher(item, items))
  const [title, setTitle] = useState(split.title)
  const [teacher, setTeacher] = useState(split.teacher)
  const [location, setLocation] = useState(item.location || '')
  const [icon, setIcon] = useState(item.icon || '')
  const [color, setColor] = useState(item.color || null)
  // פריטים אחרים מאותו סוג ובאותו שם (לפי השם לפני השינוי)
  const sameName = isNew ? [] : items.filter(i => i.id !== item.id && i.kind === item.kind && i.title.trim() === item.title.trim())
  const [toAll, setToAll] = useState(false)
  const bell = lesson ? periods.find(p => p.period === item.period) : null
  const [start, setStart] = useState(item.start_time || (lesson ? bell?.start_time || '' : '16:00'))
  const [end, setEnd] = useState(item.end_time || (lesson ? bell?.end_time || '' : '17:00'))
  // שיעור בשעות של הצלצול: נשמר בלי שעה משלו, כדי ששינוי בצלצולים ישנה גם אותו
  const byBell = lesson && bell && start === bell.start_time && end === bell.end_time
  // חוג: כמה ימים. היום של החוג נשאר שלו, וכל יום נוסף יוצר עותק
  const [days, setDays] = useState([item.weekday])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleDay = (d) => setDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d].sort())
  const what = lesson ? 'שיעור' : 'חוג'
  // כותרת לפי העיצוב של המשתמשת: שורה קטנה ("עריכת חוג"), ומתחתיה השם בגדול, שמתעדכן בזמן ההקלדה
  const eyebrow = lesson
    ? `${isNew ? 'שיעור חדש' : 'עריכת שיעור'} · שיעור ${item.period}`
    : (isNew ? 'הוספת חוג' : 'עריכת חוג')
  const heading = title.trim() || (isNew ? (lesson ? 'שיעור חדש' : 'חוג חדש') : item.title)

  const run = async (action) => {
    setSaving(true)
    setError('')
    try {
      await action()
      onSaved()
      onClose()
    } catch (e) {
      setError(ERRORS[e.message] || 'לא הצלחתי לשמור. ' + (e.message || ''))
      setSaving(false)
    }
  }

  const iconChange = icon !== (item.icon || '') ? { icon: icon || null } : {}
  const save = () => run(async () => {
    const body = {
      kind: item.kind, period: lesson ? item.period : null,
      start_time: byBell ? null : start || null, end_time: byBell ? null : end || null, title,
      teacher: teacher || null, location: location || null, color,
      // האייקון נשלח רק כששונה, כדי ששמירה תעבוד גם לפני שמריצים את 012
      ...iconChange
    }
    // שיעור וחוג: אותו דבר. הפריט נשאר ביום שלו אם עדיין נבחר, אחרת עובר לראשון שנבחר, וכל יום נוסף: פריט חדש
    if (!days.length) throw new Error('no_days')
    const own = isNew ? null : (days.includes(item.weekday) ? item.weekday : days[0])
    if (!isNew) await ops.update({ id: item.id, ...body, weekday: own })
    for (const d of days.filter(d => d !== own)) {
      await ops.create({ member_id: member.id, ...body, weekday: d, ...(icon ? { icon } : {}) })
    }
    // לכל השאר באותו שם: שם, מורה, מיקום (המשתמשת, 2026-10-18), אייקון וצבע. השעה והיום נשארים שלהם
    if (toAll) {
      for (const other of sameName) {
        await ops.update({
          id: other.id, kind: other.kind, weekday: other.weekday, period: other.period,
          start_time: other.start_time, end_time: other.end_time,
          title, teacher: teacher || null, location: location || null, color, ...iconChange
        })
      }
    }
  })
  const remove = () => {
    if (!confirm(`למחוק את "${item.title}"?`)) return
    run(() => ops.delete(item.id))
  }

  const length = duration(start, end)
  const saveLabel = !isNew ? 'שמירת שינויים' : days.length > 1 ? `הוספת ${days.length} ${lesson ? 'שיעורים' : 'חוגים'}` : `הוספת ${what}`
  const optional = <span className="sim-optional">(רשות)</span>

  return (
    <Modal title={heading} eyebrow={eyebrow} onClose={onClose}>
      <div className="pl-col pl-schedule-item-modal" style={{ gap: 18 }}>
        <section className="sim-section">
          {/* שם ואייקון באותה שורה. בלי בחירה: אין אייקון בכרטיס */}
          <div className="pl-col" style={{ gap: 6 }}>
            <strong>שם ה{what}</strong>
            <div className="sim-name">
              <IconPicker value={icon} onChange={setIcon} noneLabel="בלי אייקון" />
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={lesson ? 'מתמטיקה' : 'שחייה'} autoFocus aria-label="שם" />
            </div>
          </div>
          {/* מיקום: בשיעור, ריק = בית הספר (המשתמשת, 2026-10-18) */}
          <div className="sim-pair">
            <label className="pl-col" style={{ gap: 6 }}>
              <strong>{lesson ? 'מורה' : 'מדריך/ה'} {optional}</strong>
              <input type="text" value={teacher} onChange={e => setTeacher(e.target.value)} placeholder={lesson ? 'שם המורה' : 'שם המדריך/ה'} />
            </label>
            <label className="pl-col" style={{ gap: 6 }}>
              <strong>מיקום {optional}</strong>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={lesson ? 'בית הספר' : 'למשל: בריכת העירייה'} />
            </label>
          </div>
        </section>

        <section className="sim-section">
          <h3>ימים ושעות</h3>
          <div className="pl-col" style={{ gap: 6 }}>
              <span className="pl-muted">{lesson
                ? `אפשר לבחור כמה ימים. השיעור יופיע כשיעור ${item.period} בכל יום שנבחר.`
                : 'אפשר לבחור כמה ימים. השעות זהות בכל הימים שנבחרו.'}</span>
              <div className="sim-days" role="group" aria-label="ימים">
                {DAY_SHORT.map((d, i) => (
                  <button key={i} type="button" className={'sim-day' + (days.includes(i) ? ' sim-day-on' : '')}
                    aria-pressed={days.includes(i)} title={DAY_NAMES[i]} onClick={() => toggleDay(i)}>
                    {d}
                  </button>
                ))}
              </div>
          </div>
          {lesson && <span className="pl-muted">{!bell
            ? `אין צלצול לשיעור ${item.period}. אפשר לתת לו שעה כאן, או להוסיף צלצולים.`
            : byBell ? `לפי הצלצולים של שיעור ${item.period}. שינוי כאן יהיה שעה חריגה לשיעור הזה.`
            : 'שעה חריגה לשיעור הזה.'}</span>}
          <div className="sim-times">
            <label className="pl-col sim-time">
              <span>מתחיל</span>
              <input type="time" value={start} onChange={e => setStart(e.target.value)} />
            </label>
            <span className="sim-time-arrow" aria-hidden="true">←</span>
            <label className="pl-col sim-time">
              <span>נגמר</span>
              <input type="time" value={end} onChange={e => setEnd(e.target.value)} />
            </label>
            {length && <span className="pl-chip sim-length">משך: {length}</span>}
            {lesson && bell && !byBell && <button className="pl-link" onClick={() => { setStart(bell.start_time); setEnd(bell.end_time) }}>חזרה לשעה לפי הצלצולים</button>}
          </div>
          {/* בלי שורת הסיכום הטורקיזית (המשתמשת, 2026-10-18): הימים והשעות כבר מסומנים למעלה */}
          {!days.length && <span className="sd-error">עוד לא נבחר יום</span>}
        </section>

        <section className="sim-section">
          <h3>צבע</h3>
          <div className="pl-row pl-schedule-colors" role="radiogroup" aria-label="צבע">
            {COLOR_CHOICES.map(c => (
              <span key={c.label} className="sim-swatch">
                <button role="radio" aria-checked={color === c.value} title={c.label} aria-label={c.label}
                  className={'pl-schedule-swatch' + (color === c.value ? ' pl-schedule-swatch-on' : '') + (c.value ? '' : ' pl-schedule-swatch-none')}
                  style={c.value ? { background: c.value } : undefined} onClick={() => setColor(c.value)}>
                  {color === c.value && <span className="sim-check" aria-hidden="true">✓</span>}
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* סקציה רגילה, בלי רקע ומסגרת (המשתמשת, 2026-10-18) */}
        {sameName.length > 0 && (
          <section className="sim-section">
            <label className="pl-row sim-to-all">
              <input type="checkbox" checked={toAll} onChange={e => setToAll(e.target.checked)} />
              <span>
                שינוי לכל {lesson ? 'השיעורים' : 'החוגים'} בשם "{item.title}" ({sameName.length + 1})
                <span className="pl-muted" style={{ display: 'block' }}>השם, {lesson ? 'המורה' : 'המדריך/ה'}, המיקום, האייקון והצבע. השעה והיום משתנים רק כאן.</span>
              </span>
            </label>
          </section>
        )}

        {error && <p className="pl-sub pl-sub-warn" role="alert">{error}</p>}
        {/* כמו בסקיצה: שמירה וביטול בצד אחד, ומחיקה בצד השני */}
        <div className="sim-footer">
          <div className="pl-row">
            <PixelButton variant="main" onClick={save} disabled={saving}>{saving ? 'שומר...' : saveLabel}</PixelButton>
            <PixelButton variant="secondary" onClick={onClose}>ביטול</PixelButton>
          </div>
          {!isNew && <button className="sim-delete" onClick={remove} disabled={saving}><Icon name="trash" />מחיקת {what}</button>}
        </div>
      </div>
    </Modal>
  )
}
