const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Centralized audit logging service for HIPAA-compliant tracking.
 * Every PHI access or mutation MUST be logged through this service.
 */
async function logAudit({
  userId,
  type,
  description,
  status = 'INFO',
  patientMrn = null,
  entityType = null,
  entityId = null,
  beforeValue = null,
  afterValue = null
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        user: { connect: { id: userId } },
        type,
        description,
        status,
        patientMrn,
        entityType,
        entityId,
        beforeValue: beforeValue ? JSON.parse(JSON.stringify(beforeValue)) : null,
        afterValue: afterValue ? JSON.parse(JSON.stringify(afterValue)) : null
      }
    })
  } catch (err) {
    // Audit logging failures must never crash the application,
    // but must be captured for ops review
    console.error('[AUDIT_FAILURE]', {
      type,
      userId,
      error: err.message,
      timestamp: new Date().toISOString()
    })
    return null
  }
}

module.exports = { logAudit }
