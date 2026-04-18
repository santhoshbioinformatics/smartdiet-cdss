import useAuthStore from '../store/authStore'

const ICO = { critical: '🚨', high: '⚠️', moderate: '⚡' }
const CLS = { critical: 'alert-critical', high: 'alert-warning', moderate: 'alert-info' }

export default function AlertBanner({ conflicts, onOverride, onAcceptAlternative }) {
  const { user } = useAuthStore()
  const canOverride = ['MD', 'RD', 'Admin'].includes(user?.role)

  if (!conflicts?.length) return null

  return (
    <div className="space-y-3 anim-slide">
      {conflicts.map((c, i) => (
        <div key={c.id || i} className={`alert ${CLS[c.severity] || 'alert-warning'}`}>
          <span className="text-xl flex-shrink-0 mt-0.5">{ICO[c.severity] || '⚡'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{c.title}</p>
            <p className="text-xs mt-1 opacity-90">{c.description}</p>
            <p className="text-xs mt-1 opacity-70"><span className="font-semibold">Risk:</span> {c.risk}</p>
            <p className="text-[10px] mt-1.5 opacity-50">Source: {c.source}</p>

            <div className="flex items-center gap-2 mt-3">
              {c.alternative && (
                <button onClick={() => onAcceptAlternative?.(c)} className="btn btn-primary btn-sm">
                  ✓ Use {c.alternative}
                </button>
              )}
              {canOverride ? (
                <button onClick={() => onOverride?.(c)} className="btn btn-danger btn-sm">
                  Override (MD/RD)
                </button>
              ) : (
                <span className="text-xs text-[var(--n-400)] italic">Only MD/RD can override</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
