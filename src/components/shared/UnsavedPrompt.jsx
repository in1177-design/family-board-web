import React, { useState } from 'react'
import Modal from './Modal'
import PixelButton from './PixelButton'
import { usePendingLeave, answerLeave } from './unsaved'

// החלון שקופץ כשעוברים מסך עם טיוטה שלא נשמרה (2026-10-18, בבקשת המשתמשת אחרי שטיוטת חוגים נמחקה במעבר מסך).
// מוצב פעם אחת ב-App. הלוגיקה ב-unsaved.js
export default function UnsavedPrompt() {
  const pending = usePendingLeave()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!pending) return null

  const answer = async (choice) => {
    setBusy(true)
    setFailed(false)
    const ok = await answerLeave(choice)
    setBusy(false)
    if (!ok) setFailed(true)
  }
  const stay = () => { setFailed(false); answer('stay') }

  return (
    <Modal title="השינויים לא נשמרו" onClose={stay} locked={busy}>
      <div className="pl-col" style={{ gap: 16 }}>
        <p style={{ margin: 0 }}>יש מערכת מהתמונה שעוד לא נשמרה. לשמור אותה לפני שעוברים?</p>
        {failed && <p className="sd-error" role="alert">השמירה לא הצליחה. אפשר לחזור לטיוטה ולתקן.</p>}
        <div className="su-footer">
          <button className="pl-link pl-danger-link" onClick={() => answer('discard')} disabled={busy}>יציאה בלי לשמור</button>
          <PixelButton variant="secondary" onClick={stay} disabled={busy}>חזרה לטיוטה</PixelButton>
          <PixelButton variant="main" onClick={() => answer('save')} disabled={busy}>{busy ? 'שומר...' : 'שמירה'}</PixelButton>
        </div>
      </div>
    </Modal>
  )
}
