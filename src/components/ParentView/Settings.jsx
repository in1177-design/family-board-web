import React, { useEffect, useState } from 'react'
import { useStore, api } from '../../store'

const COLORS = ['#6C63FF','#FF7043','#69F0AE','#FFD740','#4FC3F7','#F48FB1','#26C6DA','#FF5252','#9C27B0','#00BCD4']
const AVATARS = ['🦁','🐯','🦊','🐻','🐼','🦄','🐸','🐧','🦋','🐬','🐙','🦖','👦','👧','🧒','👨','👩','🧑']

export default function Settings() {
  const { members, createMember, updateMember, deleteMember, loadFamily } = useStore()
  const [tab, setTab] = useState('members')

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
        {['members','google'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(t)}>
            {t === 'members' ? '👨‍👩‍👧‍👦 בני משפחה' : '📅 Google Calendar'}
          </button>
        ))}
      </div>

      {tab === 'members' && <MembersSettings members={members} createMember={createMember} updateMember={updateMember} deleteMember={deleteMember} loadFamily={loadFamily} />}
      {tab === 'google'  && <GoogleSettings members={members} />}
    </div>
  )
}

// ── Members settings ───────────────────────────────────────────────────────────

function MembersSettings({ members, createMember, updateMember, deleteMember, loadFamily }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'child', color: COLORS[0], avatar: AVATARS[0], pin: '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editMember) {
        await updateMember({ id: editMember.id, ...form })
        setEditMember(null)
      } else {
        await createMember(form)
      }
      setForm({ name: '', role: 'child', color: COLORS[0], avatar: AVATARS[0], pin: '' })
      setShowAdd(false)
      await loadFamily()
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (m) => {
    setForm({ name: m.name, role: m.role, color: m.color, avatar: m.avatar || AVATARS[0], pin: m.pin || '' })
    setEditMember(m)
    setShowAdd(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('למחוק את בן/בת המשפחה? פעולה זו תמחק גם את כל המשימות שלו/ה.')) return
    await deleteMember(id)
    await loadFamily()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>בני המשפחה</h3>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditMember(null); setForm({ name: '', role: 'child', color: COLORS[0], avatar: AVATARS[0], pin: '' }); setShowAdd(true) }}>
          + הוסף
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {members.map(m => (
          <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${m.color}33` }}>
            <div style={{ fontSize: '2rem' }}>{m.avatar || '👤'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text-3)' }}>
                {m.role === 'parent' ? '👑 הורה' : '⭐ ילד/ה'}
                {m.role === 'child' && ` · ${m.points} נקודות`}
                {m.pin && ' · 🔐 קוד מוגן'}
              </div>
            </div>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color }} />
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(m)}>✏️</button>
              <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--red)' }} onClick={() => handleDelete(m.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.25rem' }}>{editMember ? 'עריכת פרופיל' : 'הוספת בן/בת משפחה'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div>
                  <label className="label">אמוג׳י</label>
                  <select value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
                    style={{ fontSize: '1.8rem', border: '2px solid var(--border)', borderRadius: 'var(--r)', padding: '.3rem', cursor: 'pointer' }}>
                    {AVATARS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">שם</label>
                  <input className="input" placeholder="שם" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
              </div>

              <div>
                <label className="label">תפקיד</label>
                <select className="select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="parent">הורה</option>
                  <option value="child">ילד/ה</option>
                </select>
              </div>

              {form.role === 'child' && (
                <div>
                  <label className="label">קוד סודי (4 ספרות)</label>
                  <input className="input" placeholder="השאר ריק לכניסה ללא קוד" value={form.pin}
                    maxLength={4} inputMode="numeric"
                    onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/,'') }))} />
                </div>
              )}

              <div>
                <label className="label">צבע</label>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                      width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: form.color === c ? '3px solid #333' : '3px solid transparent',
                      transition: 'transform .15s', transform: form.color === c ? 'scale(1.2)' : 'scale(1)'
                    }} />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>ביטול</button>
                <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving || !form.name.trim()} onClick={handleSave}>
                  {saving ? 'שומר...' : editMember ? 'שמור' : 'הוסף'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Google Calendar settings ───────────────────────────────────────────────────

function GoogleSettings({ members }) {
  const { updateMember } = useStore()
  const [statuses, setStatuses]           = useState({})
  const [calendars, setCalendars]         = useState({})
  const [connecting, setConnecting]       = useState({})
  const [awaitingReturn, setAwaitingReturn] = useState({})
  const [selectedCalendars, setSelectedCalendars] = useState({})

  useEffect(() => {
    const initial = {}
    members.forEach(async m => {
      const connected = await api.google?.isConnected(m.id)
      setStatuses(s => ({ ...s, [m.id]: connected }))
      if (m.google_calendar_id) initial[m.id] = m.google_calendar_id
    })
    setSelectedCalendars(initial)
  }, [members.length])

  const connect = async (memberId) => {
    setConnecting(c => ({ ...c, [memberId]: true }))
    try {
      const { url } = await api.google?.getAuthUrl(memberId)
      window.open(url, '_blank', 'width=600,height=700')
      setAwaitingReturn(a => ({ ...a, [memberId]: true }))
    } catch (e) {
      alert('שגיאה בפתיחת חיבור: ' + e.message)
    } finally {
      setConnecting(c => ({ ...c, [memberId]: false }))
    }
  }

  const checkStatus = async (memberId) => {
    const connected = await api.google?.isConnected(memberId)
    setStatuses(s => ({ ...s, [memberId]: connected }))
    setAwaitingReturn(a => ({ ...a, [memberId]: false }))
    if (connected) {
      const cals = await api.google?.getCalendars(memberId)
      if (Array.isArray(cals)) setCalendars(c => ({ ...c, [memberId]: cals }))
    }
  }

  const loadCalendars = async (memberId) => {
    const cals = await api.google?.getCalendars(memberId)
    if (Array.isArray(cals)) setCalendars(c => ({ ...c, [memberId]: cals }))
  }

  const saveCalendar = async (memberId, calendarId) => {
    await api.google?.saveCalendarId({ memberId, calendarId })
    setSelectedCalendars(s => ({ ...s, [memberId]: calendarId }))
    await updateMember({ id: memberId, google_calendar_id: calendarId })
  }

  const disconnect = async (memberId) => {
    await api.google?.disconnect(memberId)
    setStatuses(s => ({ ...s, [memberId]: false }))
    setCalendars(c => ({ ...c, [memberId]: undefined }))
    setAwaitingReturn(a => ({ ...a, [memberId]: false }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <div className="card" style={{ background: '#F0F4FF', border: '1.5px solid #C7D2FE' }}>
        <p style={{ color: 'var(--text-2)', fontSize: '.9rem', margin: 0 }}>
          📅 חיבור Google Calendar מאפשר לכל בן משפחה לראות את האירועים שלו בלוח.
          לחץ <strong>חבר</strong> — תיפתח חלון של Google, התחבר ואז חזור לכאן ולחץ <strong>אישרתי</strong>.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {members.map(m => (
          <div key={m.id} className="card" style={{ border: `2px solid ${m.color}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: statuses[m.id] ? '1rem' : 0 }}>
              <span style={{ fontSize: '1.8rem' }}>{m.avatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: '.8rem', fontWeight: 700, color: statuses[m.id] ? '#2ecc71' : 'var(--text-3)' }}>
                  {statuses[m.id] ? '🟢 מחובר ל-Google Calendar' : '⚪ לא מחובר'}
                </div>
              </div>
              {!statuses[m.id] ? (
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button className="btn btn-primary btn-sm" disabled={connecting[m.id]} onClick={() => connect(m.id)}>
                    {connecting[m.id] ? '...' : '🔗 חבר'}
                  </button>
                  {awaitingReturn[m.id] && (
                    <button className="btn btn-secondary btn-sm" onClick={() => checkStatus(m.id)}>
                      ✅ אישרתי
                    </button>
                  )}
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => disconnect(m.id)}>
                  נתק
                </button>
              )}
            </div>

            {statuses[m.id] && (
              <div>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.5rem' }}>
                  <label className="label" style={{ margin: 0 }}>יומן פעיל:</label>
                  <button className="btn btn-ghost btn-sm" onClick={() => loadCalendars(m.id)}>🔄 רענן</button>
                </div>
                {calendars[m.id] ? (
                  <select className="select" value={selectedCalendars[m.id] || ''}
                    onChange={e => saveCalendar(m.id, e.target.value)}>
                    <option value="">— בחרי יומן —</option>
                    {calendars[m.id].map(cal => (
                      <option key={cal.id} value={cal.id}>{cal.summary}</option>
                    ))}
                  </select>
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => loadCalendars(m.id)}>
                    📋 טעני יומנים
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
