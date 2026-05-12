import React from 'react'

export default function Loader({ message = 'טוען...' }) {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
      background: 'var(--bg)'
    }}>
      <div style={{ fontSize: '4rem', animation: 'float 2s ease-in-out infinite' }}>🌟</div>
      <div style={{
        width: 48, height: 48, border: '4px solid var(--border)',
        borderTopColor: 'var(--purple)', borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: 'var(--text-2)', fontWeight: 500 }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
