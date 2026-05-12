import React, { useState } from 'react'
import { useStore } from '../../store'

const COLORS = ['#6C63FF','#FF7043','#69F0AE','#FFD740','#4FC3F7','#F48FB1','#26C6DA','#FF5252']
const AVATARS = ['🦁','🐯','🦊','🐻','🐼','🦄','🐸','🐧','🦋','🐬','🐙','🦖']

export default function SetupWizard({ familyExists = false }) {
  const { setupFamily, createMember, loadFamily } = useStore()
  const [step, setStep] = useState(familyExists ? 1 : 0)
  const [familyName, setFamilyName] = useState('')
  const [members, setMembers] = useState([
    { name: '', role: 'parent', color: COLORS[0], avatar: AVATARS[0], pin: '' },
    { name: '', role: 'child',  color: COLORS[1], avatar: AVATARS[1], pin: '' }
  ])
  const [saving, setSaving] = useState(false)

  const addMember = () => {
    setMembers(m => [...m, {
      name: '', role: 'child',
      color: COLORS[m.length % COLORS.length],
      avatar: AVATARS[m.length % AVATARS.length],
      pin: ''
    }])
  }

  const updateMember = (i, field, val) => {
    setMembers(m => m.map((x, idx) => idx === i ? { ...x, [field]: val } : x))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (!familyExists) await setupFamily(familyName || 'המשפחה שלנו')
      for (const m of members) {
        if (m.name.trim()) await createMember(m)
      }
      await loadFamily()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div className="card animate-slide" style={{ width: '100%', maxWidth: 560, padding: '2.5rem' }}>
        {/* Header */}
        <div className="text-center mb-3">
          <div style={{ fontSize: '3.5rem', marginBottom: '.5rem' }}>🏠</div>
          <h1 style={{ color: 'var(--purple)' }}>ברוכים הבאים ל-Family Board!</h1>
          <p>בואו נגדיר את לוח המשפחה שלכם</p>
        </div>

        {/* Step 0: Family name */}
        {step === 0 && (
          <div className="animate-slide">
            <label className="label">שם המשפחה</label>
            <input
              className="input"
              placeholder="משפחת כהן"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              autoFocus
            />
            <button
              className="btn btn-primary w-full mt-3"
              onClick={() => setStep(1)}
              disabled={!familyName.trim()}
            >
              המשך ←
            </button>
          </div>
        )}

        {/* Step 1: Members */}
        {step === 1 && (
          <div className="animate-slide">
            <h3 className="mb-2">הוספת בני המשפחה</h3>
            <div className="flex-col gap-2" style={{ maxHeight: '55vh', overflowY: 'auto', paddingLeft: '.5rem' }}>
              {members.map((m, i) => (
                <div key={i} className="card" style={{ padding: '1rem', background: '#F8F8FF' }}>
                  <div className="flex items-center gap-1 mb-1">
                    {/* Avatar picker */}
                    <select
                      value={m.avatar}
                      onChange={e => updateMember(i, 'avatar', e.target.value)}
                      style={{
                        fontSize: '1.8rem', border: 'none', background: 'transparent',
                        cursor: 'pointer', padding: '0 .25rem'
                      }}
                    >
                      {AVATARS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <input
                      className="input"
                      placeholder={m.role === 'parent' ? 'שם ההורה' : `שם הילד/ה`}
                      value={m.name}
                      onChange={e => updateMember(i, 'name', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="flex gap-1 items-center">
                    <select
                      className="select"
                      value={m.role}
                      onChange={e => updateMember(i, 'role', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="parent">הורה</option>
                      <option value="child">ילד/ה</option>
                    </select>
                    {m.role === 'child' && (
                      <input
                        className="input"
                        placeholder="קוד סודי (4 ספרות)"
                        value={m.pin}
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={e => updateMember(i, 'pin', e.target.value.replace(/\D/,''))}
                        style={{ flex: 1 }}
                      />
                    )}
                    {/* Color circles */}
                    <div className="flex gap-1" style={{ flexWrap: 'wrap', maxWidth: 120 }}>
                      {COLORS.map(c => (
                        <div
                          key={c}
                          onClick={() => updateMember(i, 'color', c)}
                          style={{
                            width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
                            border: m.color === c ? '3px solid #333' : '2px solid transparent',
                            transition: 'transform .15s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-ghost w-full mt-2" onClick={addMember} style={{ border: '2px dashed var(--border)' }}>
              + הוסף בן/בת משפחה
            </button>

            <button
              className="btn btn-primary w-full mt-2"
              onClick={handleSubmit}
              disabled={saving || !members.some(m => m.name.trim())}
            >
              {saving ? 'שומר...' : '🚀 בואו נתחיל!'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
