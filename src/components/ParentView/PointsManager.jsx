import React, { useEffect, useState } from 'react'
import { useStore, api } from '../../store'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

export default function PointsManager() {
  const { members, addPoints } = useStore()
  const kids = members.filter(m => m.role === 'child')

  const [selected, setSelected] = useState(kids[0]?.id || '')
  const [amount, setAmount]   = useState(10)
  const [reason, setReason]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [history, setHistory] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)

  const loadHistory = async () => {
    const h = await api.points?.getHistory() || []
    setHistory(h)
  }

  useEffect(() => { loadHistory() }, [])

  const handleAdd = async () => {
    if (!selected || !amount) return
    setSaving(true)
    await addPoints(selected, +amount, reason || undefined)
    setReason('')
    await loadHistory()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
    setSaving(false)
  }

  const getMember = id => members.find(m => m.id === id)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Leaderboard */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🏆 טבלת הנקודות</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {[...kids].sort((a, b) => b.points - a.points).map((kid, i) => {
            const medals = ['🥇','🥈','🥉']
            const pct = kids.length > 1
              ? (kid.points / Math.max(...kids.map(k => k.points || 1))) * 100
              : 100
            return (
              <div key={kid.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem', width: 32, textAlign: 'center' }}>
                  {medals[i] || `${i+1}.`}
                </div>
                <div style={{ fontSize: '1.8rem' }}>{kid.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{kid.name}</div>
                  <div style={{ height: 10, background: 'var(--border)', borderRadius: 'var(--r-full)', overflow: 'hidden', marginTop: '.25rem' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: kid.color, borderRadius: 'var(--r-full)', transition: 'width 1s' }} />
                  </div>
                </div>
                <div style={{ fontWeight: 900, color: kid.color, fontSize: '1.2rem', minWidth: 70, textAlign: 'left' }}>
                  {kid.points} ⭐
                </div>
              </div>
            )
          })}
          {kids.length === 0 && <p style={{ color: 'var(--text-3)', textAlign: 'center' }}>אין ילדים עדיין</p>}
        </div>
      </div>

      {/* Add points form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>➕ הוספת נקודות ידנית</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <div>
            <label className="label">ילד/ה</label>
            <select className="select" value={selected} onChange={e => setSelected(e.target.value)}>
              {kids.map(k => <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>)}
            </select>
          </div>

          {/* Quick amounts */}
          <div>
            <label className="label">כמות נקודות</label>
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem' }}>
              {[5,10,20,50].map(n => (
                <button key={n} className={`btn btn-sm ${amount === n ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAmount(n)}>+{n}</button>
              ))}
            </div>
            <input className="input" type="number" min={-100} max={500} value={amount}
              onChange={e => setAmount(e.target.value)} />
          </div>

          <div>
            <label className="label">סיבה (אופציונלי)</label>
            <input className="input" placeholder="בגלל עזרה מיוחדת..." value={reason}
              onChange={e => setReason(e.target.value)} />
          </div>

          <button className="btn btn-primary" disabled={saving || !selected} onClick={handleAdd}
            style={{ position: 'relative' }}>
            {showSuccess ? '✅ נוסף!' : saving ? 'מוסיף...' : `➕ הוסף ${amount} נקודות`}
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>📜 היסטוריה</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {history.slice(0, 20).map((h, i) => {
              const kid = getMember(h.member_id)
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '.6rem .75rem', background: 'var(--bg)', borderRadius: 'var(--r)',
                  fontSize: '.88rem'
                }}>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                    <span>{kid?.avatar || '👤'}</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{kid?.name} — {h.reason || 'בונוס'}</div>
                      <div style={{ color: 'var(--text-3)', fontSize: '.78rem' }}>
                        {format(parseISO(h.created_at), "d בMMM, HH:mm", { locale: he })}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: h.points > 0 ? '#2ecc71' : 'var(--red)', fontSize: '1rem' }}>
                    {h.points > 0 ? '+' : ''}{h.points} ⭐
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
