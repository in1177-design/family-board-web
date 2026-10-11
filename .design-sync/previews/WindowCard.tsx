import React from 'react'
import { WindowCard } from 'family-board'

const noop = () => {}
const today = '2026-10-08'
const handlers = { onMark: noop, onSetTime: noop, onToggleTodo: noop, onEditTodo: noop, onAdd: noop, onAddTodo: noop }
const W = ({ children }: { children: React.ReactNode }) => <div style={{ width: 400 }}>{children}</div>

export const Morning = () => (
  <W>
    <WindowCard id="morning" label="בוקר" tagline="מתחילים את היום ברגל ימין" window={{ start: '06:30', end: '08:00' }}
      today={today} now="07:10" streak={4} {...handlers}
      steps={[
        { id: 'a', label: 'להתלבש', done: true, days_rule: 'every_day', library_step_id: 'lib-m-dress' },
        { id: 'b', label: 'ארוחת בוקר', done: false, days_rule: 'every_day', time_today: '07:15', exact_time: '07:15', points: 2 },
        { id: 'c', label: 'לצחצח שיניים', done: false, days_rule: 'every_day' }
      ]}
      todos={[{ id: 't', title: 'לקחת אישור חתום', due_date: today, due_time: '07:40' }]} />
  </W>
)
export const Evening = () => (
  <W>
    <WindowCard id="evening" label="ערב" tagline="מתכוננים למחר" window={{ start: '18:00', end: '21:00' }}
      today={today} now="19:00" {...handlers}
      steps={[
        { id: 'd', label: 'להתקלח', done: false, days_rule: 'every_day', library_step_id: 'lib-e-shower' },
        { id: 'e', label: 'לקרוא ספר', done: false, days_rule: 'every_day', duration_minutes: 20 },
        { id: 'f', label: 'להכין תיק למחר', done: false, days_rule: 'before_school_day' }
      ]}
      todos={[]} />
  </W>
)
export const HabitList = () => (
  <W>
    <WindowCard id="noon" label="צהריים" tagline="אחרי בית הספר" window={{ start: '13:00', end: '18:00' }}
      today={today} now="15:00" habitList {...handlers}
      steps={[
        { id: 'g', label: 'שיעורי בית', done: false, days_rule: 'school_days', duration_minutes: 45 },
        { id: 'h', label: 'לתלות את התיק', done: true, days_rule: 'school_days', library_step_id: 'lib-n-hang' }
      ]}
      todos={[{ id: 'u', title: 'שיעור פסנתר', due_date: today, due_time: '16:30' }]} />
  </W>
)
