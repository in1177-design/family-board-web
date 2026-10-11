import React from 'react'
import { Icon, ICON_NAMES } from 'family-board'

export const AllIcons = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 64px)', gap: 8, color: 'var(--pl-text)' }}>
    {ICON_NAMES.map(n => (
      <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 10 }}>
        <Icon name={n} />
        <span dir="ltr">{n}</span>
      </div>
    ))}
  </div>
)
export const Colored = () => (
  <div style={{ display: 'flex', gap: 16 }}>
    <span style={{ color: '#1FA595' }}><Icon name="star" /></span>
    <span style={{ color: '#F25CCB' }}><Icon name="heart" /></span>
    <span style={{ color: '#8E70C9' }}><Icon name="moon" /></span>
    <span style={{ color: '#E0A100' }}><Icon name="sun" /></span>
  </div>
)
