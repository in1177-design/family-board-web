import React, { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { memberPhoto } from './memberPhoto'
import Icon from './Icon'
import ThemeToggle from './ThemeToggle'

const GREETINGS = { morning: 'בוקר טוב', noon: 'צהריים טובים', evening: 'ערב טוב' }

// הברכה לפי השעה, כמו במסך הבית. לא לפי חלונות ההרגלים: ב-12:00 החלון האחרון שהתחיל עוד יכול להיות הבוקר
const windowByClock = (now) => {
  const h = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hourCycle: 'h23' }))
  return h < 12 ? 'morning' : h < 17 ? 'noon' : 'evening'
}

// Hero בראש המסך של בן משפחה, ילד או הורה (wireframe, 2026-10-07):
// בצד אחד תמונה עם אחוז ההתקדמות של היום, "היום של...", ברכה ומשפט. בצד השני תאריך, שעה, והנקודות.
// summary: מ-daySummary ב"היום שלי" ({ done, total }). בלשוניות אחרות אין אחוז.
// end: מה שמופיע ליד הנקודות (למשל תפריט)
export default function MemberHero({ member, summary, end }) {
  const { setActiveView } = useStore()
  // השעה מתעדכנת כל 30 שניות
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const photo = memberPhoto(member)
  const percent = summary?.total ? Math.round(summary.done / summary.total * 100) : null
  const greeting = GREETINGS[windowByClock(now)]

  // צבע בן המשפחה עובר כמשתנה CSS. בעיצוב הרגיל הוא הרקע, בעיצוב החדש רק טבעת סביב התמונה
  const vars = { '--member-color': member.color, '--member-shadow': member.color + '55' }

  return (
    <header className="mh" style={vars}>
      {/* בצד אחד: תמונה עם אחוז, ולידה הברכה */}
      <div className="mh-side">
        <div className="mh-photo-wrap">
          {photo
            ? <img className="mh-photo" src={photo} alt="" />
            : <span className="mh-avatar">{member.avatar}</span>}
          {percent !== null && <span className="mh-percent">{percent}%</span>}
        </div>
        <div>
          <div className="mh-kicker">היום של {member.name}</div>
          <h2 className="mh-title">{greeting}, {member.name}!</h2>
          <div className="mh-sub">{summaryText(summary)}</div>
          {/* בעיצוב החדש: פס קוביות עם האחוז. בעיצוב הרגיל מוסתר */}
          {percent !== null && (
            <div className="px-only mh-bar">
              <Blocks percent={percent} />
              <strong>{percent}%</strong>
            </div>
          )}
        </div>
      </div>

      {/* בצד השני: תאריך ושעה, הנקודות, ומה שנוסף (תפריט) */}
      <div className="mh-side mh-end">
        <div>
          <div className="mh-date">
            {now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="mh-time">
            {now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}
          </div>
        </div>
        <div className="mh-points">
          <div className="mh-points-label">הנקודות שלי</div>
          <div className="mh-points-value">
            <span className="plain-only">⭐ </span><Icon name="star" />{(member.points || 0).toLocaleString('he-IL')}
          </div>
        </div>
        {end}
        <button
          className="btn btn-ghost btn-sm mh-back"
          onClick={() => setActiveView('home')}
          aria-label="חזרה"
          title="חזרה למסך הבית"
        >
          →
        </button>
      </div>
    </header>
  )
}

// פס התקדמות מחולק ל-10 קוביות, לעיצוב החדש
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
export function AppBar({ tabs, current, onPick }) {
  return (
    <nav className="pl pl-appbar">
      <div className="pl-row">
        <strong className="pl-appbar-brand">המשפחה שלנו</strong>
        <ThemeToggle />
      </div>
      <div className="pl-appbar-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={'pl-tab' + (current === t.id ? ' pl-tab-on' : '')}
            onClick={() => onPick(t.id)}
          >
            {/* בעיצוב הרגיל: label עם אימוג'י. בעיצוב החדש: אייקון פיקסלים מעל text */}
            <span className="plain-only">{t.label}</span>
            <Icon name={t.icon} />
            <span className="px-only">{t.text}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
