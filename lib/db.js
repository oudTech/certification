import pg from 'pg'
import { readStore, writeStore, useFileStore } from './store.js'
import { rowToCertificate, certificateToRow } from './mapCertificate.js'
import { normalizeList, unpackSettingsRow } from './settingsExtras.js'

const { Pool } = pg
let pool = null

function hasPostgresConfig() {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_URL ||
      process.env.DB_HOST
  )
}

export function getDbMode() {
  return hasPostgresConfig() ? 'postgres' : 'file'
}

/** Make Supabase pooler URLs work with node-pg on Vercel serverless. */
function normalizeConnectionString(raw) {
  if (!raw) return raw
  try {
    const url = new URL(raw)
    const isPooler =
      url.port === '6543' ||
      url.hostname.includes('pooler.supabase.com') ||
      url.searchParams.get('pgbouncer') === 'true'

    if (isPooler) {
      url.searchParams.set('pgbouncer', 'true')
    }
    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require')
    }
    return url.toString()
  } catch {
    return raw
  }
}

async function getPool() {
  if (!hasPostgresConfig()) return null
  if (pool) return pool

  const connectionString = normalizeConnectionString(
    process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || undefined
  )

  const ssl =
    process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }

  // Keep pool tiny on serverless; Supabase transaction pooler dislikes many clients
  const max = Number(process.env.DB_CONNECTION_LIMIT || 1)

  pool = connectionString
    ? new Pool({
        connectionString,
        ssl,
        max,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 15_000,
        allowExitOnIdle: true,
      })
    : new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'postgres',
        ssl,
        max,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 15_000,
        allowExitOnIdle: true,
      })

  pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error', err)
  })

  return pool
}

async function query(text, params = []) {
  const db = await getPool()
  return db.query(text, params)
}

/** Used by /api/health to verify the DB is actually reachable. */
export async function pingDatabase() {
  if (!hasPostgresConfig()) {
    return { ok: false, reason: 'no_database_url' }
  }

  try {
    const result = await query(
      `SELECT
         current_database() AS database,
         current_user AS db_user,
         (SELECT COUNT(*)::int FROM admin) AS admin_count,
         (SELECT COUNT(*)::int FROM tracking) AS certificate_count`
    )
    return { ok: true, ...result.rows[0] }
  } catch (error) {
    console.error('Database ping failed', error)
    return {
      ok: false,
      reason: 'query_failed',
      message: error.message,
      code: error.code || null,
    }
  }
}

export async function findAdminByUsername(username) {
  if (useFileStore()) {
    const store = readStore()
    return store.admin.find((a) => a.username === username) || null
  }

  const { rows } = await query(
    'SELECT id, username, password FROM admin WHERE username = $1 LIMIT 1',
    [username]
  )
  return rows[0] || null
}

export async function updateAdminPassword(id, hashedPassword) {
  if (useFileStore()) {
    const store = readStore()
    const admin = store.admin.find((a) => a.id === id)
    if (admin) {
      admin.password = hashedPassword
      writeStore(store)
    }
    return
  }

  await query('UPDATE admin SET password = $1 WHERE id = $2', [hashedPassword, id])
}

export async function getSettings() {
  if (useFileStore()) {
    return unpackSettingsRow(readStore().settings)
  }

  const { rows } = await query('SELECT * FROM settings WHERE id = 1 LIMIT 1')
  return unpackSettingsRow(rows[0] || null)
}

export async function updateSettings(payload) {
  const fields = [
    'sitename',
    'site_title',
    'site_url',
    'track_prefix',
    'track_num',
    'invoice_terms',
    'allow_print',
    'show_map',
    'email_name',
    'email_address',
    'mail_track_update',
    'mail_track_save',
  ]

  if (useFileStore()) {
    const store = readStore()
    for (const key of fields) {
      if (payload[key] !== undefined) store.settings[key] = payload[key]
    }
    if (payload.cohorts !== undefined) store.settings.cohorts = normalizeList(payload.cohorts)
    if (payload.award_dates !== undefined) {
      store.settings.award_dates = normalizeList(payload.award_dates)
    }
    writeStore(store)
    return unpackSettingsRow(store.settings)
  }

  const current = (await getSettings()) || {}
  const next = {
    ...current,
    ...payload,
    cohorts:
      payload.cohorts !== undefined ? normalizeList(payload.cohorts) : current.cohorts || [],
    award_dates:
      payload.award_dates !== undefined
        ? normalizeList(payload.award_dates)
        : current.award_dates || [],
  }

  await query(
    `UPDATE settings SET
      sitename = $1,
      site_title = $2,
      site_url = $3,
      track_prefix = $4,
      track_num = $5,
      invoice_terms = $6,
      allow_print = $7,
      show_map = $8,
      email_name = $9,
      email_address = $10,
      mail_track_update = $11,
      mail_track_save = $12,
      cohorts = $13::jsonb,
      award_dates = $14::jsonb,
      updated_at = NOW()
     WHERE id = 1`,
    [
      next.sitename,
      next.site_title,
      next.site_url,
      next.track_prefix,
      next.track_num,
      next.invoice_terms || 'terms',
      next.allow_print || 'Yes',
      next.show_map || 'Yes',
      next.email_name,
      next.email_address,
      next.mail_track_update || 'No',
      next.mail_track_save || 'Yes',
      JSON.stringify(next.cohorts || []),
      JSON.stringify(next.award_dates || []),
    ]
  )

  return getSettings()
}

export async function generateCertificateId() {
  const settings = await getSettings()
  const prefix = String(settings?.track_prefix || 'N251').trim() || 'N251'
  const digits = Math.min(12, Math.max(4, Number(settings?.track_num || 6) || 6))
  const month = String(new Date().getMonth() + 1).padStart(2, '0')

  for (let attempt = 0; attempt < 40; attempt += 1) {
    let num = ''
    for (let i = 0; i < digits; i += 1) num += Math.floor(Math.random() * 10)
    const certificateId = `${prefix}-${month}-${num}`
    const existing = await getCertificateByNumber(certificateId)
    if (!existing) return certificateId
  }

  throw new Error('Could not generate a unique certificate ID')
}

export async function listCertificates({ q = '', limit = 100, offset = 0 } = {}) {
  if (useFileStore()) {
    const store = readStore()
    let rows = [...store.tracking].sort((a, b) => b.id - a.id)
    if (q) {
      const needle = q.toLowerCase()
      rows = rows.filter((row) =>
        [row.tracking_number, row.receiver_name, row.receiver_email, row.status]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      )
    }
    const total = rows.length
    return {
      total,
      items: rows.slice(offset, offset + limit).map(rowToCertificate),
    }
  }

  const params = []
  let where = ''
  if (q) {
    where = `WHERE tracking_number ILIKE $1
      OR receiver_name ILIKE $1
      OR receiver_email ILIKE $1
      OR status ILIKE $1`
    params.push(`%${q}%`)
  }

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM tracking ${where}`,
    params
  )

  const limitIdx = params.length + 1
  const offsetIdx = params.length + 2
  const listResult = await query(
    `SELECT * FROM tracking ${where}
     ORDER BY id DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...params, Number(limit), Number(offset)]
  )

  return {
    total: countResult.rows[0].total,
    items: listResult.rows.map(rowToCertificate),
  }
}

export async function getCertificateById(id) {
  if (useFileStore()) {
    const store = readStore()
    return rowToCertificate(store.tracking.find((row) => row.id === Number(id)))
  }

  const { rows } = await query('SELECT * FROM tracking WHERE id = $1 LIMIT 1', [id])
  return rowToCertificate(rows[0])
}

export async function getCertificateByNumber(certificateId) {
  const normalized = String(certificateId || '').trim()
  if (!normalized) return null

  if (useFileStore()) {
    const store = readStore()
    const row = store.tracking.find(
      (item) => item.tracking_number.toUpperCase() === normalized.toUpperCase()
    )
    return rowToCertificate(row)
  }

  const { rows } = await query(
    'SELECT * FROM tracking WHERE lower(tracking_number) = lower($1) LIMIT 1',
    [normalized]
  )
  return rowToCertificate(rows[0])
}

export async function createCertificate(payload) {
  const row = certificateToRow(payload)

  if (useFileStore()) {
    const store = readStore()
    const id = store.nextIds.tracking++
    const record = {
      ...row,
      id,
      date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    store.tracking.push(record)
    writeStore(store)
    return rowToCertificate(record)
  }

  const { rows } = await query(
    `INSERT INTO tracking (
      tracking_number, status, receiver_email, receiver_name, receiver_contact,
      dispatch_date, pdesc, current_location, image
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id`,
    [
      row.tracking_number,
      row.status,
      row.receiver_email,
      row.receiver_name,
      row.receiver_contact,
      row.dispatch_date,
      row.pdesc,
      row.current_location || null,
      row.image,
    ]
  )

  return getCertificateById(rows[0].id)
}

export async function updateCertificate(id, payload) {
  const row = certificateToRow(payload, { forUpdate: true })

  if (useFileStore()) {
    const store = readStore()
    const index = store.tracking.findIndex((item) => item.id === Number(id))
    if (index === -1) return null
    store.tracking[index] = {
      ...store.tracking[index],
      ...row,
    }
    writeStore(store)
    return rowToCertificate(store.tracking[index])
  }

  const result = await query(
    `UPDATE tracking SET
      tracking_number = $1,
      status = $2,
      receiver_email = $3,
      receiver_name = $4,
      receiver_contact = $5,
      dispatch_date = $6,
      pdesc = $7,
      current_location = $8,
      image = $9
     WHERE id = $10`,
    [
      row.tracking_number,
      row.status,
      row.receiver_email,
      row.receiver_name,
      row.receiver_contact,
      row.dispatch_date,
      row.pdesc,
      row.current_location || null,
      row.image,
      id,
    ]
  )

  if (result.rowCount === 0) return null
  return getCertificateById(id)
}

export async function deleteCertificate(id) {
  if (useFileStore()) {
    const store = readStore()
    const before = store.tracking.length
    store.tracking = store.tracking.filter((item) => item.id !== Number(id))
    writeStore(store)
    return store.tracking.length < before
  }

  const result = await query('DELETE FROM tracking WHERE id = $1', [id])
  return result.rowCount > 0
}

export async function getDashboardStats() {
  const { items, total } = await listCertificates({ limit: 5, offset: 0 })
  const settings = await getSettings()

  let classCount = 0
  let recentAwarded = 0

  if (useFileStore()) {
    const store = readStore()
    classCount = new Set(store.tracking.map((r) => r.status).filter(Boolean)).size
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    recentAwarded = store.tracking.filter((r) => {
      const t = Date.parse(r.dispatch_date)
      return !Number.isNaN(t) && t >= monthAgo
    }).length
  } else {
    const classResult = await query(
      `SELECT COUNT(DISTINCT status)::int AS c
       FROM tracking
       WHERE status IS NOT NULL AND status <> ''`
    )
    classCount = classResult.rows[0].c

    const recentResult = await query(
      `SELECT COUNT(*)::int AS c
       FROM tracking
       WHERE dispatch_date ~ '^\\d{4}-\\d{2}-\\d{2}'
         AND dispatch_date::date >= (CURRENT_DATE - INTERVAL '30 days')`
    )
    recentAwarded = recentResult.rows[0].c
  }

  return {
    totalCertificates: total,
    classCount,
    recentAwarded,
    allowPrint: settings?.allow_print === 'Yes',
    recent: items,
    dbMode: getDbMode(),
  }
}
