const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole } = require('../middleware/auth')
const { logAudit } = require('../services/auditService')
const { detectConflicts, buildRecommendation } = require('../services/rulesEngine')
const { mapAllergiesToRestrictions } = require('../services/allergyService')

const router = express.Router()
const prisma = new PrismaClient()

// ─── POST /orders ───────────────────────────────────────
// Place a diet order
router.post('/', requireAuth, async (req, res) => {
  try {
    const { patientId, mrn, diet, overridden, overrideReason, alertsOverridden } = req.body

    // Resolve patient by ID or MRN
    const patient = await prisma.patient.findFirst({
      where: { OR: [
        ...(patientId ? [{ id: patientId }] : []),
        ...(mrn ? [{ mrn }] : [])
      ]},
      include: {
        allergies: { where: { status: 'ACTIVE' } }
      }
    })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    // Check for conflicts before placing order
    const allergyRestrictions = mapAllergiesToRestrictions(patient.allergies)
    const allRestrictions = [...new Set([...patient.restrictions, ...allergyRestrictions])]
    const conflicts = detectConflicts({ ...patient, restrictions: allRestrictions }, diet)

    // If conflicts exist and override not explicitly acknowledged, block
    if (conflicts.length > 0 && !overridden) {
      return res.status(422).json({
        error: 'Diet order conflicts detected',
        conflicts,
        message: 'Override required to place this order. Provide overrideReason.'
      })
    }

    // Override permission check: only MD/RD can override
    if (overridden && !['MD', 'RD', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only MD or RD can override diet safety alerts' })
    }

    const order = await prisma.dietOrder.create({
      data: {
        patientId: patient.id,
        userId: req.user.id,
        dietType: diet,
        status: 'active',
        confidence: String(buildRecommendation(patient).confidence),
        overridden: overridden || false,
        overrideReason: overrideReason || null,
        alertsOverridden: alertsOverridden || [],
        alertsAtTimeOfOrder: conflicts.length > 0 ? conflicts : undefined
      },
      include: {
        user: { select: { name: true, role: true } },
        patient: { select: { name: true, mrn: true } }
      }
    })

    const auditType = overridden ? 'DIET_ORDER_OVERRIDE' : 'DIET_ORDER_PLACED'
    const auditStatus = overridden ? 'WARNING' : 'INFO'

    await logAudit({
      userId: req.user.id,
      type: auditType,
      description: `${overridden ? 'OVERRIDE: ' : ''}Diet order placed: ${diet} for ${patient.name} (${patient.mrn})${overrideReason ? ' — Reason: ' + overrideReason : ''}`,
      status: auditStatus,
      patientMrn: patient.mrn,
      entityType: 'DietOrder',
      entityId: order.id,
      afterValue: order
    })

    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: 'Failed to place order', detail: err.message })
  }
})

// ─── GET /orders/patient/:id ─────────────────────────────
router.get('/patient/:id', requireAuth, async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { OR: [{ id: req.params.id }, { mrn: req.params.id }] }
    })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const orders = await prisma.dietOrder.findMany({
      where: { patientId: patient.id },
      include: {
        user: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders', detail: err.message })
  }
})

module.exports = router