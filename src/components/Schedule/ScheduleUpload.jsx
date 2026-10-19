import React, { useEffect, useRef, useState } from 'react'
import { api } from '../../store'
import Modal from '../shared/Modal'
import PixelButton from '../shared/PixelButton'
import Icon from '../shared/Icon'

// העלאת מערכת שעות מתמונות (פרוסה ב2, 2026-10-18). ההורה בוחר קבצים: מערכת, צלצולים, או שניהם (עד 4),
// והשרת מחזיר טיוטה שמוצגת במערכת עצמה (WeeklySchedule). שום דבר לא נשמר עד "שמירת המערכת", והתמונות לא נשמרות.
// תמונה מוקטנת בדפדפן (צלע ארוכה עד 2000px, JPEG), כדי להישאר מתחת למגבלת השרת עם טקסט קריא
const MAX_FILES = 4
const MAX_SIDE = 2000
const MAX_PDF = 6 * 1024 * 1024

const ERRORS = {
  daily_limit: 'הגעת ל-20 העלאות היום. אפשר לנסות שוב מחר, או להכניס ידנית.',
  extract_not_configured: 'ההעלאה עוד לא מוגדרת בשרת.',
  image_too_large: 'הקבצים גדולים מדי. אפשר לנסות פחות קבצים, או צילום במקום PDF.',
  bad_image_type: 'אפשר להעלות רק תמונה או PDF.',
  too_many_files: `אפשר להעלות עד ${MAX_FILES} קבצים.`,
  extract_failed: 'לא הצלחתי לקרוא את המערכת. אפשר לנסות תמונה ברורה יותר, או להכניס ידנית.'
}

const readDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new Error('bad_image'))
  reader.readAsDataURL(file)
})

// קובץ → data URL לשליחה. תמונה מוקטנת בלי חיתוך, PDF כמו שהוא
export function prepareFile(file) {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF) return Promise.reject(new Error('image_too_large'))
    return readDataUrl(file)
  }
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('bad_image_type'))
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad_image_type')) }
    img.src = url
  })
}

let fileKey = 0

// הטקסטים לפי סוג ההעלאה: מערכת מלאה, או חוגים בלבד (מקטע "חוגים", 2026-10-18)
const TEXT = {
  all: {
    title: 'העלאת מערכת של ', reading: 'קורא את המערכת של ', drop: 'צילום או קובץ של המערכת', more: 'למשל הצלצולים',
    hint: 'אם הצלצולים בדף נפרד, מעלים את שניהם יחד. אחרי הקריאה המערכת מוצגת לבדיקה, ונשמרת רק כשמאשרים.',
    empty: 'לא נמצאה מערכת',
    steps: ['מזהה את הימים והשיעורים', 'מחפש את שעות הצלצולים', 'מסדר את המערכת לבדיקה']
  },
  activities: {
    title: 'הוספת חוגים מתמונה ל', reading: 'קורא את החוגים של ', drop: 'צילום או קובץ של החוגים', more: 'למשל חוג נוסף',
    hint: 'למשל לוח אימונים או לוח חוגים. החוגים מתווספים למערכת, והשיעורים והצלצולים לא משתנים. אחרי הקריאה בודקים, ונשמר רק כשמאשרים.',
    empty: 'לא נמצאו חוגים',
    steps: ['מזהה את החוגים', 'מחפש ימים ושעות', 'מסדר את החוגים לבדיקה']
  }
}

export default function ScheduleUpload({ member, scope = 'all', onDraft, onManual, onClose }) {
  const t = TEXT[scope] || TEXT.all
  const input = useRef(null)
  const [files, setFiles] = useState([])   // [{ key, name, pdf, dataUrl }]
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')

  const [over, setOver] = useState(false)

  const pick = () => input.current?.click()
  // קבצים מהבחירה או מגרירה (במחשב)
  const addFiles = async (list) => {
    const chosen = Array.from(list || [])
    setError('')
    const room = MAX_FILES - files.length
    if (chosen.length > room) setError(ERRORS.too_many_files)
    try {
      const ready = await Promise.all(chosen.slice(0, room).map(async f => ({
        key: ++fileKey, name: f.name, pdf: f.type === 'application/pdf', dataUrl: await prepareFile(f)
      })))
      setFiles(fs => [...fs, ...ready])
    } catch (err) {
      setError(ERRORS[err.message] || ERRORS.bad_image_type)
    }
  }
  const add = (e) => { const list = e.target.files; addFiles(list).finally(() => { e.target.value = '' }) }
  const drop = {
    onDragOver: (e) => { e.preventDefault(); setOver(true) },
    onDragLeave: () => setOver(false),
    onDrop: (e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files) }
  }

  const read = async () => {
    setReading(true)
    setError('')
    try {
      const draft = await api.schedule.extract({ memberId: member.id, images: files.map(f => f.dataUrl), ...(scope === 'activities' ? { scope } : {}) })
      // לא נקרא כלום: ההסבר של Claude (למשל "התמונה ריקה"), אם יש
      if (!draft.items.length && !draft.periods.length) {
        const note = draft.warnings.map(w => w.note).filter(Boolean).join(' ')
        setError(note ? t.empty + ': ' + note : ERRORS.extract_failed)
        setReading(false)
        return
      }
      onDraft(draft)
    } catch (err) {
      // שגיאה לא מוכרת: גם הקוד, כדי שאפשר יהיה לברר מה קרה. "Failed to fetch": החיבור לשרת נקטע
      const code = err.message || ''
      setError(ERRORS[code] || (/fetch|network/i.test(code)
        ? 'החיבור לשרת נקטע באמצע הקריאה. אפשר לנסות שוב.'
        : ERRORS.extract_failed + (code ? ` (${code})` : '')))
      setReading(false)
    }
  }

  const fileInput = <input ref={input} type="file" accept="image/*,application/pdf" multiple hidden onChange={add} />

  // בזמן הקריאה החלון לא נסגר, כדי שלא תישלח בקשה כפולה. הקבצים נשארים בתצוגה, עם פס סורק
  if (reading) {
    return (
      <Modal title={t.title + member.name} onClose={onClose} locked>
        <div className="pl-col su-reading" role="status">
          <div className="su-reading-files" aria-hidden="true">
            {files.map(f => <Thumb key={f.key} file={f} scanning />)}
          </div>
          <strong>{t.reading}{member.name}...</strong>
          <ReadingSteps steps={t.steps} />
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={t.title + member.name} onClose={onClose}>
      <div className="pl-col su-upload">
        {fileInput}
        {files.length === 0 ? (
          <button className={'su-drop' + (over ? ' su-drop-over' : '')} onClick={pick} {...drop}>
            <Icon name="camera" className="su-drop-icon" />
            <strong>{t.drop}</strong>
            <span className="pl-muted">לחיצה לבחירה, או גרירה לכאן · תמונה או PDF</span>
          </button>
        ) : (
          <ul className={'su-grid' + (over ? ' su-drop-over' : '')} {...drop}>
            {files.map(f => (
              <li key={f.key} className="su-tile">
                <Thumb file={f} />
                <span className="su-name" title={f.name}>{f.name}</span>
                <button className="su-remove" onClick={() => setFiles(fs => fs.filter(x => x.key !== f.key))}
                  aria-label={'הסרת ' + f.name} title="הסרה">✕</button>
              </li>
            ))}
            {files.length < MAX_FILES && (
              <li className="su-tile">
                <button className="su-add" onClick={pick}>
                  <span className="su-add-plus" aria-hidden="true">+</span>
                  <span>עוד קובץ</span>
                  <span className="pl-muted">{t.more}</span>
                </button>
              </li>
            )}
          </ul>
        )}

        <p className="pl-muted su-hint">{t.hint}</p>

        {error && (
          <div className="pl-col su-error" role="alert">
            <span>{error}</span>
            <button className="pl-link" onClick={onManual}>להכנסה ידנית</button>
          </div>
        )}
        <div className="su-footer">
          <PixelButton variant="secondary" onClick={onClose}>ביטול</PixelButton>
          <PixelButton variant="main" onClick={read} disabled={!files.length}>
            קריאת המערכת
          </PixelButton>
        </div>
      </div>
    </Modal>
  )
}

// תמונה ממוזערת, או "PDF". בזמן הקריאה: פס שסורק לאורך התמונה
function Thumb({ file, scanning }) {
  return (
    <span className={'su-thumb' + (scanning ? ' su-thumb-scan' : '')}>
      {file.pdf ? <span className="su-thumb-pdf">PDF</span> : <img src={file.dataUrl} alt="" />}
    </span>
  )
}

// מה קורה בזמן הקריאה (עד דקה): הודעה מתחלפת כל כמה שניות, כדי שיהיה ברור שזה עובד
function ReadingSteps({ steps }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 6000)
    return () => clearInterval(t)
  }, [steps])
  return (
    <ol className="su-steps">
      {steps.map((label, i) => (
        <li key={label} className={i < step ? 'su-step-done' : i === step ? 'su-step-now' : ''}>
          <span className="su-step-dot" aria-hidden="true">{i < step ? '✓' : ''}</span>{label}
        </li>
      ))}
    </ol>
  )
}
