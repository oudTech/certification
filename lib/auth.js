import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { findAdminByUsername, updateAdminPassword } from './db.js'

const TOKEN_TTL = '12h'

function getJwtSecret() {
  return process.env.JWT_SECRET || 'oudtech-cert-dev-secret-change-me'
}

export async function authenticateAdmin(username, password) {
  const admin = await findAdminByUsername(String(username || '').trim())
  if (!admin) return null

  const stored = String(admin.password || '')
  let valid = false

  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    valid = await bcrypt.compare(password, stored)
  } else {
    // Legacy plaintext from the SQL dump — upgrade on successful login
    valid = stored === password
    if (valid) {
      const hashed = await bcrypt.hash(password, 10)
      await updateAdminPassword(admin.id, hashed)
    }
  }

  if (!valid) return null

  const token = jwt.sign(
    { sub: admin.id, username: admin.username, role: 'admin' },
    getJwtSecret(),
    { expiresIn: TOKEN_TTL }
  )

  return {
    token,
    admin: { id: admin.id, username: admin.username },
  }
}

export function verifyToken(token) {
  if (!token) return null
  try {
    return jwt.verify(token, getJwtSecret())
  } catch {
    return null
  }
}

export function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization
  if (!header) return null
  const [scheme, value] = String(header).split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !value) return null
  return value
}

export function requireAdmin(req, res, next) {
  const payload = verifyToken(getBearerToken(req))
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  req.admin = payload
  return next()
}
