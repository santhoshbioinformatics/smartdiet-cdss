const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { requireAuth } = require('../middleware/auth')
const { buildRecommendation, detectConflicts } = require('../services/rulesEngine')
const { mapAllergiesToRestrictions } = require('../services/allergyService')

const router = express.Router()
const prisma = new PrismaClient()

// ─── POST /rules/recommend ──────────────────────────────
// Returns real CDS recommendations based on patient data + allergies
router.post('/recommend', requireAuth, async (req, res) => {
  try {
    const { mrn, patientId } = req.body

    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          ...(patientId ? [{ id: patientId }] : []),
          ...(mrn ? [{ mrn }] : [])
        ]
      },
      include: {
        allergies: true
      }
    })

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const recommendation = buildRecommendation(patient)
    res.json(recommendation)
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate recommendations', detail: err.message })
  }
})

// ─── POST /rules/conflicts ─────────────────────────────
// Check for conflicts between a proposed diet and patient profile
router.post('/conflicts', requireAuth, async (req, res) => {
  try {
    const { mrn, patientId, diet } = req.body

    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          ...(patientId ? [{ id: patientId }] : []),
          ...(mrn ? [{ mrn }] : [])
        ]
      },
      include: {
        allergies: { where: { status: 'ACTIVE' } }
      }
    })

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    // Merge allergy-derived restrictions
    const allergyRestrictions = mapAllergiesToRestrictions(patient.allergies)
    const allRestrictions = [...new Set([...patient.restrictions, ...allergyRestrictions])]
    const enrichedPatient = { ...patient, restrictions: allRestrictions }

    const detectedConflicts = detectConflicts(enrichedPatient, diet)

    res.json({
      detectedConflicts,
      allergyDerivedRestrictions: allergyRestrictions,
      totalRestrictions: allRestrictions
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to check conflicts', detail: err.message })
  }
})

module.exports = router