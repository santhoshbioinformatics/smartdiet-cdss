const express = require('express')
const { requireAuth } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

router.post('/snooze', requireAuth, async (req, res) => {
  const { alertId, reason, minutes } = req.body
  const snoozedUntil = new Date(Date.now() + minutes * 60000)
  const snooze = await prisma.alertSnooze.create({
    data: { alertId, userId: req.user.id, reason, snoozedUntil }
  })
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      type: 'ALERT_SNOOZED',
      description: `Alert ${alertId} snoozed for ${minutes} min. Reason: ${reason}`,
      status: 'INFO'
    }
  })
  res.json(snooze)
})

router.get('/snoozed', requireAuth, async (req, res) => {
  const now = new Date()
  const active = await prisma.alertSnooze.findMany({
    where: { userId: req.user.id, snoozedUntil: { gt: now } }
  })
  res.json(active.map(s => s.alertId))
})

module.exports = router