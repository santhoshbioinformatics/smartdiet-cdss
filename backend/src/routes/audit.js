const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// ─── GET /audit ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { patientMrn, entityType, limit } = req.query

    const where = {}
    if (patientMrn) where.patientMrn = patientMrn
    if (entityType) where.entityType = entityType

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) || 100
    })

    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs', detail: err.message })
  }
})

// ─── POST /audit ────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, description, status, patientMrn, entityType, entityId, beforeValue, afterValue } = req.body

    const log = await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        type,
        description,
        status: status || 'INFO',
        patientMrn,
        entityType,
        entityId,
        beforeValue: beforeValue || undefined,
        afterValue: afterValue || undefined
      }
    })

    res.json(log)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create audit log', detail: err.message })
  }
})

module.exports = router