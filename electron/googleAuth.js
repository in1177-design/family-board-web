const { google } = require('googleapis')
const { db } = require('./database')
const http = require('http')
const { shell } = require('electron')

let Store
try { Store = require('electron-store') } catch(e) {}
const store = Store ? new Store() : { get: () => null, set: () => {} }

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
const REDIRECT_PORT = 8765
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`

let activeServer = null

function getCredentials() {
  return {
    clientId: store.get('google.clientId', ''),
    clientSecret: store.get('google.clientSecret', '')
  }
}

function setupGoogleAuth() {
  const { clientId, clientSecret } = getCredentials()
  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)
}

// Starts a one-shot local HTTP server, opens the browser, waits for the redirect,
// then resolves with the auth code.
function closeActiveServer() {
  if (activeServer) {
    try { activeServer.close() } catch (e) {}
    activeServer = null
  }
}

function getAuthCodeViaLocalServer(url) {
  closeActiveServer()
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      activeServer = null
      const params = new URL(req.url, `http://localhost:${REDIRECT_PORT}`)
      const code  = params.searchParams.get('code')
      const error = params.searchParams.get('error')

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      if (code) {
        res.end(`
          <html><body style="font-family:sans-serif;text-align:center;padding:3rem">
            <h2>✅ החיבור הצליח!</h2>
            <p>ניתן לסגור את הדפדפן ולחזור לאפליקציה.</p>
            <script>window.close()</script>
          </body></html>`)
        server.close()
        resolve(code)
      } else {
        res.end(`<html><body><h2>❌ שגיאה: ${error}</h2></body></html>`)
        server.close()
        reject(new Error(error || 'No code received'))
      }
    })

    server.listen(REDIRECT_PORT, '127.0.0.1', () => {
      activeServer = server
      shell.openExternal(url)
    })

    server.on('error', (err) => {
      activeServer = null
      reject(err)
    })

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close()
      activeServer = null
      reject(new Error('timeout'))
    }, 5 * 60 * 1000)
  })
}

function getAuthUrl(memberId) {
  const { clientId, clientSecret } = getCredentials()
  if (!clientId || !clientSecret) return { error: 'missing_credentials' }

  const auth = setupGoogleAuth()
  const url = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: memberId
  })
  return { url }
}

// New: full automatic flow — opens browser, waits for redirect, saves tokens
async function connectMember(memberId) {
  const { clientId, clientSecret } = getCredentials()
  if (!clientId || !clientSecret) return { error: 'missing_credentials' }

  const auth = setupGoogleAuth()
  const url = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: memberId
  })

  try {
    const code = await getAuthCodeViaLocalServer(url)
    return await handleAuthCode(code, memberId)
  } catch (e) {
    return { error: e.message }
  }
}

async function handleAuthCode(code, memberId) {
  try {
    const auth = setupGoogleAuth()
    const { tokens } = await auth.getToken(code)
    db.prepare(`
      INSERT OR REPLACE INTO google_tokens (member_id, access_token, refresh_token, expiry_date)
      VALUES (?, ?, ?, ?)
    `).run(memberId, tokens.access_token, tokens.refresh_token || null, tokens.expiry_date || null)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

async function refreshTokenIfNeeded(memberId) {
  const stored = db.prepare('SELECT * FROM google_tokens WHERE member_id = ?').get(memberId)
  if (!stored) return null

  const needsRefresh = stored.expiry_date && stored.expiry_date - Date.now() < 5 * 60 * 1000
  if (needsRefresh && stored.refresh_token) {
    const auth = setupGoogleAuth()
    auth.setCredentials({ refresh_token: stored.refresh_token })
    const { credentials } = await auth.refreshAccessToken()
    db.prepare('UPDATE google_tokens SET access_token = ?, expiry_date = ? WHERE member_id = ?')
      .run(credentials.access_token, credentials.expiry_date, memberId)
    return credentials.access_token
  }
  return stored.access_token
}

async function fetchCalendarEvents(memberId, calendarId, timeMin, timeMax) {
  const token = db.prepare('SELECT * FROM google_tokens WHERE member_id = ?').get(memberId)
  if (!token) return { error: 'not_connected' }

  try {
    await refreshTokenIfNeeded(memberId)
    const auth = setupGoogleAuth()
    const stored = db.prepare('SELECT * FROM google_tokens WHERE member_id = ?').get(memberId)
    auth.setCredentials({ access_token: stored.access_token, refresh_token: stored.refresh_token })

    const cal = google.calendar({ version: 'v3', auth })
    const res = await cal.events.list({
      calendarId: calendarId || 'primary',
      timeMin:    timeMin  || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      timeMax:    timeMax  || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy:    'startTime',
      maxResults: 500
    })
    return res.data.items || []
  } catch (e) {
    return { error: e.message }
  }
}

function saveGoogleCredentials(clientId, clientSecret) {
  store.set('google.clientId', clientId)
  store.set('google.clientSecret', clientSecret)
}

function getGoogleCredentials() {
  return getCredentials()
}

module.exports = {
  setupGoogleAuth, getAuthUrl, connectMember,
  handleAuthCode, refreshTokenIfNeeded,
  fetchCalendarEvents, saveGoogleCredentials, getGoogleCredentials
}
