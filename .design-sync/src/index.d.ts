// הטיפוסים של רכיבי Family Board, לסנכרון עם Claude Design. הרכיבים עצמם ב-JS, אז הטיפוסים נכתבו ביד
import * as React from 'react'

/** Wrapper every Family Board component needs: class "pl", Hebrew RTL, the app font. Wrap each screen in it once. */
export interface FamilyBoardRootProps {
  children?: React.ReactNode
  style?: React.CSSProperties
}
export declare function FamilyBoardRoot(props: FamilyBoardRootProps): JSX.Element

/** Pixel-art button with a stepped (staircase) border and an inner bottom shade bar that shrinks on press. Use variant "main" for the primary action (turquoise) and "secondary" for cancel/secondary (grey). */
export interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ready-made look. main = turquoise primary, secondary = grey on cream. Other props override it. */
  variant?: 'main' | 'secondary'
  /** Border color. */
  color?: string
  /** Text color (defaults to the border color). */
  text?: string
  /** Fill color. */
  fill?: string
  /** Inner bottom shade bar color. */
  shade?: string
  /** Border thickness and stair-step size, in px. */
  b?: number
  /** Number of stair steps in each corner. */
  n?: number
  /** Height of the bottom shade bar, in px. */
  depth?: number
  children?: React.ReactNode
}
export declare function PixelButton(props: PixelButtonProps): JSX.Element

/** The pixel card: cream background, thin purple border with a soft offset pixel shadow. Used for the day windows (morning / noon / evening) and the "my tasks" section. */
export interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Own border color, for a card in a different color. */
  color?: string
  /** Own background color. */
  bg?: string
  children?: React.ReactNode
}
export declare function PixelCard(props: PixelCardProps): JSX.Element

/** Modal dialog: title, ✕ close button, closes on Escape and on overlay click. Centered on desktop, bottom sheet on phones (≤700px). 2px pink frame. */
export interface ModalProps {
  /** Heading shown at the top. */
  title: string
  /** Called on ✕, Escape, or overlay click. */
  onClose: () => void
  children?: React.ReactNode
}
export declare function Modal(props: ModalProps): JSX.Element

/** One Pixelarticons pixel icon (24px, color from currentColor). Names: see ICON_NAMES, e.g. sun, moon, star, heart, clock, backpack, book-open, brush, shirt, apple, bed, home, notebook, sparkles, trophy, calendar. */
export interface IconProps {
  /** Icon name from ICON_NAMES. Unknown names render nothing. */
  name: string
  className?: string
}
export declare function Icon(props: IconProps): JSX.Element | null

/** Small 40×40 button that opens a grid of all pixel icons (like an emoji picker), with an "automatic" option. Sits beside a name input in forms. */
export interface IconPickerProps {
  /** Chosen icon name, or '' for automatic. */
  value: string
  /** The automatic icon (shown on the button when value is ''). */
  auto?: string
  onChange: (name: string) => void
}
export declare function IconPicker(props: IconPickerProps): JSX.Element

/** Progress bar split into 10 pixel blocks. */
export interface BlocksProps {
  /** 0–100. */
  percent: number
}
export declare function Blocks(props: BlocksProps): JSX.Element

/** Thin progress bar: done out of total. */
export interface ProgressProps {
  done: number
  total: number
}
export declare function Progress(props: ProgressProps): JSX.Element

/** A habit in the day. */
export interface Step {
  id: string
  label: string
  done: boolean
  /** 'every_day' | 'school_days' | 'weekend' | 'before_school_day' | 'custom' */
  days_rule: string
  /** Weekday numbers (0=Sunday) when days_rule is 'custom'. */
  days_custom?: number[]
  /** Time today, "HH:MM", if set. */
  time_today?: string | null
  exact_time?: string | null
  duration_minutes?: number | null
  points?: number
  /** Icon name. Empty = chosen automatically from the name. */
  icon?: string
  library_step_id?: string | null
}

/** Time window of the day. */
export interface DayWindow {
  /** "HH:MM" */
  start: string
  /** "HH:MM" */
  end: string
}

/** Habit row: checkbox, pixel icon, name, below it the days and duration; on the end a time chip (or a clock icon to set a time) and points. Fixed width, wraps the name. */
export interface StepCardProps {
  step: Step
  window: DayWindow
  /** Current time "HH:MM". */
  now: string
  /** Toggle done. */
  onChange: () => void
  /** Set a time for today ("HH:MM") or null to reset. */
  onSetTime: (time: string | null) => void
}
export declare function StepCard(props: StepCardProps): JSX.Element

/** A task (todo). */
export interface Todo {
  id: string
  title: string
  /** ISO time when done, or null. */
  done_at?: string | null
  /** "YYYY-MM-DD" */
  due_date?: string | null
  /** "HH:MM" */
  due_time?: string | null
  /** e.g. { unit: 'day', every: 1 } or { unit: 'week', every: 1, weekdays: [0,1,2,3,4] } */
  repeat?: { unit: 'day' | 'week' | 'month'; every?: number; weekdays?: number[] } | null
  icon?: string
  location?: string
}

/** Task row: checkbox, pixel icon, title, below it the date and time; ↻ for a repeating task and ✎ to edit. */
export interface TodoCardProps {
  todo: Todo
  /** Today "YYYY-MM-DD", for the date text. */
  today: string
  /** Overdue: the date shows in warning color. */
  late?: boolean
  /** Shown inside a day window: adds a "משימה" (task) tag. */
  inWindow?: boolean
  onToggle: (todo: Todo, done: boolean) => void
  onEdit: (todo: Todo) => void
}
export declare function TodoCard(props: TodoCardProps): JSX.Element

/** A day window card (morning / noon / evening): colored header with a pixel sun/sunset/moon, name, hours, tagline and a done/total chip; a progress bar; habits and tasks sorted by time; "+ הוספה" and a streak at the bottom. Folds when everything is done. */
export interface WindowCardProps {
  id: 'morning' | 'noon' | 'evening'
  /** Window name, e.g. "בוקר". */
  label: string
  /** Short line under the name. */
  tagline?: string
  window: DayWindow
  steps: Step[]
  /** Tasks with a time inside this window. Each needs due_time. */
  todos: Todo[]
  today: string
  now: string
  onMark: (step: Step) => void
  onSetTime: (step: Step, time: string | null) => void
  onToggleTodo: (todo: Todo, done: boolean) => void
  onEditTodo: (todo: Todo) => void
  onAdd: () => void
  /** If set, "+ הוספה" offers habit or task. */
  onAddTodo?: (time: string) => void
  /** Days in a row. */
  streak?: number
  /** The window's time has passed. */
  windowOver?: boolean
  /** Alternate view: habits as a plain list without row frames. */
  habitList?: boolean
}
export declare function WindowCard(props: WindowCardProps): JSX.Element

/** All pixel icon names available to Icon and IconPicker. */
export declare const ICON_NAMES: string[]
/** The ready-made PixelButton looks. */
export declare const PIXEL_BUTTON_VARIANTS: Record<'main' | 'secondary', Required<Pick<PixelButtonProps, 'color' | 'text' | 'fill' | 'shade' | 'b' | 'n' | 'depth'>>>
