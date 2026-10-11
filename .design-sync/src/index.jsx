// נקודת הכניסה לסנכרון עם Claude Design (design-sync). רק מייצאת רכיבים קיימים מהאפליקציה, בלי לשנות אותם
import React from 'react'
export { default as PixelButton } from '../../src/components/shared/PixelButton'
export { default as PixelCard } from '../../src/components/shared/PixelCard'
export { default as Modal } from '../../src/components/shared/Modal'
export { default as Icon } from '../../src/components/shared/Icon'
export { default as IconPicker } from '../../src/components/shared/IconPicker'
export { Blocks } from '../../src/components/shared/MemberHero'
export { StepCard, WindowCard, Progress } from '../../src/components/MyDay/MyDay'
export { TodoCard } from '../../src/components/MyDay/TodosSection'
export { ICON_NAMES } from '../../src/components/shared/Icon'
export { PIXEL_BUTTON_VARIANTS } from '../../src/components/shared/PixelButton'

// העטיפה שכל רכיב צריך: class "pl" (הסגנונות של plain.css חלים בתוכו), עברית מימין לשמאל, והגופן
export function FamilyBoardRoot({ children, style }) {
  return <div className="pl" dir="rtl" lang="he" style={{ fontFamily: 'var(--pl-font)', color: 'var(--pl-text)', ...style }}>{children}</div>
}
