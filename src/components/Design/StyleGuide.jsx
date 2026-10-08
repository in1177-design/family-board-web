import React, { useEffect, useState } from 'react'
import { StepCard, WindowCard, Progress } from '../MyDay/MyDay'
import { TodoCard } from '../MyDay/TodosSection'
import { TAGLINES } from '../Routines/labels'
import Icon, { ICON_NAMES } from '../shared/Icon'
import { Blocks } from '../shared/MemberHero'
import PixelCard from '../shared/PixelCard'
import PixelButton, { PIXEL_BUTTON_DEFAULTS, PIXEL_BUTTON_VARIANTS, pixelButtonVars } from '../shared/PixelButton'
import StyleLab, { FrameControls, frameParams } from './StyleLab'
import { VARIANTS, frameVars, readFrame, saveFrame } from './frame'

// מדריך סגנון (החלטה 2026-10-07): כל הרכיבים של "היום שלי", הרכיבים האמיתיים עם נתונים לדוגמה.
// מציג את העיצוב שנבחר כרגע (רגיל או חדש), ומתחלף עם הכפתור בפס האפליקציה. נפתח מהתפריט של ההורה.
// הלחיצות כאן משנות רק את הדוגמאות בדף, לא נתונים אמיתיים

const COLORS = [
  ['--pl-page', 'רקע המסך'], ['--pl-card', 'כרטיס'], ['--pl-text', 'טקסט'], ['--pl-muted', 'טקסט משני'],
  ['--pl-line', 'מסגרת'], ['--pl-control', 'מסגרת שדה'], ['--pl-soft', 'רקע משני'],
  ['--pl-accent', 'הדגשה'], ['--pl-accent-dark', 'הדגשה כהה'], ['--pl-accent-soft', 'הדגשה בהירה'],
  ['--pl-warn', 'אזהרה'], ['--pl-error', 'שגיאה'],
  ['--px-frame', 'מסגרת פיקסלים'], ['--px-shadow', 'צל פיקסלים'], ['--px-star', 'כוכב'],
  ['--px-morning', 'בוקר'], ['--px-noon', 'אחר הצהריים'], ['--px-evening', 'ערב']
]

// גופנים וגדלים: משתנים ב-plain.css (ו-theme-pixel.css לשעות)
const FONTS = [
  ['--pl-font', 'גופן ראשי (Assistant)', 'היום שלי · 0123456789'],
  ['--pl-font-time', 'שעות (Silkscreen בעיצוב החדש)', '07:30 · 16:45']
]
const SIZES = [
  ['--pl-size-h2', 'כותרת ראשית'], ['--pl-size-h3', 'כותרת משנה'],
  ['--pl-size', 'טקסט רגיל'], ['--pl-size-sm', 'טקסט קטן']
]

// כל סוגי הכפתורים באפליקציה (2026-10-08). name: השם הקבוע של הסוג, זהה כאן ובקוד. css: ה-class
const BUTTONS = [
  { title: 'ראשי', name: 'Primary', css: '.pl-primary',
    sample: <button className="pl-primary">+ הוספת משימה</button>,
    where: 'הפעולה העיקרית במסך, אחת בכל אזור: "+ הוספת משימה" ב"היום שלי", "שמור" בטפסים, "משימה חדשה" בלוח המשימות, "הרגל חדש" ו"שמור שעות" בלוח ההרגלים, אישור בבורר השעה.' },
  { title: 'משני', name: 'Secondary', css: 'button (בלי class)',
    sample: <><button>ביטול</button><button disabled>מושבת</button></>,
    where: 'פעולה משנית ליד הראשי: "ביטול" ו"מחק" בטופס הרגל, "חזרה לברירת המחדל" בלוח ההרגלים, חזרה לשעה הקבועה בבורר השעה, - ו-+ של הנקודות, ופריטי התפריט של ההורה.' },
  { title: 'קישור', name: 'Link', css: '.pl-link',
    sample: <button className="pl-link">+ הוספה</button>,
    where: 'פעולה קלה בתוך הטקסט: "+ הוספה" בתחתית חלון (פותח בחירה: הרגל או משימה), "+ הוסף משימה ל…" בלוח המשימות, שם הרגל בלוח ההרגלים.' },
  { title: 'קישור משני', name: 'MutedLink', css: '.pl-link.pl-muted',
    sample: <button className="pl-link pl-muted">הסר</button>,
    where: 'פעולה שקטה: "הסר" בתוספות של טופס המשימה, "ביטול" בבורר השעה, החיצים ↑↓ ושינוי שעות החלונות בלוח ההרגלים.' },
  { title: 'קישור מחיקה', name: 'DangerLink', css: '.pl-link.pl-danger-link',
    sample: <button className="pl-link pl-danger-link">מחק משימה</button>,
    where: 'מחיקה, מתחת ל"שמור" בטופס משימה קיימת.' },
  { title: 'אייקון', name: 'IconButton', css: '.pl-icon-button',
    sample: <><button className="pl-icon-button" aria-label="עריכה">✎</button><button className="pl-icon-button" aria-label="סגור">✕</button></>,
    where: 'פעולה בלי טקסט: ✎ עריכה בשורת משימה, ✕ סגירה בחלון מודאלי.' },
  { title: 'תגית שעה', name: 'TimeChip', css: '.pl-chip-button (+ .pl-chip-button-moved)',
    sample: <><button className="pl-chip-button">07:15</button><button className="pl-chip-button pl-chip-button-moved">07:40</button></>,
    where: 'בשורת הרגל שיש לו שעה. לחיצה פותחת את בורר השעה. כתומה כשהשעה הוזזה להיום בלבד.' },
  { title: 'קבע שעה', name: 'SetTime', css: '.pl-link.pl-muted.pl-set-time',
    sample: <button className="pl-link pl-muted pl-set-time"><span className="plain-only">קבע שעה</span><Icon name="clock" /></button>,
    where: 'בשורת הרגל בלי שעה. בעיצוב הרגיל "קבע שעה", בעיצוב החדש אייקון שעון.' },
  { title: 'בחירה', name: 'Slot', css: '.pl-slot (+ .pl-slot-on)',
    sample: <div className="pl-slots" style={{ gridTemplateColumns: 'repeat(2, 80px)' }}><button className="pl-slot pl-slot-on">היום</button><button className="pl-slot">מחר</button></div>,
    where: 'בחירה אחת מכמה: "מתי?" בטופס משימה, השעות בבורר השעה. הנבחר מלא בצבע.' },
  { title: 'תוספת', name: 'Extra', css: '.pl-extra',
    sample: <button className="pl-extra"><Icon name="clock" />הגדר שעה</button>,
    where: 'בטופס משימה והרגל, מתחת ל"מתי" / "באילו ימים": אייקון פיקסלים וטקסט. פותח סקציה (מיקום, חזרתיות, שעה, משך זמן, נקודות), ונעלם כשהיא פתוחה.' },
  { title: 'בן משפחה', name: 'WhoPicker', css: '.pl-who-item (+ .pl-who-on)',
    sample: <><button className="pl-who-item pl-who-on"><span className="pl-who-photo">🧒</span><span>ריקי</span></button><button className="pl-who-item"><span className="pl-who-photo">👩</span><span>אמא</span></button></>,
    where: '"למי?" בטופס משימה: תמונה עגולה ושם. הנבחר עם טבעת.' },
  { title: 'מחליף בן משפחה', name: 'Switcher', css: '.pl-switcher-item (+ .pl-switcher-current)',
    sample: <><button className="pl-switcher-item pl-switcher-current">ריקי</button><button className="pl-switcher-item">תומר</button></>,
    where: 'אצל ההורה, בראש "היום שלי": היום של מי מוצג.' },
  { title: 'לשונית', name: 'Tab', css: '.pl-tab (+ .pl-tab-on)',
    sample: <><button className="pl-tab pl-tab-on">היום שלי</button><button className="pl-tab">ניקוד</button></>,
    where: 'פס הלשוניות למעלה (בטלפון למטה), ובלוח ההרגלים.' },
  { title: 'כותרת מתקפלת', name: 'FoldHead', css: '.pl-fold-head',
    sample: <span className="pl-muted">ראו "חלון" למטה</span>,
    where: 'הכותרת של חלון ושל "המשימות שלי". לחיצה מקפלת ופותחת.' },
  { title: 'החלפת עיצוב', name: 'ThemeToggle', css: '.pl-theme-toggle',
    sample: <button className="pl-theme-toggle">✨ עיצוב חדש</button>,
    where: 'בפס הלשוניות. מחליף בין העיצוב הרגיל לעיצוב החדש.' },
  { title: 'ניווט בלוח שנה', name: 'CalendarNav', css: '.pl-cal-nav',
    sample: <><button className="pl-cal-nav">‹</button><button className="pl-cal-nav">›</button></>,
    where: 'החצים לחודש הקודם והבא בבורר התאריך ("יום מסוים…").' },
  { title: 'כפתור פיקסלים', name: 'PixelButton', css: '.px-btn',
    sample: <PixelButton>START</PixelButton>,
    where: 'עוד לא באפליקציה. רק במדריך (ראו "כפתור פיקסלים").' },
  { title: 'ראשי פיקסלים', name: 'Main.pixel', css: '.px-btn + variant="main"',
    sample: <PixelButton variant="main">שמור</PixelButton>,
    where: 'סוג מוכן של כפתור הפיקסלים: טורקיז מלא, טקסט בהיר, 2 מדרגות. "שמור" בטופס משימה.' },
  { title: 'משני פיקסלים', name: 'Secondary.pixel', css: '.px-btn + variant="secondary"',
    sample: <PixelButton variant="secondary">ביטול</PixelButton>,
    where: 'סוג מוכן של כפתור הפיקסלים, אפור: מסגרת אפורה בהירה, מילוי קרם, טקסט אפור כהה, מדרגה אחת. ליד Main.pixel, לפעולה משנית: "בטל" בטופס משימה.' },
  { title: 'כפתור ישן', name: 'LegacyButton', css: '.btn .btn-primary / .btn-secondary / .btn-ghost',
    sample: <><button className="btn btn-primary btn-sm">ראשי</button><button className="btn btn-secondary btn-sm">משני</button></>,
    where: 'במסכים הישנים: מסך הבית, התחברות, אשף ההתקנה, הגדרות, יומן, ניהול נקודות, ו-☰ של ההורה (global.css).' }
]

const TODAY = '2026-10-07'
const WINDOW = { start: '06:30', end: '07:45' }

const SAMPLE_STEPS = [
  { id: 's1', label: 'לצחצח שיניים', library_step_id: 'lib-m-teeth', days_rule: 'every_day', points: 2, done: true, time_today: null, exact_time: null },
  { id: 's2', label: 'לשתות כוס מים', days_rule: 'school_days', points: 5, done: false, time_today: '07:15', exact_time: '07:15' },
  { id: 's3', label: 'להכין תיק לבית הספר', library_step_id: 'lib-m-bag', days_rule: 'before_school_day', points: 10, done: false, time_today: '07:40', exact_time: '07:30' },
  { id: 's4', label: 'לסדר את החדר ולהחזיר את כל הצעצועים למקום לפני השינה', library_step_id: 'lib-n-room', days_rule: 'every_day', points: 15, done: false, time_today: null, exact_time: null }
]

const SAMPLE_TODOS = [
  { id: 't1', title: 'שיעורי בית בחשבון', due_date: TODAY, due_time: '16:30', done_at: null },
  { id: 't2', title: 'להחזיר ספר לספרייה', due_date: '2026-10-06', due_time: null, done_at: null },
  { id: 't3', title: 'לסדר את שולחן הכתיבה', due_date: null, due_time: null, repeat: { unit: 'day', every: 1 }, done_at: '2026-10-07T08:00:00Z' }
]

// מתעדכן כשמחליפים עיצוב, כדי שהצבעים בדף יתאימו
function useTheme() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'רגיל')
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(document.documentElement.dataset.theme || 'רגיל'))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return theme
}

// trial: סגנון מ"נסה במדריך" במעבדה. מוחל רק על החלונות. onClearTrial: מבטל אותו.
// onTry: מחיל סגנון חדש מהמעבדה שנפתחת כאן בחלון מודאלי
export default function StyleGuide({ trial, onClearTrial, onTry }) {
  const theme = useTheme()
  const [labOpen, setLabOpen] = useState(false)
  // כשמגיעים מ"נסה במדריך" בדף המעבדה: ישר לחלונות. רק בפתיחה, לא בכל שינוי בפקדים
  useEffect(() => {
    if (trial) document.getElementById('guide-windows')?.scrollIntoView({ block: 'start' })
  }, [])
  const [steps, setSteps] = useState(SAMPLE_STEPS)
  const [todos, setTodos] = useState(SAMPLE_TODOS)
  const toggleStep = (s) => setSteps(list => list.map(x => x.id === s.id ? { ...x, done: !x.done } : x))
  const toggleTodo = (t, done) => setTodos(list => list.map(x => x.id === t.id ? { ...x, done_at: done ? 'now' : null } : x))
  const noop = () => {}

  const css = getComputedStyle(document.documentElement)

  return (
    <div className="pl" style={{ maxWidth: 'var(--pl-page-max)' }} key={theme}>
      <h2>מדריך סגנון</h2>
      <p>הרכיבים של "היום שלי", עם נתונים לדוגמה. עיצוב נוכחי: <strong>{theme === 'pixel' ? 'חדש (פיקסלים)' : 'רגיל'}</strong>. להחלפה: הכפתור בפס העליון.</p>

      <Section title="פריסה">
        <p><strong>רוחב דף במחשב: {css.getPropertyValue('--pl-page-max').trim()}</strong>, ממורכז. כל דף פנימי חדש משתמש במשתנה <code>--pl-page-max</code>, ולא במספר משלו. בטלפון הדף ברוחב המסך.</p>
        <p className="pl-muted">חלונות ועמודות: שלוש עמודות במחשב (<code>pl-cols3</code>), אחת מתחת לשנייה במסך צר (עד 900px).</p>
      </Section>

      <Section title="צבעים">
        <div className="lab-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {COLORS.map(([v, name]) => {
            const value = css.getPropertyValue(v).trim()
            return (
              <div key={v} className="pl-col" style={{ gap: 4 }}>
                <div className="lab-swatch" style={{ background: value || 'transparent' }} />
                <strong style={{ fontSize: 13 }}>{name}</strong>
                <span className="pl-muted" style={{ direction: 'ltr', textAlign: 'right' }}>{v} {value || '(אין בעיצוב הזה)'}</span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="גופנים">
        <div className="lab-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {FONTS.map(([v, name, sample]) => (
            <div key={v} className="pl-col" style={{ gap: 4 }}>
              <span style={{ fontFamily: `var(${v})`, fontSize: 22 }}>{sample}</span>
              <strong style={{ fontSize: 13 }}>{name}</strong>
              <span className="pl-muted" style={{ direction: 'ltr', textAlign: 'right' }}>{v}: {css.getPropertyValue(v).trim()}</span>
            </div>
          ))}
        </div>
        <div className="pl-col" style={{ gap: 4 }}>
          {SIZES.map(([v, name]) => (
            <div key={v} className="pl-row" style={{ gap: 12 }}>
              <span style={{ fontSize: `var(${v})`, minWidth: 180 }}>{name}</span>
              <span className="pl-muted" style={{ direction: 'ltr' }}>{v}: {css.getPropertyValue(v).trim()}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="טקסט">
        <h2>כותרת ראשית (h2)</h2>
        <h3>כותרת משנה (h3)</h3>
        <p style={{ color: 'var(--pl-text)' }}>טקסט רגיל: לצחצח שיניים</p>
        <p className="pl-muted">טקסט משני: מתחילים את היום באנרגיה טובה</p>
        <span className="pl-sub">שורה שנייה: כל יום</span>
        <span className="pl-sub pl-sub-warn">שורה שנייה באיחור: אתמול</span>
      </Section>

      <Section title={`סוגי כפתורים (${BUTTONS.length})`}>
        <p className="pl-muted">כל סוג כפתור באפליקציה: השם שלו (זהה כאן ובקוד), ה-class, דוגמה חיה, ואיפה ומתי הוא מוצג.</p>
        <div className="lab-buttons">
          <div className="lab-buttons-row lab-buttons-head">
            <span>שם</span><span>CSS</span><span>דוגמה</span><span>איפה ומתי</span>
          </div>
          {BUTTONS.map(b => (
            <div key={b.name} className="lab-buttons-row">
              <span><strong>{b.title}</strong><br /><span className="pl-muted" style={{ direction: 'ltr' }}>{b.name}</span></span>
              <code className="lab-buttons-css">{b.css}</code>
              <span className="pl-row" style={{ gap: 8 }}>{b.sample}</span>
              <span className="pl-muted">{b.where}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="כפתור פיקסלים (PixelButton)">
        <PixelButtonLab />
      </Section>

      <Section title="תגיות">
        <div className="pl-row">
          <span className="pl-chip">רגילה</span>
          <span className="pl-chip pl-chip-accent">3/4</span>
          <span className="pl-chip pl-chip-warn">רצף 5 ימים</span>
          <span className="pl-chip pl-chip-points">+5 ★</span>
        </div>
      </Section>

      <Section title="שורת הרגל (StepCard)">
        <p className="pl-muted">בוצע, עם שעה קבועה, ועם שעה שהוזזה להיום (כתומה). לחיצה על התיבה מסמנת כאן בלבד.</p>
        <div className="pl-col" style={{ maxWidth: 420 }}>
          {steps.map(s => <StepCard key={s.id} step={s} window={WINDOW} now="07:00" onChange={() => toggleStep(s)} onSetTime={noop} />)}
        </div>
      </Section>

      <Section title="שורת משימה (TodoCard)">
        <p className="pl-muted">עם שעה, באיחור, וחוזרת שבוצעה. ובתוך חלון: עם תגית "משימה".</p>
        <div className="pl-col" style={{ maxWidth: 420 }}>
          <TodoCard todo={todos[0]} today={TODAY} onToggle={toggleTodo} onEdit={noop} />
          <TodoCard todo={todos[1]} today={TODAY} late onToggle={toggleTodo} onEdit={noop} />
          <TodoCard todo={todos[2]} today={TODAY} onToggle={toggleTodo} onEdit={noop} />
          <TodoCard todo={todos[0]} today={TODAY} inWindow onToggle={toggleTodo} onEdit={noop} />
        </div>
      </Section>

      <Section title="חלון (WindowCard)" id="guide-windows">
        <p className="pl-muted">חלון אמיתי עם ההרגלים שלמעלה. לחיצה על הכותרת מקפלת. כשהכל מסומן, הוא מתקפל מעצמו.</p>
        {onTry && <FramePanel trial={trial} onTry={onTry} onClearTrial={onClearTrial} onOpenLab={() => setLabOpen(true)} />}
        {labOpen && (
          <LabModal onClose={() => setLabOpen(false)}>
            <StyleLab initial={trial} onTry={t => { onTry(t); setLabOpen(false) }} />
          </LabModal>
        )}
        <div className={'pl-cols3' + (trial ? ' lab-trial lab-trial-' + trial.variant : '')} style={trial ? frameVars(trial) : undefined}>
          {['morning', 'noon', 'evening'].map((id, i) => (
            <WindowCard
              key={id} id={id}
              label={['בוקר', 'אחר הצהריים', 'ערב'][i]} tagline={TAGLINES[id]}
              window={WINDOW} steps={i === 0 ? steps : []} todos={i === 1 ? [todos[0]] : []}
              today={TODAY} now="07:00" windowOver={false} streak={i === 0 ? 12 : 0}
              onToggleTodo={toggleTodo} onEditTodo={noop} onMark={toggleStep} onSetTime={noop} onAdd={noop} onAddTodo={noop}
            />
          ))}
        </div>
      </Section>

      <Section title="כרטיס (PixelCard)">
        <p className="pl-muted">הכרטיס של החלונות ושל "המשימות שלי". המסגרת שהוחלה מהמעבדה חלה רק עליו. אפשר לתת לו צבע מסגרת ורקע משלו (color, bg).</p>
        <div className="pl-cols3">
          <PixelCard><strong>ברירת מחדל</strong><div className="pl-muted">בלי צבעים משלו</div></PixelCard>
          <PixelCard color="#E7735F" bg="#FFF1EE"><strong>color="#E7735F"</strong><div className="pl-muted">bg="#FFF1EE"</div></PixelCard>
          <PixelCard color="#2FA898" bg="#EEFBF8"><strong>color="#2FA898"</strong><div className="pl-muted">bg="#EEFBF8"</div></PixelCard>
        </div>
      </Section>

      {/* תצוגה ב' לבדיקה (2026-10-08): ההרגלים כרשימה בלי מסגרת, והמשימות בכרטיס, כדי להבדיל ביניהם */}
      <Section title="חלון · תצוגה ב': הרגלים כרשימה">
        <p className="pl-muted">לבדיקה, עוד לא באפליקציה. ההרגלים בלי מסגרת, עם קו דק ביניהם. המשימות נשארות בכרטיס עם מסגרת.</p>
        <div className="pl-cols3">
          {['morning', 'noon', 'evening'].map((id, i) => (
            <WindowCard
              key={id} id={id} habitList
              label={['בוקר', 'אחר הצהריים', 'ערב'][i]} tagline={TAGLINES[id]}
              window={WINDOW} steps={i === 0 ? steps : i === 2 ? steps.slice(0, 2) : []} todos={i < 2 ? [todos[0]] : []}
              today={TODAY} now="07:00" windowOver={false} streak={i === 0 ? 12 : 0}
              onToggleTodo={toggleTodo} onEditTodo={noop} onMark={toggleStep} onSetTime={noop} onAdd={noop} onAddTodo={noop}
            />
          ))}
        </div>
      </Section>

      <Section title="התקדמות">
        <div className="pl-col" style={{ maxWidth: 420, gap: 14 }}>
          <span className="pl-muted">פס בחלון (Progress), 2 מתוך 3:</span>
          <Progress done={2} total={3} />
          <span className="pl-muted">10 קוביות ב-Hero (Blocks), 70%. מוצג רק בעיצוב החדש בתוך ה-Hero, וכאן תמיד:</span>
          <Blocks percent={70} />
        </div>
      </Section>

      <Section title={`אייקונים (${ICON_NAMES.length}, Pixelarticons)`}>
        <p className="pl-muted">בעיצוב הרגיל האייקונים מוסתרים באפליקציה. כאן הם מוצגים תמיד.</p>
        <div className="lab-icons">
          {ICON_NAMES.map(n => (
            <div key={n} className="pl-col" style={{ alignItems: 'center', gap: 4 }}>
              <Icon name={n} />
              <span className="pl-muted" style={{ direction: 'ltr' }}>{n}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

// הפקדים של המעבדה, ישר במדריך (סדר וחלוקה של המשתמשת, 2026-10-07): בחירת דרך 1–4, ותמיד צבע מסגרת,
// צבע רקע, עובי, מדרגות, ותיבת צל. כל שינוי מוחל מיד על החלונות כאן.
// "החל בכל האפליקציה" למטה: שומר את המסגרת במכשיר, וכל הכרטיסים בעיצוב החדש מקבלים אותה (frame.js)
function FramePanel({ trial, onTry, onClearTrial, onOpenLab }) {
  const [params, setParams] = useState(() => frameParams(trial || readFrame()))
  const [applied, setApplied] = useState(readFrame)
  // ניסיון חדש מהמעבדה (החלון המודאלי): הפקדים מתעדכנים ממנו
  useEffect(() => { if (trial) setParams(frameParams(trial)) }, [trial])

  const change = (p) => { setParams(p); if (trial) onTry({ ...trial, ...p }) }
  const apply = (f) => { saveFrame(f); setApplied(f) }
  const appliedTitle = applied && VARIANTS.find(v => v.id === applied.variant)?.title

  return (
    <div className="pl-col lab-frame-panel" style={{ gap: 12 }}>
      <div className="pl-row" style={{ gap: 6 }}>
        <span>מסגרת:</span>
        {VARIANTS.map(v => (
          <button key={v.id} className={'pl-chip-button' + (trial?.variant === v.id ? ' lab-chosen' : '')} onClick={() => onTry({ variant: v.id, ...params })}>
            {v.title}
          </button>
        ))}
        {trial && <button className="pl-link" onClick={onClearTrial}>בטל ניסיון</button>}
        <button onClick={onOpenLab}>🧪 מעבדת סגנונות</button>
      </div>
      <FrameControls value={params} onChange={change} variant={trial?.variant} />
      <div className="pl-row" style={{ gap: 10 }}>
        <button className="pl-primary" disabled={!trial} onClick={() => apply({ variant: trial.variant, ...params })}>
          החל בכל האפליקציה
        </button>
        {applied && <button className="pl-link" onClick={() => apply(null)}>החזר את המסגרת של העיצוב</button>}
        <span className="pl-muted">
          באפליקציה עכשיו: <strong>{appliedTitle || 'המסגרת של העיצוב'}</strong>. רק על PixelCard (החלונות ו"המשימות שלי"), רק בעיצוב החדש, ונשמר במכשיר הזה.
        </span>
      </div>
    </div>
  )
}

// חלון מודאלי מעל המדריך. נסגר ב-✕, ב-Escape, או בלחיצה על הרקע
function LabModal({ onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="lab-modal-overlay" onClick={onClose}>
      <div className="lab-modal" role="dialog" aria-modal="true" aria-label="מעבדת סגנונות" onClick={e => e.stopPropagation()}>
        <button className="pl-icon-button lab-modal-close" onClick={onClose} aria-label="סגור">✕</button>
        {children}
      </div>
    </div>
  )
}

// מחולל לכפתור הפיקסלים: צבע מסגרת, צבע טקסט, מילוי, צבע הצל, עובי, מדרגות וגובה הצל. כל שינוי מוצג מיד.
// "הצג קוד CSS": הכללים של הכפתור עם הערכים שנבחרו, בלי משתנים, להעתקה
function PixelButtonLab() {
  const [p, setP] = useState(PIXEL_BUTTON_DEFAULTS)
  const [label, setLabel] = useState('התחל')
  const [showCss, setShowCss] = useState(false)
  const [copied, setCopied] = useState(false)
  const set = (k, v) => setP(x => ({ ...x, [k]: v }))
  const props = Object.entries(p).map(([k, v]) => typeof v === 'number' ? `${k}={${v}}` : `${k}="${v}"`).join(' ')
  const css = pixelButtonCss(p)
  const copy = () => {
    navigator.clipboard?.writeText(css).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  return (
    <div className="pl-col" style={{ gap: 14 }}>
      <p className="pl-muted">מסגרת עם מדרגות בפינות, ופס צל בתחתית. בלחיצה הוא "נלחץ". Silkscreen לאותיות לטיניות ומספרים, ו-Assistant לעברית.</p>
      <div className="pl-row lab-frame-panel" style={{ gap: 20 }}>
        <label className="pl-row">צבע מסגרת: <input type="color" value={p.color} onChange={e => set('color', e.target.value)} /></label>
        <label className="pl-row">צבע טקסט: <input type="color" value={p.text} onChange={e => set('text', e.target.value)} /></label>
        <label className="pl-row">מילוי: <input type="color" value={p.fill} onChange={e => set('fill', e.target.value)} /></label>
        <label className="pl-row">צבע הצל: <input type="color" value={p.shade} onChange={e => set('shade', e.target.value)} /></label>
        <label className="pl-row">עובי מסגרת: <strong>{p.b}px</strong>
          <input type="range" min="1" max="6" value={p.b} onChange={e => set('b', Number(e.target.value))} />
        </label>
        <label className="pl-row">מדרגות בפינה: <strong>{p.n}</strong>
          <input type="range" min="1" max="6" value={p.n} onChange={e => set('n', Number(e.target.value))} />
        </label>
        <label className="pl-row">גובה הצל: <strong>{p.depth}px</strong>
          <input type="range" min="0" max="16" value={p.depth} onChange={e => set('depth', Number(e.target.value))} />
        </label>
        <label className="pl-row">טקסט: <input type="text" value={label} onChange={e => setLabel(e.target.value)} style={{ width: 120 }} /></label>
        <button className="pl-link" onClick={() => setP(PIXEL_BUTTON_DEFAULTS)}>ברירת מחדל</button>
        <button className="pl-link" onClick={() => setP(PIXEL_BUTTON_VARIANTS.main)}>Main.pixel</button>
        <button className="pl-link" onClick={() => setP(PIXEL_BUTTON_VARIANTS.secondary)}>Secondary.pixel</button>
      </div>
      <div className="pl-row" style={{ gap: 20 }}>
        <PixelButton {...p}>{label || ' '}</PixelButton>
        <PixelButton {...p}>START</PixelButton>
        <PixelButton {...p}>+ הוספת משימה</PixelButton>
        <PixelButton {...p} disabled>מושבת</PixelButton>
      </div>
      <div className="pl-row" style={{ gap: 20 }}>
        <span className="pl-muted">צבעים לדוגמה:</span>
        <PixelButton color="#1FA595" fill="#E3F8F4" shade="#9FE3D7">שמור</PixelButton>
        <PixelButton color="#8E70C9" fill="#F1EAFB" shade="#CDB9EE">הבא</PixelButton>
        <PixelButton color="#E7735F" text="#2E1F5E" fill="#FFF0EC" shade="#F7B9AC">יציאה</PixelButton>
      </div>
      <div className="lab-code">{`<PixelButton ${props}>${label}</PixelButton>`}</div>
      <div className="pl-row" style={{ gap: 10 }}>
        <button onClick={() => setShowCss(v => !v)}>{showCss ? 'הסתר קוד CSS' : 'הצג קוד CSS'}</button>
        {showCss && <button className="pl-link" onClick={copy}>{copied ? '✓ הועתק' : 'העתק'}</button>}
      </div>
      {showCss && <div className="lab-code">{css}</div>}
    </div>
  )
}

// ה-CSS של כפתור הפיקסלים עם הערכים עצמם, בלי משתנים (כמו .px-btn ב-plain.css)
function pixelButtonCss(p) {
  const v = pixelButtonVars(p)
  const b = v['--pb-b'], d = v['--pb-depth']
  return `.pixel-button {
  position: relative;
  isolation: isolate;
  min-height: 44px;
  padding: ${b} calc(22px + ${b}) calc(${d} + ${b});
  border: none;
  background: none;
  color: ${v['--pb-text']};
  font-family: 'Silkscreen', 'Assistant', sans-serif;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}
/* המסגרת */
.pixel-button::before,
.pixel-button::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: ${v['--pb-c']};
  clip-path: ${v['--pb-clip']};
}
/* המילוי ופס הצל */
.pixel-button::after {
  inset: ${b};
  background: linear-gradient(to top, ${v['--pb-shade']} ${d}, ${v['--pb-fill']} ${d});
}
/* בלחיצה: הפס מתכווץ והטקסט יורד */
.pixel-button:active {
  padding-top: calc(${b} + ${d} / 2);
  padding-bottom: calc(${d} / 2 + ${b});
}
.pixel-button:active::after {
  background: linear-gradient(to top, ${v['--pb-shade']} calc(${d} / 2), ${v['--pb-fill']} calc(${d} / 2));
}`
}

function Section({ title, id, children }) {
  return (
    <div className="pl-section pl-col" style={{ gap: 12 }} id={id}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {children}
    </div>
  )
}
