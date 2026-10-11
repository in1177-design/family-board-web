import React from 'react'
import { PixelCard, PixelButton, Blocks } from 'family-board'

// FamilyBoardRoot wraps every preview already (cfg.provider); this shows a small screen built inside it
export const Screen = () => (
  <div className="pl-col" style={{ gap: 12, maxWidth: 420, background: 'var(--pl-page)', padding: 16 }}>
    <h2 style={{ fontSize: 'var(--pl-size-h2)' }}>בוקר טוב, ריקי</h2>
    <div className="pl-row" style={{ gap: 8 }}><Blocks percent={40} /><span className="pl-muted">40%</span></div>
    <PixelCard className="pl-col" style={{ gap: 8 }}>
      <strong>נשארו רק 3, עוד קצת וסיימת!</strong>
      <PixelButton variant="main">לכל ההרגלים</PixelButton>
    </PixelCard>
  </div>
)
