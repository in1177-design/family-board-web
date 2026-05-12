import { create } from 'zustand'
import { liveApi } from '../api'

const $api = liveApi

export const useStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  family: null,
  members: [],
  tasks: [],
  calendarEvents: {},   // { memberId: [events] }
  activeView: 'home',   // 'home' | 'kid' | 'parent'
  activeMemberId: null,
  loading: false,
  error: null,

  // ── Auth ───────────────────────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem('family_token')
    localStorage.removeItem('family_name')
    set({ family: null, members: [], tasks: [], activeView: 'home', activeMemberId: null })
  },

  // ── Family ─────────────────────────────────────────────────────────────────
  loadFamily: async () => {
    const token = localStorage.getItem('family_token')
    if (!token) {
      set({ family: null, members: [] })
      return { family: null, members: [] }
    }
    const family  = await $api.family?.get()
    const members = await $api.members?.getAll() || []
    set({ family, members })
    return { family, members }
  },

  setupFamily: async (name) => {
    const family = await $api.family?.setup({ name })
    set({ family })
    return family
  },

  // ── Members ────────────────────────────────────────────────────────────────
  createMember: async (data) => {
    const member = await $api.members?.create(data)
    set(s => ({ members: [...s.members, member] }))
    return member
  },

  updateMember: async (data) => {
    const updated = await $api.members?.update(data)
    set(s => ({ members: s.members.map(m => m.id === updated.id ? updated : m) }))
    return updated
  },

  deleteMember: async (id) => {
    await $api.members?.delete(id)
    set(s => ({ members: s.members.filter(m => m.id !== id) }))
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  loadTasks: async (memberId) => {
    const tasks = await $api.tasks?.getAll(memberId) || []
    set({ tasks })
    return tasks
  },

  createTask: async (data) => {
    const task = await $api.tasks?.create(data)
    set(s => ({ tasks: [...s.tasks, task] }))
    return task
  },

  completeTask: async (taskId, memberId) => {
    const updatedMember = await $api.tasks?.complete({ taskId, memberId })
    if (updatedMember) {
      set(s => ({
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, completed: 1, completed_at: new Date().toISOString() } : t),
        members: s.members.map(m => m.id === memberId ? updatedMember : m)
      }))
    }
    return updatedMember
  },

  uncompleteTask: async (taskId, memberId) => {
    const updatedMember = await $api.tasks?.uncomplete({ taskId, memberId })
    if (updatedMember) {
      set(s => ({
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, completed: 0, completed_at: null } : t),
        members: s.members.map(m => m.id === memberId ? updatedMember : m)
      }))
    }
  },

  deleteTask: async (taskId) => {
    await $api.tasks?.delete(taskId)
    set(s => ({ tasks: s.tasks.filter(t => t.id !== taskId) }))
  },

  updateTask: async (data) => {
    const task = await $api.tasks?.update(data)
    set(s => ({ tasks: s.tasks.map(t => t.id === task.id ? task : t) }))
    return task
  },

  // ── Points ─────────────────────────────────────────────────────────────────
  addPoints: async (memberId, points, reason) => {
    const updated = await $api.points?.addManual({ memberId, points, reason })
    if (updated) {
      set(s => ({ members: s.members.map(m => m.id === memberId ? updated : m) }))
    }
    return updated
  },

  // ── Calendar Events ────────────────────────────────────────────────────────
  loadCalendarEvents: async (memberId, calendarId, timeMin, timeMax) => {
    const events = await $api.google?.fetchEvents({ memberId, calendarId, timeMin, timeMax })
    if (Array.isArray(events)) {
      set(s => ({ calendarEvents: { ...s.calendarEvents, [memberId]: events } }))
    }
    return events
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  setActiveView: (view, memberId = null) => set({ activeView: view, activeMemberId: memberId }),

  // ── Helpers ────────────────────────────────────────────────────────────────
  getActiveMember: () => {
    const { members, activeMemberId } = get()
    return members.find(m => m.id === activeMemberId) || null
  },

  getMemberTasks: (memberId) => {
    return get().tasks.filter(t => t.member_id === memberId)
  }
}))

export { $api as api }
