import React from 'react'
import { Modal, PixelButton, IconPicker } from 'family-board'

// The overlay is position:fixed; the transform makes this box its containing block, so it stays inside the card
const Stage = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', height: 440, transform: 'translateZ(0)' }}>{children}</div>
)

export const TaskForm = () => (
  <Stage>
    <Modal title="משימה חדשה" onClose={() => {}}>
      <div className="pl-col" style={{ gap: 16 }}>
        <div className="pl-col" style={{ gap: 6 }}>
          <strong>מה צריך לעשות?</strong>
          <div className="pl-name-row">
            <IconPicker value="" auto="backpack" onChange={() => {}} />
            <input type="text" defaultValue="להכין תיק לטיול" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="pl-form-buttons">
          <PixelButton variant="main">שמור</PixelButton>
          <PixelButton variant="secondary" className="pl-form-cancel">בטל</PixelButton>
        </div>
      </div>
    </Modal>
  </Stage>
)
