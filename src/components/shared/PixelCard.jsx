import React, { useEffect, useState } from 'react'
import { FRAME_EVENT, cardVars, appliedFrame } from '../Design/frame'

// PixelCard (החלטה 2026-10-07): הכרטיס של החלונות (WindowCard) ושל "המשימות שלי".
// המסגרת מהמעבדה ("החל בכל האפליקציה") חלה רק עליו, לא על כל הכרטיסים באפליקציה (lab.css, .px-card).
// color, bg: צבע מסגרת ורקע משלו, אם רוצים כרטיס בצבע אחר. בלי: הצבעים של המסגרת שהוחלה, או של העיצוב
export default function PixelCard({ color, bg, className = '', style, children, ...rest }) {
  const [frame, setFrame] = useState(appliedFrame)
  useEffect(() => {
    if (!color && !bg) return
    const onChange = () => setFrame(appliedFrame())
    window.addEventListener(FRAME_EVENT, onChange)
    return () => window.removeEventListener(FRAME_EVENT, onChange)
  }, [color, bg])

  return (
    <div className={'pl-section px-card ' + className} style={{ ...cardVars(frame, color, bg), ...style }} {...rest}>
      {children}
    </div>
  )
}
