import React from 'react'
import { IconPicker } from 'family-board'

export const Automatic = () => <IconPicker value="" auto="book-open" onChange={() => {}} />
export const Chosen = () => <IconPicker value="keyboard-music" onChange={() => {}} />
export const BesideInput = () => (
  <div className="pl-name-row" style={{ maxWidth: 360 }}>
    <IconPicker value="" auto="brush" onChange={() => {}} />
    <input type="text" defaultValue="לצחצח שיניים" style={{ width: '100%' }} />
  </div>
)
