const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { logAudit } = require('../services/auditService')

const router = express.Router()
const prisma = new PrismaClient()

// ─── POST /auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    )

    await logAudit({
      userId: user.id,
      type: 'LOGIN',
      description: `User ${user.name} (${user.role}) logged in`,
      status: 'INFO'
    })

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ error: 'Authentication service unavailable' })
  }
})

// ─── GET /auth/me ────────────────────────────────────────
router.get('/me', async (req, res) => {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'No token' })
  try {
    const user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    res.json(user)
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

module.exports = router