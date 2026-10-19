import React, { useRef, useState } from 'react'
import { useStore } from '../../store'
import Modal from './Modal'
import PixelButton from './PixelButton'
import { DAY_LETTERS } from '../Routines/labels'
import { defaultPhoto } from './memberPhoto'
import { HEADER_STYLES, readHeaderStyle, saveHeaderStyle } from './headerStyle'

// פרופיל של בן משפחה (החלטה 2026-10-09): עיצוב, ימי לימודים, ותמונה לכל עיצוב.
// כל אחד משנה את שלו (בלחיצה על התמונה ב-Hero), והורה את של כולם (בהגדרות)
const THEMES = [
  { id: 'playful', title: 'משחקי', text: 'פיקסלים וצבעים' },
  { id: 'refined', title: 'מעודן', text: 'נקי ושקט' }
]
const PHOTO_SIZE = 256

export default function ProfileModal({ member, onClose }) {
  const { updateMember } = useStore()
  const [theme, setTheme] = useState(member.theme || null)
  const [days, setDays] = useState(member.school_days || [0, 1, 2, 3, 4])
  const [photos, setPhotos] = useState({ playful: member.photo_playful || null, refined: member.photo_refined || null })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // להורה ימי עבודה, לא ימי לימודים (2026-10-09). אותו שדה
  const parent = member.role === 'parent'
  const [headerStyle, setHeaderStyle] = useState(readHeaderStyle)

  const toggleDay = (d) => setDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d].sort())

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await updateMember({
        id: member.id,
        ...(theme ? { theme } : {}),
        school_days: days,
        photo_playful: photos.playful,
        photo_refined: photos.refined
      })
      onClose()
    } catch (e) {
      setError('לא הצלחתי לשמור. ' + (e.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={'הפרופיל של ' + member.name} onClose={onClose}>
      <div className="pl-col pl-profile" style={{ gap: 20 }}>
        <section className="pl-col" style={{ gap: 8 }}>
          <strong>העיצוב שלי</strong>
          <div className="pl-profile-themes">
            {THEMES.map(t => (
              <button key={t.id} className={'pl-profile-theme pl-profile-theme-' + t.id + (theme === t.id ? ' pl-profile-on' : '')}
                onClick={() => setTheme(t.id)} aria-pressed={theme === t.id}>
                <strong>{t.title}</strong>
                <span className="pl-muted">{t.text}</span>
              </button>
            ))}
          </div>
          {!theme && <span className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>עוד לא נבחר. עד אז: מה שנבחר במכשיר הזה.</span>}
        </section>

        {/* גרסת הכותרת בטלפון (2026-10-10). נשמרת במכשיר ומוחלת מיד, בלי "שמור" */}
        <section className="pl-col" style={{ gap: 8 }}>
          <strong>הכותרת בטלפון</strong>
          <div className="pl-profile-themes">
            {HEADER_STYLES.map(h => (
              <button key={h.id} className={'pl-profile-theme' + (headerStyle === h.id ? ' pl-profile-on' : '')}
                onClick={() => { setHeaderStyle(h.id); saveHeaderStyle(h.id) }} aria-pressed={headerStyle === h.id}>
                <strong>{h.title}</strong>
              </button>
            ))}
          </div>
          <span className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>נשמר במכשיר הזה בלבד.</span>
        </section>

        <section className="pl-col" style={{ gap: 8 }}>
          <strong>{parent ? 'ימי העבודה שלי' : 'ימי הלימודים שלי'}</strong>
          <div className="pl-profile-days">
            {DAY_LETTERS.map((l, d) => (
              <button key={d} className={'pl-profile-day' + (days.includes(d) ? ' pl-profile-on' : '')}
                onClick={() => toggleDay(d)} aria-pressed={days.includes(d)} aria-label={'יום ' + l}>
                {l}
              </button>
            ))}
          </div>
          <span className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>
            {parent
              ? 'לפי הימים האלה מופיעים הרגלים של "ימי עבודה" ו"לפני יום עבודה". שאר הימים הם סופ״ש.'
              : 'לפי הימים האלה מופיעים הרגלים של "ימי לימודים" ו"לפני לימודים". חופשות מלוח החופשות חלות על כולם.'}
          </span>
        </section>

        <section className="pl-col" style={{ gap: 8 }}>
          <strong>התמונה שלי</strong>
          <div className="pl-profile-photos">
            {THEMES.map(t => (
              <PhotoPick key={t.id} label={'ב' + t.title} value={photos[t.id]} fallback={defaultPhoto(member, t.id)}
                onChange={v => setPhotos(p => ({ ...p, [t.id]: v }))} />
            ))}
          </div>
        </section>

        {error && <p className="pl-error">{error}</p>}
        <div className="pl-form-buttons">
          <PixelButton variant="main" onClick={save} disabled={saving}>{saving ? 'שומר…' : 'שמור'}</PixelButton>
          <PixelButton variant="secondary" className="pl-form-cancel" onClick={onClose}>בטל</PixelButton>
        </div>
      </div>
    </Modal>
  )
}

// תמונה לעיצוב אחד: מה שהועלה, או התמונה הקבועה. "החלפה" מעלה קובץ, ו"חזרה לתמונה הקבועה" מוחקת את ההעלאה
function PhotoPick({ label, value, fallback, onChange }) {
  const input = useRef(null)
  const [error, setError] = useState('')
  const shown = value || fallback

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try { onChange(await squareImage(file, PHOTO_SIZE)) }
    catch { setError('הקובץ הזה לא נפתח כתמונה') }
  }

  return (
    <div className="pl-col pl-profile-photo" style={{ gap: 6, alignItems: 'center' }}>
      <span className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>{label}</span>
      {shown ? <img src={shown} alt="" /> : <span className="pl-profile-photo-empty">אין תמונה</span>}
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      <button className="pl-link" onClick={() => input.current?.click()}>החלפה</button>
      {value && <button className="pl-link pl-muted" onClick={() => onChange(null)}>חזרה לתמונה הקבועה</button>}
      {error && <span className="pl-error" style={{ fontSize: 'var(--pl-size-sm)' }}>{error}</span>}
    </div>
  )
}

// מקטין לריבוע (חיתוך מהמרכז), כדי שהתמונה ב-DB תהיה קטנה. PNG שומר שקיפות לאווטרים, JPEG לתמונות
function squareImage(file, size) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d')
      // אווטר פיקסלים (PNG): בלי החלקה, כדי שהפיקסלים יישארו חדים
      if (file.type === 'image/png') ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(file.type === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad_image')) }
    img.src = url
  })
}
