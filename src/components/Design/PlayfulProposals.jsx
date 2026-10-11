import React, { useEffect, useRef, useState } from 'react'
import { StepCard, WindowCard } from '../MyDay/MyDay'
import { TAGLINES } from '../Routines/labels'
import Icon from '../shared/Icon'
import { Blocks } from '../shared/MemberHero'

// הצעות לעיצוב המשחקי (ניסוי Impeccable, 2026-10-11): כל הצעה מוצגת "היום" מול "מוצע",
// עם הרכיבים האמיתיים. הכללים ב-styles/proposals.css, וחלים רק בתוך .pp-on.
// לחיצות כאן משנות רק את הדוגמאות, לא נתונים

const WINDOW = { start: '06:30', end: '07:45' }
const STEPS = [
  { id: 'p1', label: 'לצחצח שיניים', library_step_id: 'lib-m-teeth', days_rule: 'every_day', points: 2, done: true, time_today: null, exact_time: null },
  { id: 'p2', label: 'להתלבש', days_rule: 'every_day', points: 2, done: false, time_today: null, exact_time: null },
  { id: 'p3', label: 'להכין תיק לבית הספר', library_step_id: 'lib-m-bag', days_rule: 'before_school_day', points: 5, done: false, time_today: '07:30', exact_time: '07:30' }
]
const NAV = [['sun', 'היום שלי'], ['calendar', 'יומן'], ['star', 'ניקוד']]
const NAV_VARS = { '--hdr-lilac': '#C9B8E6', '--hdr-green': '#2FB36B', '--hdr-green-dark': '#1E7A47' }

export default function PlayfulProposals({ theme }) {
  const [unit, setUnit] = useState(3)
  const on = 'pp-on' + (unit === 2 ? ' pp-u2' : '')

  if (theme !== 'pixel') {
    return <p className="pl-muted">ההצעות הן לעיצוב המשחקי. כדי לראות אותן, החליפי לעיצוב המשחקי (בפרופיל או בכפתור שבפס).</p>
  }

  return (
    <div className="pl-col" style={{ gap: 28 }}>
      <p className="pl-muted">
        כל הצעה מוצגת כמו שהיא היום, ולידה המוצע. הרכיבים אמיתיים, והלחיצות משנות רק את הדוגמאות.
        האפליקציה עצמה לא השתנתה.
      </p>

      <Proposal n={1} title="יחידת פיקסל אחת" text="כל קו, מדרגה וצל בכפולות של יחידה אחת. ב-3 זה עבה ו&quot;משחקי&quot; יותר, ב-2 עדין יותר. בחרי בעיניים, בטלפון ובמחשב.">
        <div className="pp-units">
          <span>יחידה:</span>
          {[2, 3].map(u => (
            <button key={u} className={unit === u ? 'pl-primary' : ''} aria-pressed={unit === u} onClick={() => setUnit(u)}>{u}px</button>
          ))}
          <span className="pl-muted">חל על כל ה&quot;מוצע&quot; בדף.</span>
        </div>
      </Proposal>

      <Proposal n={2} title="בלי פינות עגולות" text="בעולם פיקסלים אין עיגול חלק. פריטים קטנים (תגיות, שעה, תיבה, פסים) בפינה ישרה, וכרטיסים במדרגה אחת בכל פינה.">
        <Pair on={on}>
          {() => (
            <WindowCard
              id="morning" label="בוקר" tagline={TAGLINES.morning} window={WINDOW}
              steps={STEPS} todos={[]} today="2026-10-11" now="07:00" windowOver={false} streak={3}
              onToggleTodo={noop} onEditTodo={noop} onMark={noop} onSetTime={noop} onAdd={noop}
            />
          )}
        </Pair>
      </Proposal>

      <Proposal n={3} title="צבע פעולה אחד" text="טורקיז = אפשר ללחוץ: הכפתור הראשי, המסך הנוכחי ו&quot;+ הוספה&quot;. הירוק של הלשונית יוצא. הטורקיז כהה יותר, כדי שטקסט לבן עליו יהיה קריא (היום 3:1, מוצע 4.75:1).">
        <Pair on={on}>
          {() => (
            <div className="pl-col" style={{ gap: 14 }}>
              <div className="pp-nav" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, ...NAV_VARS }}>
                {NAV.map(([icon, label], i) => (
                  <button key={label} className="hdr-nav-btn" aria-current={i === 0 ? 'page' : undefined}>
                    <Icon name={icon} />{label}
                  </button>
                ))}
              </div>
              <div className="pl-row" style={{ gap: 16 }}>
                <button className="pl-primary">+ הוספת משימה</button>
                <button className="pl-link">+ הוספה</button>
                <Blocks percent={60} />
              </div>
            </div>
          )}
        </Pair>
      </Proposal>

      <Proposal n={4} title="מה שבוצע &quot;נאסף&quot;" text="במקום קו ואפור: רקע חם, האייקון והנקודות בזהב, והשם נשאר קריא (היום 2.4:1). לחצי על התיבות כדי לראות את שני המצבים.">
        <Pair on={on}>
          {() => <StepList />}
        </Pair>
      </Proposal>

      <Proposal n={5} title="אנימציה בסימון" text="התיבה קופצת, האייקון מקפץ, &quot;+2&quot; עולה, והמונה סופר. תנועה במדרגות (כמו במשחקים ישנים), עד חצי שנייה, ולא חוסמת את הסימון הבא. מי שביקש במכשיר פחות תנועה מקבל רק את שינוי הצבע.">
        <div className={on + " pp-wide"} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="pp-tag pp-tag-new">מוצע</span>
          <AnimatedDemo />
        </div>
      </Proposal>
    </div>
  )
}

const noop = () => {}

function Proposal({ n, title, text, children }) {
  return (
    <div className="pl-col" style={{ gap: 12 }}>
      <h3 style={{ margin: 0 }}>{n}. {title}</h3>
      <p className="pl-muted" style={{ margin: 0, maxWidth: '65ch' }}>{text}</p>
      {children}
    </div>
  )
}

// "היום" ו"מוצע" זה ליד זה. children היא פונקציה, כדי שכל צד יקבל עותק משלו (עם state משלו)
function Pair({ on, children }) {
  return (
    <div className="pp-pair">
      <div><span className="pp-tag">היום</span>{children()}</div>
      <div className={on}><span className="pp-tag pp-tag-new">מוצע</span>{children()}</div>
    </div>
  )
}

function StepList() {
  const [steps, setSteps] = useState(STEPS)
  const toggle = (s) => {
    setSteps(list => list.map(x => x.id === s.id ? { ...x, done: !x.done } : x))
  }
  return (
    <div className="pl-col" style={{ gap: 8 }}>
      {steps.map(s => <StepCard key={s.id} step={s} window={WINDOW} now="07:00" onChange={() => toggle(s)} onSetTime={noop} />)}
    </div>
  )
}

// ההדגמה של האנימציה: מונה נקודות כמו בכותרת, פס קוביות, ושורות שאפשר לסמן
function AnimatedDemo() {
  const [steps, setSteps] = useState(STEPS.map(s => ({ ...s, done: false })))
  const [points, setPoints] = useState(18)
  const [shown, setShown] = useState(18)
  const [just, setJust] = useState(null)
  const [bump, setBump] = useState(false)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // המונה סופר אחד-אחד עד הערך החדש
  useEffect(() => {
    if (shown === points) return
    const t = setTimeout(() => {
      setShown(v => v + Math.sign(points - v))
      setBump(true)
      timers.current.push(setTimeout(() => setBump(false), 120))
    }, 90)
    timers.current.push(t)
  }, [shown, points])

  const toggle = (s) => {
    setSteps(list => list.map(x => x.id === s.id ? { ...x, done: !x.done } : x))
    setPoints(p => p + (s.done ? -s.points : s.points))
    if (!s.done) {
      setJust(s.id)
      timers.current.push(setTimeout(() => setJust(j => j === s.id ? null : j), 650))
    }
  }

  const done = steps.filter(s => s.done).length
  const reset = () => { setSteps(STEPS.map(s => ({ ...s, done: false }))); setPoints(18); setShown(18) }

  return (
    <div className="pl-col" style={{ gap: 12, maxWidth: 420 }}>
      <div className="pl-row" style={{ gap: 12, justifyContent: 'space-between' }}>
        <span className={'pp-hud pp-card' + (bump ? ' pp-bump' : '')}>
          <Icon name="star" /><b>{shown}</b><span className="pl-muted">הנקודות שלי</span>
        </span>
        <Blocks percent={Math.round(done / steps.length * 100)} />
      </div>
      {steps.map(s => (
        <div key={s.id} className={'pp-anim-row' + (just === s.id ? ' pp-just' : '')}>
          <StepCard step={s} window={WINDOW} now="07:00" onChange={() => toggle(s)} onSetTime={noop} />
          {just === s.id && <span className="pp-float">+{s.points}</span>}
        </div>
      ))}
      <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={reset}>להתחיל מחדש</button>
    </div>
  )
}
