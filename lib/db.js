import mysql from 'mysql2/promise'
import { readStore, writeStore, useFileStore } from './store.js'
import { rowToCertificate, certificateToRow } from './mapCertificate.js'
import { normalizeList, packSettingsExtras, unpackSettingsRow } from './settingsExtras.js'

let pool = null

function hasMysqlConfig() {
  return Boolean(process.env.DATABASE_URL || process.env.DB_HOST)
}

export function getDbMode() {
  return hasMysqlConfig() ? 'mysql' : 'file'
}

async function getPool() {
  if (!hasMysqlConfig()) return null
  if (pool) return pool

  if (process.env.DATABASE_URL) {
    pool = mysql.createPool(process.env.DATABASE_URL)
  } else {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
      namedPlaceholders: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
  }

  return pool
}

export async function findAdminByUsername(username) {
  if (useFileStore()) {
    const store = readStore()
    return store.admin.find((a) => a.username === username) || null
  }

  const db = await getPool()
  const [rows] = await db.execute(
    'SELECT id, username, password FROM admin WHERE username = ? LIMIT 1',
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

  const db = await getPool()
  await db.execute('UPDATE admin SET password = ? WHERE id = ?', [hashedPassword, id])
}

export async function getSettings() {
  if (useFileStore()) {
    return unpackSettingsRow(readStore().settings)
  }

  const db = await getPool()
  const [rows] = await db.execute('SELECT * FROM settings WHERE id = 1 LIMIT 1')
  return unpackSettingsRow(rows[0] || null)
}

export async function updateSettings(payload) {
  const fields = [
    'sitename',
    'site_title',
    'site_url',
    'track_prefix',
    'track_num',
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
    if (payload.invoice_terms !== undefined) store.settings.invoice_terms = payload.invoice_terms
    if (payload.cohorts !== undefined) store.settings.cohorts = normalizeList(payload.cohorts)
    if (payload.award_dates !== undefined) {
      store.settings.award_dates = normalizeList(payload.award_dates)
    }
    writeStore(store)
    return unpackSettingsRow(store.settings)
  }

  const db = await getPool()
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

  const sets = []
  const values = []
  for (const key of fields) {
    if (payload[key] !== undefined || key in current) {
      sets.push(`${key} = ?`)
      values.push(next[key])
    }
  }
  sets.push('invoice_terms = ?')
  values.push(packSettingsExtras(next))
  values.push(1)
  await db.execute(`UPDATE settings SET ${sets.join(', ')} WHERE id = ?`, values)
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

  const db = await getPool()
  const params = []
  let where = ''
  if (q) {
    where =
      'WHERE tracking_number LIKE ? OR receiver_name LIKE ? OR receiver_email LIKE ? OR status LIKE ?'
    const like = `%${q}%`
    params.push(like, like, like, like)
  }

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM tracking ${where}`,
    params
  )
  const [rows] = await db.execute(
    `SELECT * FROM tracking ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  )

  return {
    total: countRows[0].total,
    items: rows.map(rowToCertificate),
  }
}

export async function getCertificateById(id) {
  if (useFileStore()) {
    const store = readStore()
    return rowToCertificate(store.tracking.find((row) => row.id === Number(id)))
  }

  const db = await getPool()
  const [rows] = await db.execute('SELECT * FROM tracking WHERE id = ? LIMIT 1', [id])
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

  const db = await getPool()
  const [rows] = await db.execute(
    'SELECT * FROM tracking WHERE tracking_number = ? LIMIT 1',
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

  const db = await getPool()
  const [result] = await db.execute(
    `INSERT INTO tracking (
      tracking_number, sender_name, sender_contact, sender_email, sender_address,
      status, dispatch_location, receiver_email, receiver_name, receiver_contact,
      receiver_address, dispatch_date, delivery_date, pdesc, destination,
      current_location, carrier, carrier_ref, ship_mode, weight, quantity,
      payment_mode, image, delivery_time
    ) VALUES (?, '', '', '', '', ?, '', ?, ?, ?, '', ?, '', ?, '', ?, '', '', '', '', '', '', ?, '')`,
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

  return getCertificateById(result.insertId)
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

  const db = await getPool()
  const [result] = await db.execute(
    `UPDATE tracking SET
      tracking_number = ?, status = ?, receiver_email = ?, receiver_name = ?,
      receiver_contact = ?, dispatch_date = ?, pdesc = ?, current_location = ?, image = ?
     WHERE id = ?`,
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

  if (result.affectedRows === 0) return null
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

  const db = await getPool()
  const [result] = await db.execute('DELETE FROM tracking WHERE id = ?', [id])
  return result.affectedRows > 0
}

export async function getDashboardStats() {
  const { items, total } = await listCertificates({ limit: 5, offset: 0 })
  const settings = await getSettings()

  const classes = new Set(items.map((item) => item.className).filter(Boolean))
  // For accurate class count when using MySQL, recount all
  let classCount = classes.size
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
    const db = await getPool()
    const [classRows] = await db.execute(
      'SELECT COUNT(DISTINCT status) AS c FROM tracking WHERE status IS NOT NULL AND status != \'\''
    )
    classCount = classRows[0].c
    const [recentRows] = await db.execute(
      'SELECT COUNT(*) AS c FROM tracking WHERE dispatch_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    )
    recentAwarded = recentRows[0].c
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
