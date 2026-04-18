import { useState, useEffect, useRef } from 'react'
import api from '../api/client'

const SUBSTANCES = [
  { name: 'Peanuts', category: 'FOOD' }, { name: 'Tree Nuts', category: 'FOOD' },
  { name: 'Milk', category: 'FOOD' }, { name: 'Lactose', category: 'FOOD' },
  { name: 'Eggs', category: 'FOOD' }, { name: 'Wheat', category: 'FOOD' },
  { name: 'Gluten', category: 'FOOD' }, { name: 'Soy', category: 'FOOD' },
  { name: 'Fish', category: 'FOOD' }, { name: 'Shellfish', category: 'FOOD' },
  { name: 'Sesame', category: 'FOOD' }, { name: 'Corn', category: 'FOOD' },
  { name: 'Sulfites', category: 'FOOD' }, { name: 'Gelatin', category: 'FOOD' },
  { name: 'Red dye', category: 'FOOD' },
  { name: 'Penicillin', category: 'MEDICATION' }, { name: 'Sulfonamides', category: 'MEDICATION' },
  { name: 'Aspirin', category: 'MEDICATION' }, { name: 'Ibuprofen', category: 'MEDICATION' },
  { name: 'Codeine', category: 'MEDICATION' }, { name: 'Morphine', category: 'MEDICATION' },
  { name: 'Contrast dye', category: 'MEDICATION' },
  { name: 'Latex', category: 'ENVIRONMENT' }, { name: 'Nickel', category: 'ENVIRONMENT' },
  { name: 'Pollen', category: 'ENVIRONMENT' }, { name: 'Dust mites', category: 'ENVIRONMENT' },
]

const REACTIONS = [
  'Anaphylaxis', 'Hives / Urticaria', 'Rash', 'Angioedema',
  'GI Distress', 'Nausea / Vomiting', 'Diarrhea',
  'Respiratory distress', 'Wheezing', 'Bronchospasm',
  'Contact dermatitis', 'Oral allergy syndrome',
  'Itching / Pruritus', 'Swelling', 'Abdominal pain',
]

const SEV = [
  { val: 'MILD', label: 'Mild', desc: 'Minor symptoms, self-limiting', cls: 'sel-mild' },
  { val: 'MODERATE', label: 'Moderate', desc: 'Significant symptoms, may need treatment', cls: 'sel-moderate' },
  { val: 'SEVERE', label: 'Severe', desc: 'Life-threatening, anaphylaxis risk', cls: 'sel-severe' },
]

export default function AddAllergyModal({ patientId, patientName, onClose, onSaved, editAllergy }) {
  const isEdit = !!editAllergy
  const [substance, setSubstance] = useState(editAllergy?.substance || '')
  const [reaction, setReaction] = useState(editAllergy?.reaction || '')
  const [severity, setSeverity] = useState(editAllergy?.severity || 'MODERATE')
  const [category, setCategory] = useState(editAllergy?.category || 'FOOD')
  const [notes, setNotes] = useState(editAllergy?.notes || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSubDropdown, setShowSubDropdown] = useState(false)
  const [showReactionDropdown, setShowReactionDropdown] = useState(false)
  const [customSubstance, setCustomSubstance] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const filteredSubs = SUBSTANCES.filter(s =>
    s.name.toLowerCase().includes(substance.toLowerCase())
  )

  const filteredReactions = REACTIONS.filter(r =>
    r.toLowerCase().includes(reaction.toLowerCase())
  )

  function selectSubstance(s) {
    setSubstance(s.name)
    setCategory(s.category)
    setShowSubDropdown(false)
    setCustomSubstance(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!substance.trim()) { setError('Substance is required'); return }
    setLoading(true); setError('')
    try {
      if (isEdit) {
        await api.put(`/allergies/${editAllergy.id}`, { substance: substance.trim(), reaction: reaction || null, severity, category, notes: notes || null })
      } else {
        await api.post(`/allergies/patients/${patientId}/allergies`, { substance: substance.trim(), reaction: reaction || null, severity, category, notes: notes || null, source: 'PROVIDER_ENTERED' })
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save allergy')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel modal-md">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-7 pt-6 pb-4 border-b border-[var(--n-200)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-[var(--n-900)]">{isEdit ? 'Edit Allergy' : 'Add Allergy'}</h2>
                <p className="text-[13px] text-[var(--n-400)] mt-1">Patient: <span className="font-medium text-[var(--n-700)]">{patientName}</span></p>
              </div>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" style={{ width: 32, height: 32, padding: 0 }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-7 py-6 space-y-5">
            {error && <div className="alert alert-critical text-sm anim-slide"><span className="font-semibold">Error:</span> {error}</div>}

            {/* Substance - searchable dropdown */}
            <div>
              <label className="label label-required">Substance</label>
              <div className="relative">
                <input ref={inputRef} value={substance}
                  onChange={e => { setSubstance(e.target.value); setShowSubDropdown(true); if (e.target.value && !SUBSTANCES.find(s => s.name.toLowerCase() === e.target.value.toLowerCase())) setCustomSubstance(true); else setCustomSubstance(false) }}
                  onFocus={() => setShowSubDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSubDropdown(false), 150)}
                  className="input" placeholder="Search allergens..."
                  autoComplete="off" />
                {showSubDropdown && (
                  <div className="dropdown-menu">
                    {filteredSubs.length > 0 ? (
                      filteredSubs.slice(0, 10).map(s => (
                        <div key={s.name} className="dropdown-item" onMouseDown={() => selectSubstance(s)}>
                          <span className="flex-1">{s.name}</span>
                          <span className="text-[11px] font-medium text-[var(--n-400)] bg-[var(--n-100)] px-2 py-0.5 rounded">{s.category}</span>
                        </div>
                      ))
                    ) : substance.trim() ? (
                      <div className="dropdown-item" onMouseDown={() => { setCustomSubstance(true); setShowSubDropdown(false) }}>
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-[var(--brand-500)]"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                        <span>Add custom: <strong>"{substance}"</strong></span>
                      </div>
                    ) : (
                      <div className="dropdown-empty">Type to search allergens</div>
                    )}
                  </div>
                )}
              </div>
              {customSubstance && substance && (
                <p className="text-xs text-[var(--mod)] mt-1.5 flex items-center gap-1">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/></svg>
                  Custom substance — not in standardized list
                </p>
              )}
            </div>

            {/* Reaction - dropdown */}
            <div>
              <label className="label">Reaction</label>
              <div className="relative">
                <input value={reaction}
                  onChange={e => { setReaction(e.target.value); setShowReactionDropdown(true) }}
                  onFocus={() => setShowReactionDropdown(true)}
                  onBlur={() => setTimeout(() => setShowReactionDropdown(false), 150)}
                  className="input" placeholder="Search reactions..."
                  autoComplete="off" />
                {showReactionDropdown && filteredReactions.length > 0 && (
                  <div className="dropdown-menu">
                    {filteredReactions.slice(0, 8).map(r => (
                      <div key={r} className="dropdown-item" onMouseDown={() => { setReaction(r); setShowReactionDropdown(false) }}>
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="label label-required">Severity</label>
              <div className="flex gap-2">
                {SEV.map(s => (
                  <button key={s.val} type="button"
                    onClick={() => setSeverity(s.val)}
                    className={`sev-btn ${severity === s.val ? s.cls : ''}`}>
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-[10px] font-normal mt-0.5 opacity-70">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Clinical Notes <span className="font-normal text-[var(--n-400)]">(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="input" rows={3} placeholder="Additional clinical context..." />
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 border-t border-[var(--n-200)] bg-[var(--n-50)] rounded-b-[var(--r-xl)] flex justify-between items-center">
            <p className="text-xs text-[var(--n-400)]">Source: <span className="font-medium text-[var(--n-600)]">Provider Entered</span></p>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-md">Cancel</button>
              <button type="submit" disabled={loading || !substance.trim()} className="btn btn-primary btn-md">
                {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Allergy'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
