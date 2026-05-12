const { contextBridge, ipcRenderer } = require('electron')

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

contextBridge.exposeInMainWorld('api', {
  // Family
  family: {
    get: () => invoke('family:get'),
    setup: (data) => invoke('family:setup', data)
  },

  // Members
  members: {
    getAll: () => invoke('members:getAll'),
    create: (m) => invoke('members:create', m),
    update: (m) => invoke('members:update', m),
    delete: (id) => invoke('members:delete', id)
  },

  // Tasks
  tasks: {
    getAll: (memberId) => invoke('tasks:getAll', memberId),
    create: (t) => invoke('tasks:create', t),
    complete: (data) => invoke('tasks:complete', data),
    uncomplete: (data) => invoke('tasks:uncomplete', data),
    delete: (id) => invoke('tasks:delete', id),
    update: (t) => invoke('tasks:update', t)
  },

  // Points
  points: {
    addManual: (data) => invoke('points:addManual', data),
    getHistory: (memberId) => invoke('points:getHistory', memberId)
  },

  // Google Calendar
  google: {
    getAuthUrl: (memberId) => invoke('google:getAuthUrl', memberId),
    handleCode: (data) => invoke('google:handleCode', data),
    getCalendars: (memberId) => invoke('google:getCalendars', memberId),
    fetchEvents: (data) => invoke('google:fetchEvents', data),
    saveCalendarId: (data) => invoke('google:saveCalendarId', data),
    connect: (memberId) => invoke('google:connect', memberId),
    isConnected: (memberId) => invoke('google:isConnected', memberId),
    disconnect: (memberId) => invoke('google:disconnect', memberId),
    saveCredentials: (data) => invoke('google:saveCredentials', data),
    getCredentials: () => invoke('google:getCredentials')
  },

  // Shell
  openExternal: (url) => invoke('shell:openExternal', url)
})
