import React from 'react'
import { Progress } from 'family-board'

const W = ({ children }: { children: React.ReactNode }) => <div style={{ width: 320 }}>{children}</div>
export const Partial = () => <W><Progress done={3} total={5} /></W>
export const Empty = () => <W><Progress done={0} total={4} /></W>
export const Complete = () => <W><Progress done={4} total={4} /></W>
