import React from 'react'
import { TodoCard } from 'family-board'

const today = '2026-10-08'
const card = (todo: any, extra: any = {}) => (
  <div style={{ width: 380 }}>
    <TodoCard todo={todo} today={today} onToggle={() => {}} onEdit={() => {}} {...extra} />
  </div>
)

export const Today = () => card({ id: 't1', title: 'להחזיר ספר לספרייה', due_date: today, due_time: '16:00' })
export const Overdue = () => card({ id: 't2', title: 'לחתום על אישור טיול', due_date: '2026-10-07' }, { late: true })
export const Repeating = () => card({ id: 't3', title: 'להאכיל את הדגים', due_date: today, repeat: { unit: 'day', every: 1 } })
export const InWindow = () => card({ id: 't4', title: 'שיעור פסנתר', due_date: today, due_time: '17:30' }, { inWindow: true })
export const Done = () => card({ id: 't5', title: 'לקנות מחברת', due_date: today, done_at: '2026-10-08T09:00:00Z' })
