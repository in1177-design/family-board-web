import React, { useEffect, useRef, useState } from 'react'
import { api, useStore } from '../../store'
import { daySummary } from '../MyDay/MyDay'
import { memberPhoto } from './memberPhoto'
import Icon from './Icon'
import ThemeToggle, { useThemeName } from './ThemeToggle'
import ProfileModal from './ProfileModal'

const GREETINGS = { morning: 'בוקר טוב', noon: 'צהריים טובים', evening: 'ערב טוב' }

// הברכה לפי השעה, כמו במסך הבית. לא לפי חלונות ההרגלים: ב-12:00 החלון האחרון שהתחיל עוד יכול להיות הבוקר
const windowByClock = (now) => {
  const h = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hourCycle: 'h23' }))
  return h < 12 ? 'morning' : h < 17 ? 'noon' : 'evening'
}

// הכותרת בראש המסך של בן משפחה, ילד או הורה. מחליפה את ה-Hero של ה-wireframe (2026-10-07) מ-2026-10-10.
// summary: מ-daySummary ב"היום שלי" ({ done, total }). בלעדיו הכותרת טוענת את היום בעצמה.
// end: מה שמופיע אחרי כפתורי המסכים (תפריט ההורה)
// tabs, current, onPick: כפתורי המסכים בתוך הכותרת (handoff 1b, 2026-10-10)
export default function MemberHero({ member, summary, end, tabs, current, onPick }) {
  // השעה מתעדכנת כל 30 שניות
  const [now, setNow] = useState(() => new Date())
  const [profile, setProfile] = useState(false)
  const { setActiveView } = useStore()
  // מצויר מחדש כשמחליפים עיצוב (האייקונים מתחלפים)
  useThemeName()
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // ההתקדמות של היום מוצגת בכל המסכים, לא רק ב"היום שלי" (המשתמשת, 2026-10-10: "היא כללית בכל האפליקציה").
  // "היום שלי" מעדכן אותה (summary). כשהוא לא נטען (מסך אחר, או הורה שצופה בילד), טוענים פעם אחת את היום של בעל הכותרת
  const [ownSummary, setOwnSummary] = useState(null)
  useEffect(() => {
    if (summary) return
    let alive = true
    api.day.get(member.id).then(d => { if (alive) setOwnSummary(daySummary(d)) }).catch(() => {})
    return () => { alive = false }
  }, [member.id, !!summary])
  const today = summary || ownSummary

  // "דבוק": הכרטיס של ההתקדמות יצא מהמסך למעלה בגלילה. מפעיל את הפס הדבוק (רק בטלפון, לפי ה-CSS)
  const statsRef = useRef(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = statsRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.height || innerHeight) / 2))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const photo = memberPhoto(member)
  const percent = today?.total ? Math.round(today.done / today.total * 100) : null
  const greeting = GREETINGS[windowByClock(now)]
  const dateText = now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long', day: 'numeric', month: 'long' })
  const timeText = now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

  // צבע בן המשפחה עובר כמשתנה CSS: הטבעת סביב התמונה במעודן
  const vars = { '--member-color': member.color, '--member-shadow': member.color + '55' }
  const profileModal = profile && <ProfileModal member={member} onClose={() => setProfile(false)} />

  // הכותרת 1b מ-Claude Design (Family header/design_handoff_member_header), בשני העיצובים (2026-10-10):
  // כרטיס אחד: תמונה, ברכה, שעה, התקדמות ונקודות, ומתחת כפתורי המסכים ו-☰ (end).
  // במשחקי: פיקסלים, פס קוביות וצללים (theme-pixel.css). במעודן: אותו מבנה, נקי, עם פס התקדמות רגיל (plain.css).
  // במחשב בלי חץ חזרה ("מסך הבית" בפס שמעל). בטלפון (רפרנס מהמשתמשת, 2026-10-10): פס צבעוני עם → ו-☰ בצדדים
  // ותאריך ושעה באמצע, התמונה והברכה במרכז, ומתחת כרטיס עם ההתקדמות והנקודות. הכפתורים בפס התחתון (AppBar)
  return (
    <>
    <header className="hdr" style={vars}>
      <div className="hdr-top">
        <button className="hdr-back" onClick={() => setActiveView('home')} aria-label="חזרה" title="חזרה למסך הבית">→</button>
        <button className="hdr-avatar" onClick={() => setProfile(true)} title="הפרופיל שלי" aria-label="הפרופיל שלי">
          {photo ? <img src={photo} alt="" /> : <span className="mh-avatar">{member.avatar}</span>}
          <span className="mh-photo-edit" aria-hidden="true">✎</span>
        </button>
        <div className="hdr-greet">
          <h1>{greeting}, {member.name}!</h1>
          <span>{summaryText(today)}</span>
        </div>
        <div className="hdr-clock">
          <b>{timeText}</b>
          <span className="hdr-label">{dateText}</span>
        </div>
        {/* במחשב ההתקדמות והנקודות הם חלק מהשורה (display: contents). בטלפון כרטיס אחד מתחת לברכה */}
        <div className="hdr-stats" ref={statsRef}>
          {percent !== null && (
            <div className="hdr-progress">
              <span className="hdr-label">ההתקדמות שלי היום</span>
              <DayProgress parts={today.parts} percent={percent} />
            </div>
          )}
          <div className="hdr-points">
            <Icon name="star" />
            <div><b>{(member.points || 0).toLocaleString('he-IL')}</b><span className="hdr-label">הנקודות שלי</span></div>
          </div>
        </div>
      </div>
      {tabs && (
        <div className="hdr-nav">
          <nav aria-label="ניווט ראשי" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map(t => (
              <button key={t.id} className="hdr-nav-btn" aria-current={current === t.id ? 'page' : undefined}
                onClick={() => current !== t.id && onPick(t.id)}>
                <Icon name={t.icon} />{t.text}
              </button>
            ))}
          </nav>
          {end}
        </div>
      )}
    </header>
    {/* בטלפון, כשגוללים והכרטיס יוצא מהמסך (המשתמשת, 2026-10-10: "דבוק ולא להיעלם"): פס דבוק למעלה
        עם →, הברכה וההתקדמות, הנקודות ו-☰. בגובה 0 בדף, כדי שלא יזיז כלום. במחשב לא מוצג */}
    <div className={'hdr-mini-wrap' + (stuck ? ' hdr-mini-on' : '')} style={vars} aria-hidden={!stuck}>
      <div className="hdr-mini">
        <button className="hdr-back" onClick={() => setActiveView('home')} aria-label="חזרה" title="חזרה למסך הבית" tabIndex={stuck ? 0 : -1}>→</button>
        <div className="hdr-mini-body">
          <strong>{greeting}, {member.name}!</strong>
          {percent !== null && <DayProgress parts={today.parts} percent={percent} />}
        </div>
        <div className="hdr-points">
          <Icon name="star" />
          <b>{(member.points || 0).toLocaleString('he-IL')}</b>
        </div>
        {end}
      </div>
    </div>
    {/* מחוץ ל-header, כדי שהסגנון שלו לא יחול על החלון */}
    {profileModal}
    </>
  )
}

// פס ההתקדמות של הכותרת (המשתמשת, 2026-10-10): כל היום 12 שלבים. 3 לבוקר, 6 לצהריים, 3 לערב,
// וכל חלק מתמלא באופן יחסי למה שבוצע בו, בצבע של החלון. משימות בלי שעה או באיחור נספרות בצהריים.
// חלק שאין בו כלום היום: שלבים מקווקווים, כדי שלא ייראה כאילו משהו חסר. parts מ-daySummary
const SECTIONS = [
  { id: 'morning', cells: 3, label: 'בוקר' },
  { id: 'noon',    cells: 6, label: 'אחר הצהריים' },
  { id: 'evening', cells: 3, label: 'ערב' }
]

export function DayProgress({ parts, percent }) {
  const of = (id) => {
    const p = parts?.[id] || { done: 0, total: 0 }
    if (id !== 'noon') return p
    const t = parts?.todos || { done: 0, total: 0 }
    return { done: p.done + t.done, total: p.total + t.total }
  }
  return (
    <span className="day-progress-row">
      <span className="day-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        {SECTIONS.map(s => {
          const { done, total } = of(s.id)
          const filled = total ? Math.round(done / total * s.cells) : 0
          return (
            <span key={s.id} className={'day-progress-part day-part-' + s.id + (total ? '' : ' day-progress-none')}
              title={total ? `${s.label}: ${done} מתוך ${total}` : `${s.label}: אין היום`}>
              {Array.from({ length: s.cells }, (_, i) => <span key={i} className={i < filled ? 'on' : ''} />)}
            </span>
          )
        })}
      </span>
      <b>{percent}%</b>
    </span>
  )
}

// פס התקדמות מחולק ל-10 קוביות, לעיצוב החדש (במדריך הסגנון ובמערכת העיצוב. בכותרת: DayProgress)
export function Blocks({ percent }) {
  const on = Math.round(percent / 10)
  return (
    <span className="px-blocks" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      {Array.from({ length: 10 }, (_, i) => <span key={i} className={i < on ? 'on' : ''} />)}
    </span>
  )
}

// המשפט ב-Hero, ב"היום שלי": כמה נשאר (החלטה 2026-10-08: במקום שורת סיכום נפרדת, שחזרה על האחוז והפס).
// בלי סיכום: המשפט הקבוע
function summaryText(summary) {
  if (!summary?.total) return 'יום חדש, הזדמנות חדשה להצליח'
  const left = summary.total - summary.done
  if (left === 0) return 'סיימת הכל להיום!'
  if (summary.done === 0) return `${summary.total === 1 ? 'דבר אחד מחכה' : summary.total + ' דברים מחכים'} לך היום. בהצלחה!`
  return `נשאר${left === 1 ? '' : 'ו'} רק ${left}, עוד קצת וסיימת!`
}

// פס האפליקציה: במחשב למעלה עם "המשפחה שלנו" והלשוניות, בטלפון הלשוניות בתחתית (plain.css)
// member: בן המשפחה שבמסך. כפתור העיצוב שומר את הבחירה בפרופיל שלו
export function AppBar({ tabs, current, onPick, member }) {
  return (
    <nav className="pl pl-appbar">
      <div className="pl-row">
        <strong className="pl-appbar-brand">המשפחה שלנו</strong>
        <ThemeToggle member={member} />
      </div>
      <div className="pl-appbar-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={'pl-tab' + (current === t.id ? ' pl-tab-on' : '')}
            onClick={() => onPick(t.id)}
          >
            {/* אייקון וטקסט בשני העיצובים (2026-10-09): במעודן קו ליד הטקסט, במשחקי פיקסלים מעליו */}
            <Icon name={t.icon} />
            <span>{t.text}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
