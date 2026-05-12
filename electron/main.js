const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const { initDatabase, db } = require('./database')
const { setupGoogleAuth, getAuthUrl, connectMember, handleAuthCode, refreshTokenIfNeeded, fetchCalendarEvents, saveGoogleCredentials, getGoogleCredentials } = require('./googleAuth')

const isDev = process.env.NODE_ENV !== 'production'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#F0F4FF',
    show: false
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())
}

app.whenReady().then(async () => {
  await initDatabase()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC: Family ─────────────────────────────────────────────────────────────

ipcMain.handle('family:get', () => {
  return db.prepare('SELECT * FROM families LIMIT 1').get()
})

ipcMain.handle('family:setup', (_, { name }) => {
  const { v4: uuidv4 } = require('uuid')
  const id = uuidv4()
  db.prepare('INSERT OR IGNORE INTO families (id, name, created_at) VALUES (?, ?, ?)').run(id, name, new Date().toISOString())
  return db.prepare('SELECT * FROM families LIMIT 1').get()
})

// ─── IPC: Members ─────────────────────────────────────────────────────────────

ipcMain.handle('members:getAll', () => {
  const family = db.prepare('SELECT id FROM families LIMIT 1').get()
  if (!family) return []
  return db.prepare('SELECT * FROM members WHERE family_id = ?').all(family.id)
})

ipcMain.handle('members:create', (_, member) => {
  const { v4: uuidv4 } = require('uuid')
  const family = db.prepare('SELECT id FROM families LIMIT 1').get()
  if (!family) throw new Error('No family found')
  const id = uuidv4()
  db.prepare(`
    INSERT INTO members (id, family_id, name, role, color, avatar, pin, points)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `).run(id, family.id, member.name, member.role, member.color, member.avatar, member.pin || null)
  return db.prepare('SELECT * FROM members WHERE id = ?').get(id)
})

ipcMain.handle('members:update', (_, { id, ...data }) => {
  const allowed = ['name','role','color','avatar','pin','google_calendar_id']
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  if (Object.keys(filtered).length === 0) return db.prepare('SELECT * FROM members WHERE id = ?').get(id)
  const fields = Object.keys(filtered).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE members SET ${fields} WHERE id = ?`).run(...Object.values(filtered), id)
  return db.prepare('SELECT * FROM members WHERE id = ?').get(id)
})

ipcMain.handle('members:delete', (_, id) => {
  db.prepare('DELETE FROM members WHERE id = ?').run(id)
  return { success: true }
})

// ─── IPC: Tasks ───────────────────────────────────────────────────────────────

ipcMain.handle('tasks:getAll', (_, memberId) => {
  const family = db.prepare('SELECT id FROM families LIMIT 1').get()
  if (!family) return []
  if (memberId) {
    return db.prepare('SELECT * FROM tasks WHERE family_id = ? AND member_id = ? ORDER BY due_date ASC, created_at DESC').all(family.id, memberId)
  }
  return db.prepare('SELECT * FROM tasks WHERE family_id = ? ORDER BY due_date ASC, created_at DESC').all(family.id)
})

ipcMain.handle('tasks:create', (_, task) => {
  const { v4: uuidv4 } = require('uuid')
  const family = db.prepare('SELECT id FROM families LIMIT 1').get()
  if (!family) throw new Error('No family found')
  const id = uuidv4()
  db.prepare(`
    INSERT INTO tasks (id, family_id, member_id, title, description, points, due_date, completed, recurring, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(id, family.id, task.memberId, task.title, task.description || '', task.points || 10, task.dueDate || null, task.recurring || null, task.createdBy || null, new Date().toISOString())
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
})

ipcMain.handle('tasks:complete', (_, { taskId, memberId }) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId)
  if (!task) throw new Error('Task not found')
  db.prepare('UPDATE tasks SET completed = 1, completed_at = ? WHERE id = ?').run(new Date().toISOString(), taskId)
  db.prepare('UPDATE members SET points = points + ? WHERE id = ?').run(task.points, memberId)
  const { v4: uuidv4 } = require('uuid')
  const family = db.prepare('SELECT id FROM families LIMIT 1').get()
  db.prepare(`
    INSERT INTO points_history (id, family_id, member_id, task_id, points, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), family.id, memberId, taskId, task.points, `השלמת משימה: ${task.title}`, new Date().toISOString())
  return db.prepare('SELECT * FROM members WHERE id = ?').get(memberId)
})

ipcMain.handle('tasks:uncomplete', (_, { taskId, memberId }) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId)
  if (!task || !task.completed) return null
  db.prepare('UPDATE tasks SET completed = 0, completed_at = NULL WHERE id = ?').run(taskId)
  db.prepare('UPDATE members SET points = MAX(0, points - ?) WHERE id = ?').run(task.points, memberId)
  return db.prepare('SELECT * FROM members WHERE id = ?').get(memberId)
})

ipcMain.handle('tasks:delete', (_, taskId) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId)
  return { success: true }
})

ipcMain.handle('tasks:update', (_, { id, ...data }) => {
  const allowed = ['title','description','points','due_date','recurring','member_id']
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  if (Object.keys(filtered).length === 0) return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  const fields = Object.keys(filtered).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE tasks SET ${fields} WHERE id = ?`).run(...Object.values(filtered), id)
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
})

// ─── IPC: Points ──────────────────────────────────────────────────────────────

ipcMain.handle('points:addManual', (_, { memberId, points, reason }) => {
  const { v4: uuidv4 } = require('uuid')
  const family = db.prepare('SELECT id FROM families LIMIT 1').get()
  db.prepare('UPDATE members SET points = points + ? WHERE id = ?').run(points, memberId)
  db.prepare(`
    INSERT INTO points_history (id, family_id, member_id, task_id, points, reason, created_at)
    VALUES (?, ?, ?, NULL, ?, ?, ?)
  `).run(uuidv4(), family.id, memberId, points, reason || 'בונוס ידני', new Date().toISOString())
  return db.prepare('SELECT * FROM members WHERE id = ?').get(memberId)
})

ipcMain.handle('points:getHistory', (_, memberId) => {
  if (memberId) {
    return db.prepare('SELECT * FROM points_history WHERE member_id = ? ORDER BY created_at DESC LIMIT 50').all(memberId)
  }
  const family = db.prepare('SELECT id FROM families LIMIT 1').get()
  if (!family) return []
  return db.prepare('SELECT * FROM points_history WHERE family_id = ? ORDER BY created_at DESC LIMIT 100').all(family.id)
})

// ─── IPC: Google Calendar ─────────────────────────────────────────────────────

ipcMain.handle('google:getAuthUrl', (_, memberId) => {
  return getAuthUrl(memberId)
})

// New: one-click connect — opens browser, waits for localhost redirect automatically
ipcMain.handle('google:connect', async (_, memberId) => {
  return await connectMember(memberId)
})

ipcMain.handle('google:handleCode', async (_, { code, memberId }) => {
  return await handleAuthCode(code, memberId)
})

ipcMain.handle('google:getCalendars', async (_, memberId) => {
  const token = db.prepare('SELECT * FROM google_tokens WHERE member_id = ?').get(memberId)
  if (!token) return { error: 'not_connected' }
  try {
    await refreshTokenIfNeeded(memberId)
    const { google } = require('googleapis')
    const auth = setupGoogleAuth()
    const stored = db.prepare('SELECT * FROM google_tokens WHERE member_id = ?').get(memberId)
    auth.setCredentials({ access_token: stored.access_token, refresh_token: stored.refresh_token })
    const cal = google.calendar({ version: 'v3', auth })
    const res = await cal.calendarList.list()
    return res.data.items || []
  } catch (e) {
    return { error: e.message }
  }
})

ipcMain.handle('google:fetchEvents', async (_, { memberId, calendarId, timeMin, timeMax }) => {
  return await fetchCalendarEvents(memberId, calendarId, timeMin, timeMax)
})

ipcMain.handle('google:saveCalendarId', (_, { memberId, calendarId }) => {
  db.prepare('UPDATE members SET google_calendar_id = ? WHERE id = ?').run(calendarId, memberId)
  return { success: true }
})

ipcMain.handle('google:isConnected', (_, memberId) => {
  const token = db.prepare('SELECT member_id FROM google_tokens WHERE member_id = ?').get(memberId)
  return !!token
})

ipcMain.handle('google:disconnect', (_, memberId) => {
  db.prepare('DELETE FROM google_tokens WHERE member_id = ?').run(memberId)
  return { success: true }
})

ipcMain.handle('google:saveCredentials', (_, { clientId, clientSecret }) => {
  saveGoogleCredentials(clientId, clientSecret)
  return { success: true }
})

ipcMain.handle('google:getCredentials', () => {
  return getGoogleCredentials()
})

ipcMain.handle('shell:openExternal', (_, url) => {
  shell.openExternal(url)
})
