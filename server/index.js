import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { existsSync, mkdirSync } from 'fs'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  authenticateAdmin,
  getBearerToken,
  requireAdmin,
  verifyToken,
} from '../lib/auth.js'
import {
  createCertificate,
  deleteCertificate,
  generateCertificateId,
  getCertificateById,
  getCertificateByNumber,
  getDashboardStats,
  getDbMode,
  getSettings,
  listCertificates,
  updateCertificate,
  updateSettings,
} from '../lib/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadDir = join(__dirname, '..', 'public', 'certificates')
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')
    cb(null, `${Date.now()}-${safe}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(png|jpe?g|webp|gif)$/i.test(extname(file.originalname))
    cb(ok ? null : new Error('Only image uploads are allowed'), ok)
  },
})

function createRouter() {
  const router = express.Router()

  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      dbMode: getDbMode(),
      env: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        hasSupabaseDbUrl: Boolean(process.env.SUPABASE_DB_URL),
        hasDbHost: Boolean(process.env.DB_HOST),
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
        vercelEnv: process.env.VERCEL_ENV || null,
      },
    })
  })

  router.post('/auth/login', async (req, res) => {
    try {
      const { username, password, email } = req.body || {}
      const loginId = username || email
      if (!loginId || !password) {
        return res.status(400).json({ error: 'Username and password are required.' })
      }
      const result = await authenticateAdmin(loginId, password)
      if (!result) return res.status(401).json({ error: 'Invalid credentials.' })
      return res.json(result)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Login failed.' })
    }
  })

  router.get('/auth/me', (req, res) => {
    const payload = verifyToken(getBearerToken(req))
    if (!payload) return res.status(401).json({ error: 'Unauthorized' })
    return res.json({ admin: { id: payload.sub, username: payload.username } })
  })

  router.get('/certificates/lookup/:certificateId', async (req, res) => {
    try {
      const cert = await getCertificateByNumber(req.params.certificateId)
      if (!cert) return res.status(404).json({ error: 'Not found' })
      return res.json(cert)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Lookup failed.' })
    }
  })

  router.get('/certificates/next-id', requireAdmin, async (_req, res) => {
    try {
      const certificateId = await generateCertificateId()
      return res.json({ certificateId })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: error.message || 'Could not generate ID.' })
    }
  })

  router.get('/certificates', requireAdmin, async (req, res) => {
    try {
      const q = String(req.query.q || '')
      const limit = Number(req.query.limit || 100)
      const offset = Number(req.query.offset || 0)
      const data = await listCertificates({ q, limit, offset })
      return res.json(data)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not load certificates.' })
    }
  })

  router.get('/certificates/:id', requireAdmin, async (req, res) => {
    try {
      const cert = await getCertificateById(req.params.id)
      if (!cert) return res.status(404).json({ error: 'Not found' })
      return res.json(cert)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not load certificate.' })
    }
  })

  router.post('/certificates', requireAdmin, async (req, res) => {
    try {
      const payload = req.body || {}
      if (!payload.certificateId || !payload.studentName) {
        return res.status(400).json({ error: 'Certificate ID and student name are required.' })
      }
      const existing = await getCertificateByNumber(payload.certificateId)
      if (existing) {
        return res.status(409).json({ error: 'A certificate with this ID already exists.' })
      }
      const created = await createCertificate(payload)
      return res.status(201).json(created)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not create certificate.' })
    }
  })

  router.put('/certificates/:id', requireAdmin, async (req, res) => {
    try {
      const updated = await updateCertificate(req.params.id, req.body || {})
      if (!updated) return res.status(404).json({ error: 'Not found' })
      return res.json(updated)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not update certificate.' })
    }
  })

  router.delete('/certificates/:id', requireAdmin, async (req, res) => {
    try {
      const ok = await deleteCertificate(req.params.id)
      if (!ok) return res.status(404).json({ error: 'Not found' })
      return res.json({ ok: true })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not delete certificate.' })
    }
  })

  router.get('/dashboard', requireAdmin, async (_req, res) => {
    try {
      const stats = await getDashboardStats()
      return res.json(stats)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not load dashboard.' })
    }
  })

  router.get('/settings', requireAdmin, async (_req, res) => {
    try {
      const settings = await getSettings()
      return res.json(settings)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not load settings.' })
    }
  })

  router.put('/settings', requireAdmin, async (req, res) => {
    try {
      const settings = await updateSettings(req.body || {})
      return res.json(settings)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not update settings.' })
    }
  })

  router.post('/upload', requireAdmin, (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message })
      if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })
      return res.json({
        filename: req.file.filename,
        url: `/certificates/${req.file.filename}`,
      })
    })
  })

  return router
}

export function createApp() {
  const app = express()
  const api = createRouter()

  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  // Serve uploaded / seeded certificate images (must be before API routes)
  app.use('/certificates', express.static(uploadDir, {
    fallthrough: true,
    maxAge: '1h',
  }))

  // All API routes live under /api — never mount at root or /certificates/:id
  // will intercept image requests and return 401.
  app.use('/api', api)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: 'Server error.' })
  })

  return app
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (isDirectRun) {
  const port = Number(process.env.PORT || 3001)
  const app = createApp()
  app.listen(port, () => {
    console.log(`OudTech cert API listening on http://localhost:${port} (${getDbMode()} store)`)
  })
}
