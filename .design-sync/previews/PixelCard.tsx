import React from 'react'
import { PixelCard, PixelButton } from 'family-board'

export const Default = () => (
  <PixelCard style={{ maxWidth: 360 }}>
    <strong style={{ fontSize: 'var(--pl-size-h3)' }}>המשימות שלי</strong>
    <div className="pl-muted" style={{ fontSize: 'var(--pl-size-sm)' }}>משימות עתידיות יופיעו כאן בזמן הנכון</div>
  </PixelCard>
)
export const WithAction = () => (
  <PixelCard className="pl-col" style={{ maxWidth: 360, gap: 12 }}>
    <strong style={{ fontSize: 'var(--pl-size-h3)' }}>כל הכבוד!</strong>
    <div>סיימת את כל ההרגלים של הבוקר.</div>
    <PixelButton variant="main">לקבל נקודות</PixelButton>
  </PixelCard>
)
export const CustomColor = () => (
  <PixelCard color="#F25CCB" bg="#FFF2FB" style={{ maxWidth: 360 }}>
    <strong>כרטיס בצבע אחר</strong>
    <div className="pl-muted">מסגרת ורודה ורקע ורוד בהיר</div>
  </PixelCard>
)
