import React from 'react'
import { StepCard } from 'family-board'

const w = { start: '06:30', end: '08:00' }
const base = { days_rule: 'every_day', points: 0, icon: '' }
const card = (step: any) => (
  <div style={{ width: 380 }}>
    <StepCard step={{ ...base, ...step }} window={w} now="07:10" onChange={() => {}} onSetTime={() => {}} />
  </div>
)

export const Default = () => card({ id: 's1', label: 'לצחצח שיניים', done: false })
export const WithTime = () => card({ id: 's2', label: 'ארוחת בוקר', done: false, time_today: '07:15', exact_time: '07:15', days_rule: 'school_days' })
export const WithDurationAndPoints = () => card({ id: 's3', label: 'לקרוא ספר', done: false, duration_minutes: 30, points: 5 })
export const Done = () => card({ id: 's4', label: 'להתלבש', done: true, library_step_id: 'lib-m-dress' })
export const LongName = () => card({ id: 's5', label: 'להכין את התיק לבית הספר ולבדוק שיש מחברות', done: false, duration_minutes: 10, days_rule: 'before_school_day' })
