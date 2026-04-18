const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { requireAuth } = require('../middleware/auth')
const { logAudit } = require('../services/auditService')

const router = express.Router()
const prisma = new PrismaClient()

// ─── GET /patients ──────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        allergies: {
          where: { status: 'ACTIVE' },
          select: { id: true, substance: true, severity: true, status: true }
        },
        _count: { select: { orders: true } }
      },
      orderBy: { name: 'asc' }
    })

    await logAudit({
      userId: req.user.id,
      type: 'PATIENT_LIST_VIEWED',
      description: `Viewed patient list (${patients.length} patients)`,
      status: 'INFO'
    })

    res.json(patients)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients', detail: err.message })
  }
})

// ─── GET /patients/:id ─────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    // Support lookup by ID or MRN
    const { id } = req.params
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { id },
          { mrn: id }
        ]
      },
      include: {
        allergies: {
          include: {
            recordedBy: { select: { name: true, role: true } }
          },
          orderBy: [{ severity: 'desc' }, { recordedAt: 'desc' }]
        },
        orders: {
          include: {
            user: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    await logAudit({
      userId: req.user.id,
      type: 'PATIENT_ACCESSED',
      description: `Accessed patient record: ${patient.name} (${patient.mrn})`,
      status: 'INFO',
      patientMrn: patient.mrn,
      entityType: 'Patient',
      entityId: patient.id
    })

    res.json(patient)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient', detail: err.message })
  }
})

// ─── PUT /patients/:id/conditions ───────────────────────
router.put('/:id/conditions', requireAuth, async (req, res) => {
  try {
    const { conditions } = req.body
    const patient = await prisma.patient.findFirst({
      where: { OR: [{ id: req.params.id }, { mrn: req.params.id }] }
    })
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const beforeValue = { conditions: patient.conditions }

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: { conditions }
    })

    await logAudit({
      userId: req.user.id,
      type: 'CONDITIONS_UPDATED',
      description: `Updated conditions for patient ${patient.mrn}`,
      status: 'WARNING',
      patientMrn: patient.mrn,
      entityType: 'Patient',
      entityId: patient.id,
      beforeValue,
      afterValue: { conditions: updated.conditions }
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update conditions', detail: err.message })
  }
})

// ─── POST /patients ─────────────────────────────────────
// Create a new patient
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, mrn, age, sex, weight, height, bmi, unit, attending, admitted, conditions, restrictions } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Patient name is required' })
    }

    // Auto-generate MRN if not provided
    const finalMrn = mrn || `${String(Math.floor(Math.random() * 99)).padStart(2, '0')}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`

    // Check for duplicate MRN
    const existing = await prisma.patient.findUnique({ where: { mrn: finalMrn } })
    if (existing) {
      return res.status(409).json({ error: 'A patient with this MRN already exists' })
    }

    const patient = await prisma.patient.create({
      data: {
        name: name.trim(),
        mrn: finalMrn,
        age: parseInt(age) || 0,
        sex: sex || 'Unknown',
        weight: weight || 'N/A',
        height: height || 'N/A',
        bmi: bmi || 'N/A',
        unit: unit || 'Unassigned',
        attending: attending || 'Unassigned',
        admitted: admitted || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        conditions: conditions || [],
        restrictions: restrictions || []
      },
      include: {
        allergies: true,
        _count: { select: { orders: true } }
      }
    })

    await logAudit({
      userId: req.user.id,
      type: 'PATIENT_CREATED',
      description: `Created patient: ${patient.name} (${patient.mrn})`,
      status: 'INFO',
      patientMrn: patient.mrn,
      entityType: 'Patient',
      entityId: patient.id,
      afterValue: patient
    })

    res.status(201).json(patient)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create patient', detail: err.message })
  }
})

module.exports = router