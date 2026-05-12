const path = require('path')
const fs = require('fs')
const { app } = require('electron')

const dbPath = app
  ? path.join(app.getPath('userData'), 'familyboard.db')
  : path.join(__dirname, '..', 'familyboard.db')

let SQL = null
let _db = null
let _saveTimer = null

// Lazy-save: batch writes to avoid hammering the FS
function scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    if (_db) {
      const data = _db.export()
      fs.writeFileSync(dbPath, Buffer.from(data))
    }
  }, 200)
}

// Minimal synchronous wrapper that mirrors better-sqlite3's API surface
// used in main.js: db.prepare(sql).run(...) / .get(...) / .all(...)
class Stmt {
  constructor(db, sql) {
    this._db = db
    this._sql = sql
  }

  run(...args) {
    this._db.run(this._sql, flatten(args))
    scheduleSave()
    return { changes: this._db.getRowsModified() }
  }

  get(...args) {
    const rows = this._db.exec(this._sql, flatten(args))
    if (!rows.length || !rows[0].values.length) return undefined
    return zipRow(rows[0].columns, rows[0].values[0])
  }

  all(...args) {
    const rows = this._db.exec(this._sql, flatten(args))
    if (!rows.length) return []
    return rows[0].values.map(v => zipRow(rows[0].columns, v))
  }
}

function flatten(args) {
  if (args.length === 1 && Array.isArray(args[0])) return args[0]
  return args
}

function zipRow(cols, vals) {
  const obj = {}
  cols.forEach((c, i) => { obj[c] = vals[i] })
  return obj
}

// Public db proxy — identical surface to better-sqlite3
const db = new Proxy({}, {
  get(_, prop) {
    if (prop === 'prepare') {
      return (sql) => new Stmt(_db, sql)
    }
    if (prop === 'exec') {
      return (sql) => { _db.run(sql); scheduleSave() }
    }
    if (prop === 'pragma') {
      return () => {}   // no-op, sql.js handles this internally
    }
    if (prop === 'transaction') {
      return (fn) => (...args) => { fn(...args); scheduleSave() }
    }
    return undefined
  }
})

async function initDatabase() {
  SQL = await require('sql.js')({
    locateFile: file => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
  })

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    _db = new SQL.Database(fileBuffer)
  } else {
    _db = new SQL.Database()
  }

  createSchema()
  return _db
}

function createSchema() {
  _db.run(`
    CREATE TABLE IF NOT EXISTS families (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id                  TEXT PRIMARY KEY,
      family_id           TEXT NOT NULL,
      name                TEXT NOT NULL,
      role                TEXT NOT NULL,
      color               TEXT NOT NULL DEFAULT '#6C63FF',
      avatar              TEXT,
      pin                 TEXT,
      points              INTEGER NOT NULL DEFAULT 0,
      google_calendar_id  TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id           TEXT PRIMARY KEY,
      family_id    TEXT NOT NULL,
      member_id    TEXT NOT NULL,
      title        TEXT NOT NULL,
      description  TEXT DEFAULT '',
      points       INTEGER NOT NULL DEFAULT 10,
      due_date     TEXT,
      completed    INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      recurring    TEXT,
      created_by   TEXT,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS points_history (
      id          TEXT PRIMARY KEY,
      family_id   TEXT NOT NULL,
      member_id   TEXT NOT NULL,
      task_id     TEXT,
      points      INTEGER NOT NULL,
      reason      TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS google_tokens (
      member_id     TEXT PRIMARY KEY,
      access_token  TEXT NOT NULL,
      refresh_token TEXT,
      expiry_date   INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_member  ON tasks(member_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_due     ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_points_member ON points_history(member_id);
  `)
  scheduleSave()
}

module.exports = { initDatabase, get db() { return db } }
