import React, { useEffect, useRef, useState } from 'react'
import { StepCard, WindowCard } from '../MyDay/MyDay'
import { TodoCard } from '../MyDay/TodosSection'
import { TAGLINES } from '../Routines/labels'
import Icon from '../shared/Icon'
import { Blocks } from '../shared/MemberHero'
import PixelCard from '../shared/PixelCard'
import { WINDOW_IMAGES } from '../MyDay/icons'

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

      <Proposal n={1} status="עוד לא הוחלט" title="יחידת פיקסל אחת" text="כל קו, מדרגה וצל בכפולות של יחידה אחת. ב-3 זה עבה ו&quot;משחקי&quot; יותר, ב-2 עדין יותר. בחרי בעיניים, בטלפון ובמחשב.">
        <div className="pp-units">
          <span>יחידה:</span>
          {[2, 3].map(u => (
            <button key={u} className={unit === u ? 'pl-primary' : ''} aria-pressed={unit === u} onClick={() => setUnit(u)}>{u}px</button>
          ))}
          <span className="pl-muted">חל על כל ה&quot;מוצע&quot; בדף.</span>
        </div>
      </Proposal>

      <Proposal n={2} status="לא עכשיו (2026-10-11)" title="בלי פינות עגולות" text="בעולם פיקסלים אין עיגול חלק. פריטים קטנים (תגיות, שעה, תיבה, פסים) בפינה ישרה, וכרטיסים במדרגה אחת בכל פינה.">
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

      <Proposal n={3} status="לא עכשיו. נכנס רק &quot;+ הוספה&quot; בטורקיז כהה ובולד" title="צבע פעולה אחד" text="טורקיז = אפשר ללחוץ: הכפתור הראשי, המסך הנוכחי ו&quot;+ הוספה&quot;. הירוק של הלשונית יוצא. הטורקיז כהה יותר, כדי שטקסט לבן עליו יהיה קריא (היום 3:1, מוצע 4.75:1).">
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

      <Proposal n={4} status="נכנס לאפליקציה, בצהוב" title="מה שבוצע &quot;נאסף&quot;" text="במקום קו ואפור: רקע חם, האייקון והנקודות בזהב, והשם נשאר קריא (היום 2.4:1). לחצי על התיבות כדי לראות את שני המצבים.">
        <Pair on={on}>
          {() => <StepList />}
        </Pair>
      </Proposal>

      <Proposal n={5} status="נכנס לאפליקציה" title="אנימציה בסימון" text="התיבה קופצת, האייקון מקפץ, &quot;+2&quot; עולה, והמונה סופר. תנועה במדרגות (כמו במשחקים ישנים), עד חצי שנייה, ולא חוסמת את הסימון הבא. מי שביקש במכשיר פחות תנועה מקבל רק את שינוי הצבע.">
        <div className={on + " pp-wide"} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="pp-tag pp-tag-new">מוצע</span>
          <AnimatedDemo />
        </div>
      </Proposal>

      <Proposal n={6} status="לבחירה" title="חלון כרשימה (תצוגה ב', מתוקנת)" text="ההרגלים כרשימה בלי מסגרת לכל שורה, והמשימה בכרטיס, כדי שיהיה ברור מה קבוע ומה חד-פעמי. מה שתוקן לעומת תצוגה ב' שלמטה: מה שבוצע מקבל פס צהוב מלא (גם משימה), קו מקווקו של 2px בין ההרגלים, ושורה בגובה 52px לפחות. עם הצבע והאנימציה שכבר נכנסו. אפשר לסמן כאן, בלי לשמור.">
        <Pair right="pp-listfix" rightTag="תצוגה ב' מתוקנת">
          {(list) => <ListDemo list={list} />}
        </Pair>
      </Proposal>

      <Proposal n={7} status="לבחירה" title="מילוי צהוב כגל" text="כשמסמנים, הצהוב נשפך לאורך השורה מהתיבה עד הקצה, בשמונה קפיצות של בלוקים, כמו פס טעינה במשחק ישן (פחות מחצי שנייה). על החלון כרשימה המתוקן. סמני כאן כדי לראות.">
        <div className="pp-listfix pp-wave pp-wide" style={{ maxWidth: 420 }}>
          <ListDemo list fresh />
        </div>
      </Proposal>

      <Proposal n={8} status="לבחירה" title="להפריד בין משימות להרגלים" text="שתי דרכים, על החלון כרשימה המתוקן. משמאל: צורה שונה לתיבה (הרגל בריבוע, משימה ביהלום), בלי צבע ובלי טקסט נוסף. מימין: כותרת קטנה &quot;משימות להיום&quot;, והמשימות מתחתיה. בדרך הזו המשימות עוברות לסוף החלון, גם אם יש הרגל עם שעה מאוחרת יותר.">
        <div className="pp-pair">
          <div className="pp-listfix pp-sep-head"><span className="pp-tag pp-tag-new">כותרת קטנה</span><ListDemo list /></div>
          <div className="pp-listfix pp-sep-shape"><span className="pp-tag pp-tag-new">צורת התיבה</span><ListDemo list /></div>
        </div>
      </Proposal>

      <Proposal n={9} status="לבחירה" title="המונה והחץ בכותרת החלון" text="ארבעה עיצובים למונה (&quot;2/3&quot;) ולחץ הקיפול, כל אחד על חלון שלם עם הציור והרשימה. אפשר לסמן, והמונה מתעדכן. כשהכל מסומן החלון מתקפל, ורואים את המצב של הסוף. לחיצה על הכותרת מקפלת ופותחת.">
        <CounterIdeas />
      </Proposal>

      <Proposal n={10} status="הכל ביחד, לבחירה" title="החלון המאוחד" text="כל מה שהוחלט, בחלון אחד: רשימה בלי רווחים, צהוב עד המסגרת, גל צהוב בסימון, &quot;+2&quot; שמשתחרר, מונה מטבע, ו&quot;+ הוספה&quot; בולד. קודם כל ההרגלים ואחריהם כל המשימות (לא מעורבבים לפי שעה). המשימות בכרטיס עם תיבת יהלום, בלי התגית &quot;משימה&quot;. חדש: &quot;השלב הושלם&quot;, כשמסמנים את האחרון השמש מקפצת והמטבע קופץ עם ✓, ורק אז החלון מתקפל. לחיצה על הכותרת פותחת שוב.">
        <div className="pp-listfix pp-wave pp-sep-shape pp-merged pp-wide" style={{ maxWidth: 440 }}>
          <MergedWindow />
        </div>
      </Proposal>
    </div>
  )
}

const noop = () => {}

function Proposal({ n, title, text, status, children }) {
  return (
    <div className="pl-col" style={{ gap: 12 }}>
      <h3 style={{ margin: 0 }}>{n}. {title}{status && <span className="pl-muted" style={{ fontSize: 14, fontWeight: 400 }}> · {status}</span>}</h3>
      <p className="pl-muted" style={{ margin: 0, maxWidth: '65ch' }}>{text}</p>
      {children}
    </div>
  )
}

// "היום" ו"מוצע" זה ליד זה. children היא פונקציה, כדי שכל צד יקבל עותק משלו (עם state משלו)
// right: ה-class של הצד המוצע (ברירת מחדל: on). הצד המוצע מקבל true, כדי שהדוגמה תדע שהיא "אחרי"
function Pair({ on, right, rightTag = 'מוצע', children }) {
  return (
    <div className="pp-pair">
      <div><span className="pp-tag">היום</span>{children(false)}</div>
      <div className={right || on}><span className="pp-tag pp-tag-new">{rightTag}</span>{children(true)}</div>
    </div>
  )
}

// חלון "בוקר" עם הרגלים ומשימות שאפשר לסמן (רק בדף). list: בתצוגת רשימה
const LIST_STEPS = [
  { id: 'l1', label: 'לצחצח שיניים', library_step_id: 'lib-m-teeth', days_rule: 'every_day', points: 2, done: true, time_today: null, exact_time: null },
  { id: 'l2', label: 'להתלבש', days_rule: 'every_day', points: 2, done: false, time_today: null, exact_time: null },
  { id: 'l3', label: 'לקרוא 15 דקות', days_rule: 'school_days', duration_minutes: 15, points: 2, done: false, time_today: null, exact_time: null },
  { id: 'l4', label: 'להכין תיק לבית הספר', library_step_id: 'lib-m-bag', days_rule: 'before_school_day', points: 5, done: false, time_today: '07:30', exact_time: '07:30' }
]
const LIST_TODOS = [
  { id: 'lt1', title: 'להחזיר ספר לספרייה', due_date: '2026-10-11', due_time: '07:00', done_at: 'now' },
  { id: 'lt2', title: 'לחתום על אישור טיול', due_date: '2026-10-11', due_time: '07:20', done_at: null }
]
// fresh: מתחילים בלי שום דבר מסומן (להדגמת הגל)
function ListDemo({ list, fresh }) {
  const [steps, setSteps] = useState(() => fresh ? LIST_STEPS.map(s => ({ ...s, done: false })) : LIST_STEPS)
  const [todos, setTodos] = useState(() => fresh ? LIST_TODOS.map(t => ({ ...t, done_at: null })) : LIST_TODOS)
  return (
    <WindowCard
      id="morning" label="בוקר" tagline={TAGLINES.morning} window={WINDOW} habitList={list}
      steps={steps} todos={todos} today="2026-10-11" now="07:00" windowOver={false} streak={3}
      onMark={s => setSteps(l => l.map(x => x.id === s.id ? { ...x, done: !x.done } : x))}
      onToggleTodo={(t, done) => setTodos(l => l.map(x => x.id === t.id ? { ...x, done_at: done ? 'now' : null } : x))}
      onEditTodo={noop} onSetTime={noop} onAdd={noop} onAddTodo={noop}
    />
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
        </div>
      ))}
      <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={reset}>לאפס את ההדגמה</button>
    </div>
  )
}

// חץ פיקסלים: V מריבועים (מצביע למטה). מסתובב ב-CSS כשהחלון מקופל
function PixelChevron() {
  return (
    <svg className="pp-chev" viewBox="0 0 10 6" aria-hidden="true" shapeRendering="crispEdges">
      <path d="M0 0h2v2H0zM2 2h2v2H2zM4 4h2v2H4zM6 2h2v2H6zM8 0h2v2H8z" fill="currentColor" />
    </svg>
  )
}

const COUNTER_IDEAS = [
  { id: 'blocks', title: 'א. קוביות', text: 'קובייה לכל פריט במקום המספר, כמו פס החיים במשחק, וחץ פיקסלים שמסתובב במדרגות.' },
  { id: 'button', title: 'ב. כפתור מורם', text: 'המונה והחץ בכפתור אחד עם צל פיקסלים, בגובה 44 (קל ללחוץ). מקופל = הכפתור "לחוץ".' },
  { id: 'coin', title: 'ג. מטבע', text: 'המונה ב-Silkscreen בתגית זהב, וחץ שקופץ פעם אחת כשנוגעים. בסוף: ✓ במקום המספר.' },
  { id: 'tab', title: 'ד. לשונית', text: 'המונה בלשונית שתלויה מתחתית הכותרת, כמו לשונית של תיקייה, והחץ בתוכה.' }
]

// ארבעה עיצובים למונה ולחץ, כל אחד על חלון "בוקר" שלם: הציור, המשפט, והחלון כרשימה (המתוקן).
// אפשר לסמן, והמונה מתעדכן. כשהכל מסומן החלון מתקפל, כמו באפליקציה (רק בדף)
function CounterIdeas() {
  return (
    <div className="pp-counters">
      {COUNTER_IDEAS.map(idea => (
        <div key={idea.id} className="pl-col" style={{ gap: 8 }}>
          <strong>{idea.title}</strong>
          <span className="pl-muted" style={{ margin: 0 }}>{idea.text}</span>
          <IdeaWindow kind={idea.id} />
        </div>
      ))}
    </div>
  )
}

const IDEA_STEPS = [
  { id: 'i1', label: 'לצחצח שיניים', library_step_id: 'lib-m-teeth', days_rule: 'every_day', points: 2, done: true, time_today: null, exact_time: null },
  { id: 'i2', label: 'להתלבש', days_rule: 'every_day', points: 2, done: true, time_today: null, exact_time: null },
  { id: 'i3', label: 'להכין תיק לבית הספר', library_step_id: 'lib-m-bag', days_rule: 'every_day', points: 5, done: false, time_today: null, exact_time: null }
]

function IdeaWindow({ kind }) {
  const [steps, setSteps] = useState(IDEA_STEPS)
  const [open, setOpen] = useState(null)
  const done = steps.filter(s => s.done).length
  const total = steps.length
  const complete = done === total
  const folded = open === null ? complete : !open
  const toggle = (s) => setSteps(l => l.map(x => x.id === s.id ? { ...x, done: !x.done } : x))
  return (
    <div className="pp-listfix">
      <PixelCard className="pl-col pl-win pl-win-morning pl-win-list" style={{ gap: 10 }}>
        <button className={'pl-fold-head pp-c-' + kind + (folded ? ' pp-folded' : '') + (complete ? ' pp-complete' : '')}
          onClick={() => setOpen(folded)} aria-expanded={!folded}>
          <div className="pl-win-head">
            <img src={WINDOW_IMAGES.morning} alt="" className="pl-win-icon px-only" />
            <div>
              <strong style={{ fontSize: 'var(--pl-size-h3)' }}>{complete ? '✓ ' : ''}בוקר</strong>
              <div className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>{TAGLINES.morning}</div>
            </div>
          </div>
          <span className="pp-counter">
            {kind === 'blocks'
              ? (
                <span className="pp-mini-blocks" role="img" aria-label={`${done} מתוך ${total}`}>
                  {Array.from({ length: total }, (_, i) => <i key={i} className={i < done ? 'on' : ''} />)}
                </span>
              )
              : <span className="pp-count">{complete && kind === 'coin' ? '✓' : `${done}/${total}`}</span>}
            <PixelChevron />
          </span>
        </button>
        {!folded && steps.map(s => <StepCard key={s.id} step={s} window={WINDOW} now="07:00" onChange={() => toggle(s)} onSetTime={noop} />)}
      </PixelCard>
    </div>
  )
}

// החלון המאוחד (הצעה 10): קודם כל ההרגלים ואחריהם כל המשימות (לא מעורבבים לפי שעה כמו באפליקציה היום),
// מונה מטבע, ו"השלב הושלם" לפני שהחלון מתקפל. רק בדף
const MERGED_STEPS = [
  { id: 'm1', label: 'לצחצח שיניים', library_step_id: 'lib-m-teeth', days_rule: 'every_day', points: 2, done: true, time_today: null, exact_time: null },
  { id: 'm2', label: 'להתלבש', days_rule: 'every_day', points: 2, done: false, time_today: null, exact_time: null },
  { id: 'm3', label: 'לקרוא 15 דקות', days_rule: 'school_days', duration_minutes: 15, points: 2, done: false, time_today: null, exact_time: null },
  { id: 'm4', label: 'להכין תיק לבית הספר', library_step_id: 'lib-m-bag', days_rule: 'before_school_day', points: 5, done: false, time_today: '07:30', exact_time: '07:30' }
]
const MERGED_TODOS = [
  { id: 'mt1', title: 'להחזיר ספר לספרייה', due_date: '2026-10-12', due_time: '07:00', done_at: null },
  { id: 'mt2', title: 'לחתום על אישור טיול', due_date: '2026-10-12', due_time: '07:20', done_at: null },
  { id: 'mt3', title: 'לקחת כסף לטיול', due_date: '2026-10-12', due_time: '07:40', done_at: null }
]

function MergedWindow() {
  const [steps, setSteps] = useState(MERGED_STEPS)
  const [todos, setTodos] = useState(MERGED_TODOS)
  const [open, setOpen] = useState(null)
  const [levelUp, setLevelUp] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const done = steps.filter(s => s.done).length + todos.filter(t => t.done_at).length
  const total = steps.length + todos.length
  const complete = done === total
  // בזמן "השלב הושלם" החלון עוד פתוח, ואחר כך מתקפל מעצמו
  const folded = open === null ? complete && !levelUp : !open

  const celebrateIfLast = (doneAfter) => {
    if (doneAfter !== total) return
    setOpen(null)
    setLevelUp(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setLevelUp(false), 900)
  }
  const toggleStep = (s) => {
    setSteps(l => l.map(x => x.id === s.id ? { ...x, done: !x.done } : x))
    if (!s.done) celebrateIfLast(done + 1)
  }
  const toggleTodo = (t, isDone) => {
    setTodos(l => l.map(x => x.id === t.id ? { ...x, done_at: isDone ? 'now' : null } : x))
    if (isDone) celebrateIfLast(done + 1)
  }
  const reset = () => { setSteps(MERGED_STEPS); setTodos(MERGED_TODOS); setOpen(null); setLevelUp(false) }

  // קודם כל ההרגלים (בלי שעה לפי הסדר, אחריהם עם שעה לפי השעה), ואחריהם כל המשימות לפי השעה
  // (המשתמשת, 2026-10-12: "כשהם לפי שעה זה ממש מבלבל")
  const byTime = (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')
  const items = [
    ...steps.filter(s => !s.time_today).map(s => ({ kind: 'step', item: s })),
    ...steps.filter(s => s.time_today).map(s => ({ kind: 'step', item: s, time: s.time_today })).sort(byTime),
    ...todos.map(t => ({ kind: 'todo', item: t, time: t.due_time })).sort(byTime)
  ]

  return (
    <div className="pl-col" style={{ gap: 10 }}>
      <PixelCard className={'pl-col pl-win pl-win-morning pl-win-list' + (levelUp ? ' pp-levelup' : '')} style={{ gap: 10 }}>
        <button className={'pl-fold-head pp-c-coin' + (folded ? ' pp-folded' : '') + (complete ? ' pp-complete' : '')}
          onClick={() => setOpen(folded)} aria-expanded={!folded}>
          <div className="pl-win-head">
            <img src={WINDOW_IMAGES.morning} alt="" className="pl-win-icon px-only" />
            <div>
              <strong style={{ fontSize: 'var(--pl-size-h3)' }}>{complete ? '✓ ' : ''}בוקר</strong>
              <div className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>{TAGLINES.morning}</div>
            </div>
          </div>
          <span className="pp-counter">
            <span className="pp-count">{complete ? '✓' : `${done}/${total}`}</span>
            <PixelChevron />
          </span>
        </button>
        {!folded && <>
          {items.map(({ kind, item }) => kind === 'todo'
            ? <TodoCard key={item.id} todo={item} today="2026-10-12" inWindow onToggle={toggleTodo} onEdit={noop} />
            : <StepCard key={item.id} step={item} window={WINDOW} now="07:00" onChange={() => toggleStep(item)} onSetTime={noop} />
          )}
          <div className="pl-row" style={{ justifyContent: 'space-between' }}>
            <button className="pl-link pl-add-link">+ הוספה</button>
            <span className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>🔥 רצף של 3 ימים</span>
          </div>
        </>}
      </PixelCard>
      <button className="pl-link" style={{ alignSelf: 'flex-start' }} onClick={reset}>לאפס את ההדגמה</button>
    </div>
  )
}
