import React, { useEffect, useState } from 'react'
import { api, useStore } from '../../store'
import { memberPhoto } from '../shared/memberPhoto'

const REFRESH_MS = 30000
const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// טבלת הובלה יומית בדף הניקוד, לכל בני המשפחה (החלטה 2026-10-07):
// כמה נקודות כל אחד צבר היום, מהגבוה לנמוך. currentId: השורה של מי שמסתכל מודגשת
export default function DailyLeaderboard({ currentId }) {
  const { members } = useStore()
  const [board, setBoard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = () => api.points.today().then(d => { setBoard(d.board); setError('') }).catch(e => setError(e.message))
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  // התמונה לפי בן המשפחה מהחנות, כי השיוך לתמונה לפי השם
  const photoOf = (row) => memberPhoto(members.find(m => m.id === row.id) || row)

  return (
    <div className="pl" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
      <h2>טבלת הובלה · היום</h2>
      <p style={{ marginBottom: 12 }}>מי צבר הכי הרבה נקודות היום. מתאפס כל יום בחצות</p>

      {error && <p className="pl-error">{error}</p>}
      {!board && !error && <p>טוען…</p>}

      {board && (
        <div className="pl-col" style={{ gap: 8 }}>
          {board.map(r => (
            <div key={r.id} className={'pl-board-row' + (r.id === currentId ? ' pl-board-me' : '')}>
              <span className="pl-board-rank">{r.today > 0 && MEDALS[r.rank] ? MEDALS[r.rank] : r.rank}</span>
              {photoOf(r)
                ? <img className="pl-switcher-photo" style={{ margin: 0, width: 36, height: 36 }} src={photoOf(r)} alt="" />
                : <span style={{ width: 36, textAlign: 'center' }}>{members.find(m => m.id === r.id)?.avatar}</span>}
              <strong style={{ flex: 1 }}>{r.name}</strong>
              <span className="pl-muted" style={{ fontSize: 13 }}>סה״כ {r.total}</span>
              <span className="pl-chip pl-chip-accent">{r.today} היום</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
