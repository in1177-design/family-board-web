import React, { useState } from 'react'

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const toTime = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`

// משבצות של חצי שעה, מתחילת החלון עד סופו. אם השעה של המשימה מחוץ לחלון, הטווח מתרחב אליה
function slots(window, ...times) {
  const all = [window.start, window.end, ...times.filter(Boolean)].map(toMin)
  const from = Math.floor(Math.min(...all) / 30) * 30
  const to = Math.ceil(Math.max(...all) / 30) * 30
  const out = []
  for (let n = from; n <= to && n < 24 * 60; n += 30) out.push(toTime(n))
  return out
}

// בחירת שעה להיום בלבד (רפרנס: צילום המסך "מתי תקרא היום?").
// משימה עם שעה קבועה: מזיזים אותה. משימה בלי שעה: קובעים לה שעה להיום
export default function TimePicker({ step, window: w, now, onPick, onCancel }) {
  const options = slots(w, step.exact_time, step.time_today)
  // אי אפשר לבחור חצי שעה שכבר עברה
  const past = (t) => toMin(t) + 30 <= toMin(now)
  const [chosen, setChosen] = useState(step.time_today || options.find(t => !past(t)) || null)
  const yesterday = step.time_yesterday && step.time_yesterday !== step.time_today ? step.time_yesterday : null

  return (
    <div className="pl-box pl-col" style={{ gap: 12 }}>
      <div>
        <strong>מתי {step.label} היום?</strong>
        <div className="pl-muted">
          רק להיום. {step.exact_time ? `השעה הקבועה: ${step.exact_time}` : 'למשימה הזו אין שעה קבועה.'}
        </div>
      </div>

      {yesterday && (
        <button className={'pl-slot pl-slot-wide' + (chosen === yesterday ? ' pl-slot-on' : '')} onClick={() => setChosen(yesterday)}>
          כמו אתמול · {yesterday}
        </button>
      )}

      <div className="pl-slots">
        {options.map(t => (
          <button
            key={t}
            className={'pl-slot' + (chosen === t ? ' pl-slot-on' : '')}
            disabled={past(t)}
            onClick={() => setChosen(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <button className="pl-primary" disabled={!chosen} onClick={() => onPick(chosen === step.exact_time ? null : chosen)}>
        {chosen ? `קבע ל-${chosen}` : 'כל השעות בחלון כבר עברו'}
      </button>
      <button className="pl-link pl-muted" style={{ alignSelf: 'flex-start' }} onClick={onCancel}>ביטול</button>
    </div>
  )
}
