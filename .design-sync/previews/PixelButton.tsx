import React from 'react'
import { PixelButton } from 'family-board'

export const Main = () => <PixelButton variant="main">שמור</PixelButton>
export const Secondary = () => <PixelButton variant="secondary">בטל</PixelButton>
export const FormButtons = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <PixelButton variant="main" style={{ minWidth: 160 }}>שמור</PixelButton>
    <PixelButton variant="secondary">בטל</PixelButton>
  </div>
)
export const Pink = () => <PixelButton>+ הוספת משימה</PixelButton>
export const CustomColors = () => <PixelButton color="#8E70C9" fill="#F1EAFB" shade="#D9C9F2" n={3}>מתחילים את היום</PixelButton>
