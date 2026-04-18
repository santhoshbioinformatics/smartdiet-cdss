const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const patientRoutes = require('./routes/patients')
const rulesRoutes = require('./routes/rules')
const ordersRoutes = require('./routes/orders')
const auditRoutes = require('./routes/audit')
const alertRoutes = require('./routes/alerts')
const allergyRoutes = require('./routes/allergies')

const app = express()

// ─── Security ───────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))

// ─── Rate Limiting ──────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// ─── Routes ─────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/rules', rulesRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/allergies', allergyRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '3.0.0' }))

// Default route handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

// ─── Error handling ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`✓ SmartDiet CDSS v3.0 running on port ${PORT}`)
  console.log(`✓ Auth: DB-only (run npm run db:seed for demo accounts)`)
})