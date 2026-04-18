const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole } = require('../middleware/auth')
const { logAudit } = require('../services/auditService')
const { COMMON_SUBSTANCES, COMMON_REACTIONS } = require('../services/allergyService')

const router = express.Router()
const prisma = new PrismaClient()

// ─── GET /patients/:patientId/allergies ─────────────────
// Returns all allergies for a patient (active by default)
router.get('/patients/:patientId/allergies', requireAuth, async (req, res) => {
  try {
    const { patientId } = req.params
    const { includeInactive } = req.query

    const where = { patientId }
    if (!includeInactive) {
      where.status = 'ACTIVE'
    }

    const allergies = await prisma.allergy.findMany({
      where,
      include: {
        recordedBy: { select: { name: true, role: true } }
      },
      orderBy: [
        { severity: 'desc' },
        { recordedAt: 'desc' }
      ]
    })

    res.json(allergies)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch allergies', detail: err.message })
  }
})

// ─── POST /patients/:patientId/allergies ────────────────
// Add a new allergy (MD, RD, RN only)
router.post('/patients/:patientId/allergies', requireAuth, requireRole('MD', 'RD', 'RN', 'Admin'), async (req, res) => {
  try {
    const { patientId } = req.params
    const { substance, reaction, severity, source, category, notes, clinicalStatus, verificationStatus, code } = req.body

    if (!substance || !substance.trim()) {
      return res.status(400).json({ error: 'Substance is required' })
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    // Check for duplicate active allergy
    const existing = await prisma.allergy.findFirst({
      where: {
        patientId,
        substance: { equals: substance.trim(), mode: 'insensitive' },
        status: 'ACTIVE'
      }
    })
    if (existing) {
      return res.status(409).json({ error: 'Active allergy for this substance already exists', existingId: existing.id })
    }

    const allergy = await prisma.allergy.create({
      data: {
        patientId,
        substance: substance.trim(),
        reaction: reaction || null,
        severity: severity || 'MODERATE',
        status: 'ACTIVE',
        source: source || 'PROVIDER_ENTERED',
        category: category || 'FOOD',
        notes: notes || null,
        clinicalStatus: clinicalStatus || 'active',
        verificationStatus: verificationStatus || 'confirmed',
        code: code || null,
        recordedById: req.user.id
      },
      include: {
        recordedBy: { select: { name: true, role: true } }
      }
    })

    // Audit log
    await logAudit({
      userId: req.user.id,
      type: 'ALLERGY_ADDED',
      description: `Added allergy: ${substance} (${severity || 'MODERATE'}) for patient ${patient.mrn}`,
      status: 'INFO',
      patientMrn: patient.mrn,
      entityType: 'Allergy',
      entityId: allergy.id,
      afterValue: allergy
    })

    res.status(201).json(allergy)
  } catch (err) {
    res.status(500).json({ error: 'Failed to add allergy', detail: err.message })
  }
})

// ─── PUT /allergies/:id ─────────────────────────────────
// Update an existing allergy (MD, RD, RN only)
router.put('/:id', requireAuth, requireRole('MD', 'RD', 'RN', 'Admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { substance, reaction, severity, status, source, category, notes, clinicalStatus, verificationStatus, code } = req.body

    const existing = await prisma.allergy.findUnique({
      where: { id },
      include: { patient: { select: { mrn: true } } }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Allergy not found' })
    }

    const beforeValue = { ...existing }

    const updated = await prisma.allergy.update({
      where: { id },
      data: {
        ...(substance && { substance: substance.trim() }),
        ...(reaction !== undefined && { reaction }),
        ...(severity && { severity }),
        ...(status && { status }),
        ...(source && { source }),
        ...(category && { category }),
        ...(notes !== undefined && { notes }),
        ...(clinicalStatus && { clinicalStatus }),
        ...(verificationStatus && { verificationStatus }),
        ...(code !== undefined && { code })
      },
      include: {
        recordedBy: { select: { name: true, role: true } }
      }
    })

    await logAudit({
      userId: req.user.id,
      type: 'ALLERGY_MODIFIED',
      description: `Modified allergy: ${updated.substance} for patient ${existing.patient.mrn}`,
      status: 'WARNING',
      patientMrn: existing.patient.mrn,
      entityType: 'Allergy',
      entityId: id,
      beforeValue,
      afterValue: updated
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update allergy', detail: err.message })
  }
})

// ─── DELETE /allergies/:id ──────────────────────────────
// Soft-delete (deactivate) an allergy (MD, RD only)
router.delete('/:id', requireAuth, requireRole('MD', 'RD', 'Admin'), async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.allergy.findUnique({
      where: { id },
      include: { patient: { select: { mrn: true } } }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Allergy not found' })
    }

    const updated = await prisma.allergy.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        clinicalStatus: 'inactive'
      }
    })

    await logAudit({
      userId: req.user.id,
      type: 'ALLERGY_DEACTIVATED',
      description: `Deactivated allergy: ${existing.substance} for patient ${existing.patient.mrn}`,
      status: 'WARNING',
      patientMrn: existing.patient.mrn,
      entityType: 'Allergy',
      entityId: id,
      beforeValue: existing,
      afterValue: updated
    })

    res.json({ message: 'Allergy deactivated', id })
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate allergy', detail: err.message })
  }
})

// ─── GET /allergies/substances ──────────────────────────
// Returns autocomplete suggestions for substance names
router.get('/substances', requireAuth, (req, res) => {
  res.json({ substances: COMMON_SUBSTANCES, reactions: COMMON_REACTIONS })
})

module.exports = router
