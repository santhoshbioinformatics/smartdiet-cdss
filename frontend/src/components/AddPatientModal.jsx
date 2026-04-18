import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const UNITS = ['2-South GI', '3-East Endocrine', '4-North Med/Surg', '5-West Nephrology', '6-North Cardiology', 'ICU', 'NICU', 'ED Observation']
const CONDITIONS_LIST = [
  'Type 2 Diabetes Mellitus', 'Type 1 Diabetes Mellitus', 'Hypertension (Stage 1)', 'Hypertension (Stage 2)',
  'Chronic Kidney Disease (Stage 3b)', 'Chronic Kidney Disease (Stage 4)', 'End Stage Renal Disease',
  'Heart Failure', 'Coronary Artery Disease', 'Hyperlipidemia',
  'Celiac Disease', 'Lactose Intolerance', 'Crohns Disease Active',
  'Dysphagia', 'Post-Stroke Dysphagia', 'Acute Pancreatitis',
  'Pre-operative', 'Post-Surgical Recovery',
  'Pressure Ulcer Stage 3', 'Pressure Ulcer Stage 4',
  'Cirrhosis with Ascites', 'Bowel Obstruction', 'Active GI Bleed'
]

export default function AddPatientModal({ onClose, onCreated }) {
  const navigate = useNavigate()
  const nameRef = useRef(null)
  const [form, setForm] = useState({
    name: '', mrn: '', age: '', sex: 'Female',
    weight: '', height: '', unit: '', attending: '',
    conditions: []
  })
  const [autoMrn, setAutoMrn] = useState(true)
  const [condSearch, setCondSearch] = useState('')
  const [showCondDropdown, setShowCondDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => { setTimeout(() => nameRef.current?.focus(), 100) }, [])
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.age || isNaN(form.age) || form.age < 0 || form.age > 150) e.age = 'Valid age required'
    if (!autoMrn && !form.mrn.trim()) e.mrn = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function toggleCondition(c) {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter(x => x !== c)
        : [...prev.conditions, c]
    }))
    setCondSearch('')
  }

  const filteredConds = CONDITIONS_LIST.filter(c =>
    c.toLowerCase().includes(condSearch.toLowerCase()) && !form.conditions.includes(c)
  )

  function calcBmi() {
    const w = parseFloat(form.weight); const h = parseFloat(form.height)
    if (w > 0 && h > 0) return (w / ((h / 100) ** 2)).toFixed(1)
    return 'N/A'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true); setError('')

    try {
      const res = await api.post('/patients', {
        name: form.name.trim(),
        mrn: autoMrn ? undefined : form.mrn.trim(),
        age: parseInt(form.age),
        sex: form.sex,
        weight: form.weight ? `${form.weight} kg` : 'N/A',
        height: form.height ? `${form.height} cm` : 'N/A',
        bmi: calcBmi(),
        unit: form.unit || 'Unassigned',
        attending: form.attending || 'Unassigned',
        conditions: form.conditions,
        restrictions: []
      })
      onCreated?.(res.data)
      navigate(`/patient/${res.data.mrn}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel modal-lg">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-7 pt-6 pb-4 border-b border-[var(--n-200)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-[var(--n-900)]">Add New Patient</h2>
                <p className="text-[13px] text-[var(--n-400)] mt-1">Create a patient record to begin dietary assessment</p>
              </div>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" style={{ width: 32, height: 32, padding: 0 }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-7 py-6">
            {error && (
              <div className="alert alert-critical mb-5 anim-slide text-sm">
                <span className="font-semibold">Error:</span> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-5 gap-y-5">
              {/* Name */}
              <div className="col-span-2">
                <label className="label label-required">Patient Name</label>
                <input ref={nameRef} value={form.name} onChange={e => update('name', e.target.value)}
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g., Margaret H." autoComplete="off" />
                {errors.name && <p className="text-[var(--crit)] text-xs mt-1">{errors.name}</p>}
              </div>

              {/* MRN */}
              <div>
                <label className="label">MRN</label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-2 text-xs text-[var(--n-500)] cursor-pointer">
                    <input type="checkbox" checked={autoMrn} onChange={e => setAutoMrn(e.target.checked)} className="accent-[var(--brand-600)]" />
                    Auto-generate
                  </label>
                </div>
                {!autoMrn && (
                  <input value={form.mrn} onChange={e => update('mrn', e.target.value)}
                    className={`input ${errors.mrn ? 'input-error' : ''}`}
                    placeholder="XX-XXX-XXXX" />
                )}
                {autoMrn && <p className="text-xs text-[var(--n-400)]">Will be assigned automatically</p>}
              </div>

              {/* Age */}
              <div>
                <label className="label label-required">Age</label>
                <input type="number" min="0" max="150" value={form.age} onChange={e => update('age', e.target.value)}
                  className={`input ${errors.age ? 'input-error' : ''}`} placeholder="e.g., 68" />
                {errors.age && <p className="text-[var(--crit)] text-xs mt-1">{errors.age}</p>}
              </div>

              {/* Sex */}
              <div>
                <label className="label">Sex</label>
                <div className="flex gap-2">
                  {['Female', 'Male', 'Other'].map(s => (
                    <button key={s} type="button" onClick={() => update('sex', s)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border-1.5 transition ${
                        form.sex === s
                          ? 'bg-[var(--brand-50)] text-[var(--brand-600)] border-[var(--brand-200)]'
                          : 'bg-[var(--n-50)] text-[var(--n-500)] border-[var(--n-200)] hover:bg-[var(--n-100)]'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="label">Weight (kg)</label>
                <input type="number" value={form.weight} onChange={e => update('weight', e.target.value)}
                  className="input" placeholder="e.g., 72" />
              </div>

              {/* Height */}
              <div>
                <label className="label">Height (cm)</label>
                <input type="number" value={form.height} onChange={e => update('height', e.target.value)}
                  className="input" placeholder="e.g., 163" />
              </div>

              {/* Unit */}
              <div>
                <label className="label">Unit / Floor</label>
                <select value={form.unit} onChange={e => update('unit', e.target.value)} className="select">
                  <option value="">Select unit...</option>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Attending */}
              <div>
                <label className="label">Attending Physician</label>
                <input value={form.attending} onChange={e => update('attending', e.target.value)}
                  className="input" placeholder="e.g., Dr. Patel" />
              </div>

              {/* Conditions */}
              <div className="col-span-2">
                <label className="label">Active Conditions</label>
                {form.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {form.conditions.map(c => (
                      <span key={c} className="badge badge-info flex items-center gap-1 pr-1.5">
                        {c}
                        <button type="button" onClick={() => toggleCondition(c)} className="hover:text-red-500 transition ml-1">
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input value={condSearch}
                    onChange={e => { setCondSearch(e.target.value); setShowCondDropdown(true) }}
                    onFocus={() => setShowCondDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCondDropdown(false), 150)}
                    className="input"
                    placeholder="Search conditions to add..." />
                  {showCondDropdown && filteredConds.length > 0 && (
                    <div className="dropdown-menu">
                      {filteredConds.slice(0, 8).map(c => (
                        <div key={c} className="dropdown-item" onMouseDown={() => toggleCondition(c)}>
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-[var(--brand-500)] flex-shrink-0"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 border-t border-[var(--n-200)] bg-[var(--n-50)] rounded-b-[var(--r-xl)] flex items-center justify-between">
            <p className="text-xs text-[var(--n-400)]">Allergies can be added after creation</p>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-md">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary btn-md">
                {loading ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M4 12a8 8 0 018-8" strokeLinecap="round"/></svg> Creating...</>
                ) : 'Create Patient →'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
