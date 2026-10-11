import { useEffect, useRef, useState } from 'react'

// אנימציה בהשלמת פעולה (המשתמשת, 2026-10-11: "אנימציה סבבה, תכניס את הנקודות משתחררות").
// התנועה עצמה ב-CSS (theme-pixel.css), רק בעיצוב המשחקי, ובלי תנועה למי שביקש פחות תנועה במכשיר

// just: true לרגע קצר אחרי שסימנו "בוצע" (לא בביטול סימון). mark(wasDone): לקרוא לפני הסימון
export function useJustChecked(ms = 650) {
  const [just, setJust] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const mark = (wasDone) => {
    if (wasDone) return
    clearTimeout(timer.current)
    setJust(true)
    timer.current = setTimeout(() => setJust(false), ms)
  }
  return [just, mark]
}

const animated = () =>
  document.documentElement.dataset.theme === 'pixel' &&
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// מונה הנקודות סופר עד הערך החדש כשהוא עולה (בקפיצות, עד כעשר), במקום להחליף מספר בבת אחת.
// ירידה, או בלי אנימציה: מתעדכן מיד. ticking: בזמן הספירה ועוד רגע, כדי שהמספר "יקפוץ"
export function useCountUp(value) {
  const [shown, setShown] = useState(value)
  const [ticking, setTicking] = useState(false)
  const ref = useRef(value)
  useEffect(() => {
    if (value === ref.current) return
    if (value < ref.current || !animated()) { ref.current = value; setShown(value); setTicking(false); return }
    const step = Math.max(1, Math.ceil((value - ref.current) / 10))
    setTicking(true)
    let stop
    const id = setInterval(() => {
      ref.current = Math.min(value, ref.current + step)
      setShown(ref.current)
      if (ref.current >= value) {
        clearInterval(id)
        stop = setTimeout(() => setTicking(false), 250)
      }
    }, 90)
    return () => { clearInterval(id); clearTimeout(stop) }
  }, [value])
  return [shown, ticking]
}
