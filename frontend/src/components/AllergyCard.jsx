import useAuthStore from '../store/authStore'

const SEV_CLS = { SEVERE: 'sev-severe', MODERATE: 'sev-moderate', MILD: 'sev-mild' }
const SEV_BADGE = { SEVERE: 'badge-severe', MODERATE: 'badge-moderate', MILD: 'badge-mild' }
const SRC = { PATIENT_REPORTED: 'Patient', PROVIDER_ENTERED: 'Provider', IMPORTED: 'Import' }

export default function AllergyCard({ allergy, onEdit, onDeactivate, compact }) {
  const { user } = useAuthStore()
  const canEdit = ['MD', 'RD', 'RN', 'Admin'].includes(user?.role)
  const canDeactivate = ['MD', 'RD', 'Admin'].includes(user?.role)

  if (compact) {
    return (
      <div className={`flex items-center gap-2 py-2 px-3 rounded-lg border border-[var(--n-200)] bg-white ${allergy.severity === 'SEVERE' ? 'border-l-[3px] border-l-[var(--crit)]' : allergy.severity === 'MODERATE' ? 'border-l-[3px] border-l-[var(--mod)]' : 'border-l-[3px] border-l-[var(--mild)]'}`}>
        <span className="text-sm font-semibold text-[var(--n-800)] flex-1">{allergy.substance}</span>
        <span className={`badge ${SEV_BADGE[allergy.severity]}`}>{allergy.severity}</span>
      </div>
    )
  }

  return (
    <div className={`allergy-card ${SEV_CLS[allergy.severity] || ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--n-800)] text-[15px]">{allergy.substance}</span>
            <span className={`badge ${SEV_BADGE[allergy.severity]}`}>{allergy.severity}</span>
            {allergy.status === 'INACTIVE' && <span className="badge badge-neutral">Inactive</span>}
          </div>

          {/* Reaction */}
          {allergy.reaction && (
            <p className="text-sm text-[var(--n-600)] mt-1.5">
              <span className="text-[var(--n-400)] text-xs font-medium">Reaction:</span>{' '}
              {allergy.reaction}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2.5 text-xs text-[var(--n-400)]">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Z"/></svg>
              {allergy.recordedBy?.name || 'System'}
            </span>
            <span>{new Date(allergy.recordedAt).toLocaleDateString()}</span>
            <span className="badge badge-neutral" style={{ padding: '1px 6px', fontSize: '10px' }}>{SRC[allergy.source] || allergy.source}</span>
          </div>

          {/* Notes */}
          {allergy.notes && (
            <div className="mt-3 text-xs text-[var(--n-500)] bg-[var(--n-50)] rounded-lg px-3 py-2 border border-[var(--n-100)]">
              {allergy.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        {allergy.status === 'ACTIVE' && (
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {canEdit && (
              <button onClick={() => onEdit?.(allergy)} className="btn btn-ghost btn-sm" style={{ width: 32, height: 32, padding: 0 }} title="Edit">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5z"/></svg>
              </button>
            )}
            {canDeactivate && (
              <button onClick={() => onDeactivate?.(allergy)} className="btn btn-ghost btn-sm hover:!bg-red-50 hover:!text-red-500" style={{ width: 32, height: 32, padding: 0 }} title="Deactivate">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
