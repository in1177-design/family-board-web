import React, { useState } from 'react'

const BASE_URL = 'https://my-family-board.onrender.com'

const ERROR_MESSAGES = {
  invalid_credentials: 'שם משפחה או סיסמה שגויים',
  family_not_found:    'משפחה לא נמצאה — אולי כדאי ליצור משפחה חדשה?',
  wrong_password:      'סיסמה שגויה',
  family_exists:       'שם משפחה כבר קיים, אפשר להיכנס עם הכניסה הרגילה',
  name_taken:          'שם משפחה כבר קיים'
}

export default function LoginScreen({ onLogin }) {
  const [tab, setTab]           = useState('login')
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handle = async () => {
    if (!name.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    try {
      const endpoint = tab === 'register' ? '/api/auth/setup' : '/api/auth/login'
      const res = await fetch(BASE_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyName: name.trim(), password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(ERROR_MESSAGES[data.error] || data.error || 'שגיאה')
      localStorage.setItem('family_token', data.token)
      localStorage.setItem('family_name', name.trim())
      onLogin()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div className="card animate-slide" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        <div className="text-center mb-3">
          <div style={{ fontSize: '3.5rem', marginBottom: '.5rem' }}>🏠</div>
          <h1 style={{ color: 'var(--purple)' }}>Family Board</h1>
          <p style={{ color: 'var(--text-3)' }}>הלוח המשפחתי שלכם</p>
        </div>

        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
          {[['login', 'כניסה'], ['register', 'משפחה חדשה']].map(([val, label]) => (
            <button
              key={val}
              className={`btn ${tab === val ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
              onClick={() => { setTab(val); setError('') }}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="label">שם המשפחה</label>
        <input
          className="input mb-2"
          placeholder="משפחת כהן"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <label className="label">סיסמה</label>
        <input
          className="input mb-3"
          type="password"
          placeholder="הכנס/י סיסמה"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
        />

        {error && (
          <p style={{ color: 'var(--red)', marginBottom: '1rem', textAlign: 'center', fontSize: '.9rem' }}>
            {error}
          </p>
        )}

        <button
          className="btn btn-primary w-full"
          onClick={handle}
          disabled={loading || !name.trim() || !password.trim()}
        >
          {loading ? '...' : tab === 'login' ? '🔓 כניסה' : '🚀 יצירת משפחה'}
        </button>
      </div>
    </div>
  )
}
