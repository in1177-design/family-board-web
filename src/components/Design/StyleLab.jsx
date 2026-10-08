import React, { useState } from 'react'
import { FRAME_DEFAULTS, VARIANTS, STEPPED, frameVars } from './frame'

// מעבדת סגנונות (החלטה 2026-10-07): מקום לנסות סגנונות לפני שמכניסים אותם לעיצוב.
// עכשיו: מסגרת לכרטיסים, בארבע דרכים זו לצד זו. הגאומטריה ב-frame.js, והכללים ב-styles/lab.css
// (אותם כללים כמו בניסיון במדריך ובכל האפליקציה). נפתחת מהתפריט של ההורה, ומתוך מדריך הסגנון

// הפקדים של המסגרת, גם במדריך הסגנון: צבע מסגרת, צבע רקע, עובי ומדרגה, כמות מדרגות,
// ותיבת "צל" שפותחת את צבע הצל ועוביו. variant: הדרך שנבחרה, כדי להשבית את המדרגות כשהן לא משנות.
// value: { c, bg, b, n, shadow, sh, so }. onChange: מקבל את הערך החדש כולו
export function FrameControls({ value, onChange, variant }) {
  const set = (k, v) => onChange({ ...value, [k]: v })
  const stepped = !variant || STEPPED.includes(variant)
  return (
    <div className="pl-row" style={{ gap: 20 }}>
      <label className="pl-row">
        צבע מסגרת:
        <input type="color" value={value.c} onChange={e => set('c', e.target.value)} />
      </label>
      <label className="pl-row">
        צבע רקע:
        <input type="color" value={value.bg} onChange={e => set('bg', e.target.value)} />
      </label>
      <label className="pl-row">
        עובי ומדרגה: <strong>{value.b}px</strong>
        <input type="range" min="1" max="8" value={value.b} onChange={e => set('b', Number(e.target.value))} />
      </label>
      <label className="pl-row" style={stepped ? undefined : { opacity: .45 }} title={stepped ? undefined : 'רק בדרכים 3 ו-4'}>
        מדרגות בפינה: <strong>{value.n}</strong>
        <input type="range" min="1" max="6" value={value.n} disabled={!stepped} onChange={e => set('n', Number(e.target.value))} />
      </label>
      <label className="pl-row">
        <input type="checkbox" checked={value.shadow} onChange={e => set('shadow', e.target.checked)} />
        צל
      </label>
      {value.shadow && <>
        <label className="pl-row">
          צבע הצל:
          <input type="color" value={value.sh} onChange={e => set('sh', e.target.value)} />
        </label>
        <label className="pl-row">
          עובי הצל: <strong>{value.so}px</strong>
          <input type="range" min="1" max="16" value={value.so} onChange={e => set('so', Number(e.target.value))} />
        </label>
      </>}
    </div>
  )
}

// רק ההגדרות, בלי הדרך
export function frameParams(f) {
  const { c, bg, b, n, shadow, sh, so } = { ...FRAME_DEFAULTS, ...f }
  return { c, bg, b, n, shadow, sh, so }
}

const HOW = {
  round: { how: 'border רגיל עם border-radius. הצל: box-shadow מוסט, בלי טשטוש.', code: 'border: B solid C;\nborder-radius: 12px;\nbox-shadow: SO SO 0 SH;' },
  shadow: { how: 'ארבעה box-shadow בלי טשטוש, אחד לכל צד. בפינות נשארת משבצת ריקה. תמיד מדרגה אחת: צללים לא יוצרים מדרגות.', code: 'box-shadow:\n  0 -B 0 0 C, 0 B 0 0 C,\n  -B 0 0 0 C, B 0 0 0 C,\n  SO SO 0 0 SH;' },
  clip: { how: 'שתי שכבות (::before במסגרת, ::after ברקע) עם clip-path מדורג. בלי עטיפות, אז עובד על כל כרטיס. הצל: drop-shadow על הכרטיס, שעוקב אחרי הצורה.', code: '::before { clip-path: polygon(…); background: C; }\n::after { inset: B; clip-path: polygon(…); background: BG; }\nfilter: drop-shadow(SO SO 0 SH);' },
  img: { how: 'border-image עם תמונת SVG קטנה של משבצות, שנבנית בקוד, אז הצבעים וכמות המדרגות משתנים. הצל: drop-shadow.', code: 'border-image: url(svg) N+1 fill / (N+1)×B;\nbackground: none;\nfilter: drop-shadow(SO SO 0 SH);' }
}

// onTry: שולח את הדרך וההגדרות הנוכחיות למדריך הסגנון, שמחיל אותן רק על החלונות שבו (ParentView).
// initial: ההגדרות של הניסיון הנוכחי, כדי שהמעבדה תיפתח מהן (בחלון המודאלי במדריך)
export default function StyleLab({ onTry, initial }) {
  const [f, setF] = useState(() => frameParams(initial))

  return (
    <div className="pl" style={{ maxWidth: 1100 }}>
      <h2>מעבדת סגנונות</h2>
      <p>מסגרת לכרטיסים: ארבע דרכים, זו לצד זו. לא משפיע על האפליקציה.</p>

      <div className="pl-col" style={{ margin: '16px 0 28px', gap: 6 }}>
        <FrameControls value={f} onChange={setF} />
        <span className="pl-muted">מדרגות בפינה: רק בדרכים 3 ו-4.</span>
      </div>

      <div className="lab-grid">
        {VARIANTS.map(v => (
          <div key={v.id} className="pl-col" style={{ gap: 10 }}>
            <strong>{v.title}</strong>
            <div className={'lab-sample lab-fr-' + v.id} style={frameVars({ variant: v.id, ...f })}><Content /></div>
            <div className="pl-muted">{HOW[v.id].how}</div>
            <div className="lab-code">{HOW[v.id].code}</div>
            {onTry && (
              <button style={{ alignSelf: 'flex-start' }} onClick={() => onTry({ variant: v.id, ...f })}>
                נסה במדריך
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// תוכן לדוגמה בתוך כל מסגרת
function Content() {
  return (
    <div className="pl-col" style={{ gap: 6 }}>
      <strong>בוקר</strong>
      <span className="pl-muted">מתחילים את היום באנרגיה טובה</span>
      <span>✓ לצחצח שיניים</span>
    </div>
  )
}
