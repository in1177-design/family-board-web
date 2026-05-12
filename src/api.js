const BASE_URL = 'https://my-family-board.onrender.com'

function getToken() {
  return localStorage.getItem('family_token')
}

async function req(method, path, body) {
  const token = getToken()
  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (res.status === 401) {
    localStorage.removeItem('family_token')
    localStorage.removeItem('family_name')
    window.location.reload()
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const liveApi = {
  family: {
    get: () => {
      const token = getToken()
      if (!token) return Promise.resolve(null)
      const name = localStorage.getItem('family_name') || 'המשפחה שלנו'
      return Promise.resolve({ id: 'live', name })
    },
    setup: ({ name }) => Promise.resolve({ id: 'live', name })
  },
  members: {
    getAll: () => req('GET', '/api/members'),
    create: (m) => req('POST', '/api/members', m),
    update: ({ id, ...data }) => req('PUT', `/api/members/${id}`, data),
    delete: (id) => req('DELETE', `/api/members/${id}`)
  },
  tasks: {
    getAll:    (memberId) => req('GET', `/api/tasks${memberId ? `?memberId=${memberId}` : ''}`),
    create:    (t) => req('POST', '/api/tasks', { ...t, member_id: t.member_id || t.memberId }),
    update:    ({ id, ...data }) => req('PUT', `/api/tasks/${id}`, data),
    complete:  ({ taskId, memberId }) => req('POST', `/api/tasks/${taskId}/complete`, { memberId }),
    uncomplete:({ taskId, memberId }) => req('POST', `/api/tasks/${taskId}/uncomplete`, { memberId }),
    delete:    (id) => req('DELETE', `/api/tasks/${id}`)
  },
  points: {
    addManual:  ({ memberId, points, reason }) => req('POST', '/api/points/manual', { memberId, points, reason }),
    getHistory: (memberId) => req('GET', `/api/points/history${memberId ? `?memberId=${memberId}` : ''}`)
  },
  google: {
    getAuthUrl:    (memberId) => req('GET', `/api/google/auth-url/${memberId}`),
    isConnected:   (memberId) => req('GET', `/api/google/status/${memberId}`).then(d => d?.connected || false),
    getCalendars:  (memberId) => req('GET', `/api/google/calendars/${memberId}`),
    fetchEvents:   ({ memberId, calendarId, timeMin, timeMax }) => {
      const p = new URLSearchParams()
      if (calendarId) p.set('calendarId', calendarId)
      if (timeMin)    p.set('timeMin', timeMin)
      if (timeMax)    p.set('timeMax', timeMax)
      return req('GET', `/api/google/events/${memberId}?${p}`)
    },
    disconnect:     (memberId) => req('DELETE', `/api/google/disconnect/${memberId}`),
    connect:        () => Promise.resolve({ error: 'use_auth_url' }),
    handleCode:     () => Promise.resolve({ error: 'use_callback' }),
    saveCalendarId: () => Promise.resolve({ success: true }),
    saveCredentials:() => Promise.resolve({ success: true }),
    getCredentials: () => Promise.resolve({ clientId: '', clientSecret: '' })
  },
  openExternal: (url) => window.open(url, '_blank')
}
