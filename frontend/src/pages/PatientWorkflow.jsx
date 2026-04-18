import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import Header from '../components/Header'
import AllergyCard from '../components/AllergyCard'
import AddAllergyModal from '../components/AddAllergyModal'
import AlertBanner from '../components/AlertBanner'

const STEPS = [
  { id: 'review', label: 'Review', num: 1 },
  { id: 'allergies', label: 'Allergies', num: 2 },
  { id: 'recommendations', label: 'Recommendations', num: 3 },
  { id: 'order', label: 'Order', num: 4 },
  { id: 'confirmation', label: 'Confirm', num: 5 },
]

const DIET_OPTIONS = [
  'Regular Diet', 'Clear Liquid', 'Full Liquid', 'Soft Diet',
  'Consistent Carbohydrate', 'Renal Diet', 'Low Sodium', 'Low Fat',
  'High Protein', 'Mechanical Soft', 'NPO', 'Lactose-Free',
  'Gluten-Free', 'Nut-Free', 'Fluid Restriction'
]

export default function PatientWorkflow() {
  const { mrn } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [step, setStep] = useState('review')
  const [completedSteps, setCompletedSteps] = useState([])
  const [patient, setPatient] = useState(null)
  const [rec, setRec] = useState(null)
  const [conflicts, setConflicts] = useState([])
  const [selectedDiet, setSelectedDiet] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [loading, setLoading] = useState({})
  const [orderPlaced, setOrderPlaced] = useState(null)
  const [error, setError] = useState('')
  const [showAllergyModal, setShowAllergyModal] = useState(false)
  const [editingAllergy, setEditingAllergy] = useState(null)
  const [notice, setNotice] = useState('')
  const [allergiesConfirmed, setAllergiesConfirmed] = useState(false)

  const canModify = ['MD', 'RD', 'RN', 'Admin'].includes(user?.role)
  const canOverride = ['MD', 'RD', 'Admin'].includes(user?.role)

  const loadPatient = useCallback(async () => {
    try { const r = await api.get(`/patients/${mrn}`); setPatient(r.data) }
    catch { setError('Patient not found') }
  }, [mrn])

  useEffect(() => { loadPatient() }, [loadPatient])

  // Mark step complete when navigating forward
  function goStep(s) {
    const active = patient.allergies?.filter(a => a.status === 'ACTIVE') || []
    
    // Prevent skipping allergies page/confirmation when navigating TO recommendations
    if (s === 'recommendations' && step !== 'recommendations') {
      // Only block if we're NOT coming from the allergies page
      if (step !== 'allergies' && !completedSteps.includes('allergies')) {
        setError('⚠️ You must complete the Allergies step before accessing Recommendations')
        return
      }
      // If coming from allergies page, check if allergies are confirmed or documented
      if (step === 'allergies' && active.length === 0 && !allergiesConfirmed) {
        setError('⚠️ Please add allergies or confirm "No Known Allergies" before proceeding')
        return
      }
    }
    
    // Prevent skipping allergies confirmation when going forward from allergies page
    if (step === 'allergies' && s !== 'review' && s !== 'allergies') {
      if (active.length === 0 && !allergiesConfirmed) {
        setError('⚠️ Please add allergies or confirm "No Known Allergies" before proceeding')
        return
      }
    }
    
    // Mark step complete when navigating away
    if (!completedSteps.includes(step) && step !== s) {
      setCompletedSteps(prev => [...prev, step])
    }
    
    setStep(s)
    setError('')
  }

  async function generateRec() {
    setLoading(p => ({ ...p, rec: true }))
    try {
      const r = await api.post('/rules/recommend', { mrn })
      setRec(r.data)
      if (r.data.matchedRules?.length) setSelectedDiet(r.data.matchedRules[0].name)
      goStep('recommendations')
    } catch { setError('Failed to generate recommendations') }
    finally { setLoading(p => ({ ...p, rec: false })) }
  }

  // Check conflicts
  useEffect(() => {
    if (!selectedDiet || !patient) return
    api.post('/rules/conflicts', { mrn, diet: selectedDiet })
      .then(r => setConflicts(r.data.detectedConflicts || []))
      .catch(() => {})
  }, [selectedDiet, mrn, patient])

  async function onAllergySaved() {
    await loadPatient(); setRec(null)
    setAllergiesConfirmed(false)
    setNotice('✓ Allergy updated — recommendations will refresh')
    setTimeout(() => setNotice(''), 5000)
  }

  async function deactivateAllergy(a) {
    if (!confirm(`Deactivate ${a.substance}? This affects diet recommendations.`)) return
    try { 
      await api.delete(`/allergies/${a.id}`); 
      await loadPatient()
      setRec(null)
      setAllergiesConfirmed(false)
      setNotice('✓ Allergy removed — recommendations will refresh')
      setTimeout(() => setNotice(''), 5000)
    }
    catch { setError('Failed to deactivate') }
  }

  async function placeOrder() {
    setLoading(p => ({ ...p, order: true })); setError('')
    try {
      const hasConflicts = conflicts.length > 0
      const r = await api.post('/orders', {
        mrn, diet: selectedDiet,
        overridden: hasConflicts, overrideReason: hasConflicts ? overrideReason : undefined,
        alertsOverridden: hasConflicts ? conflicts.map(c => c.id) : []
      })
      setOrderPlaced(r.data)
      goStep('confirmation')
    } catch (err) { setError(err.response?.data?.error || 'Order failed') }
    finally { setLoading(p => ({ ...p, order: false })) }
  }

  function acceptAlt(c) {
    const alt = DIET_OPTIONS.find(d => d.toLowerCase().replace(/[^a-z]/g, '').includes(c.alternativeValue?.replace(/_/g, '')))
    if (alt) setSelectedDiet(alt)
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-[var(--n-50)]">
        <Header backTo="/" />
        <div className="text-center py-24"><div className="skel w-48 h-6 mx-auto mb-3"/><div className="skel w-32 h-4 mx-auto"/></div>
      </div>
    )
  }

  const active = patient.allergies?.filter(a => a.status === 'ACTIVE') || []
  const inactive = patient.allergies?.filter(a => a.status === 'INACTIVE') || []

  return (
    <div className="min-h-screen bg-[var(--n-50)]">
      <Header subtitle={`${patient.name} · MRN ${mrn}`} backTo="/" />

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* Notices */}
        {error && (
          <div className="alert alert-critical mb-4 anim-slide text-sm">
            <span className="text-lg">🚨</span>
            <div className="flex-1"><span className="font-bold">Error:</span> {error}</div>
            <button onClick={() => setError('')} className="btn btn-ghost btn-sm" style={{ width: 28, height: 28, padding: 0 }}>✕</button>
          </div>
        )}
        {notice && <div className="alert alert-success mb-4 anim-slide text-sm font-medium">{notice}</div>}

        {/* ═══ 3-Column Clinical Layout ═══ */}
        <div className="grid grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Patient Info (Sticky) */}
          <div className="col-span-3 sticky top-14 space-y-5 pt-6">
            <div className="card-elevated p-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)] border border-[var(--brand-200)] flex items-center justify-center text-[var(--brand-600)] font-bold text-base">
                  {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-[var(--n-900)] leading-tight">{patient.name}</h3>
                  <p className="text-[var(--n-400)] text-xs font-mono mt-1">MRN {patient.mrn}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--n-400)] uppercase tracking-wider mb-2">Patient Demographics</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-[13px]">
                    <span className="text-[var(--n-500)]">Age / Sex</span>
                    <span className="font-semibold text-[var(--n-800)] text-right">{patient.age}y / {patient.sex}</span>
                    <span className="text-[var(--n-500)]">Unit</span>
                    <span className="font-semibold text-[var(--n-800)] text-right">{patient.unit}</span>
                    <span className="text-[var(--n-500)]">Weight</span>
                    <span className="font-semibold text-[var(--n-800)] text-right">{patient.weight}</span>
                    <span className="text-[var(--n-500)]">BMI</span>
                    <span className="font-semibold text-[var(--n-800)] text-right">{patient.bmi}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--n-100)]">
                  <h4 className="text-[10px] font-bold text-[var(--n-400)] uppercase tracking-wider mb-2">Conditions</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.conditions.map(c => (
                      <span key={c} className="badge badge-info">{c}</span>
                    ))}
                    {!patient.conditions.length && <p className="text-xs text-[var(--n-400)] italic">None documented</p>}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--n-100)]">
                  <h4 className="text-[10px] font-bold text-[var(--n-400)] uppercase tracking-wider mb-2">Attending</h4>
                  <p className="text-[13px] font-semibold text-[var(--n-800)] flex items-center gap-2">
                    <span className="text-violet-500">👨‍⚕️</span> {patient.attending}
                  </p>
                  <p className="text-[11px] text-[var(--n-400)] mt-1">Admitted: {patient.admitted}</p>
                </div>
              </div>
            </div>
            
            {/* Quick Audit / Order History summary */}
            {patient.orders?.length > 0 && (
              <div className="card-elevated p-5 bg-[var(--n-50)] border-dashed">
                <h4 className="text-[10px] font-bold text-[var(--n-400)] uppercase tracking-wider mb-3">Order History</h4>
                <div className="space-y-3">
                  {patient.orders.slice(0, 2).map(o => (
                    <div key={o.id} className="text-xs border-l-2 border-[var(--brand-200)] pl-3">
                      <p className="font-bold text-[var(--n-800)]">{o.dietType}</p>
                      <p className="text-[var(--n-400)] mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CENTER COLUMN: Workflow Content */}
          <div className="col-span-6 space-y-6">
            {/* ═══ Horizontal Stepper ═══ */}
            <div className="card-elevated px-4 py-2 flex items-center justify-center bg-white/70 backdrop-blur-md sticky top-14 z-10">
              <div className="stepper mb-0">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="contents">
                    <button onClick={() => goStep(s.id)}
                      className={`step ${step === s.id ? 'active' : ''} ${completedSteps.includes(s.id) ? 'completed' : ''}`}>
                      <span className="step-num">
                        {completedSteps.includes(s.id) ? (
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/></svg>
                        ) : s.num}
                      </span>
                      <span className="hidden lg:inline">{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 && <div className={`step-connector ${completedSteps.includes(s.id) ? 'done' : ''}`} style={{ minWidth: 16 }} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="card-elevated p-8 anim-fade min-h-[500px]" key={step}>
              {/* ══ REVIEW ══ */}
              {step === 'review' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">📋</span>
                    <h2 className="text-xl font-bold text-[var(--n-900)]">Patient Clinical Review</h2>
                  </div>
                  <p className="text-[14px] text-[var(--n-500)] mb-8 leading-relaxed">
                    Review patient demographics, active conditions, and documented allergies before generating diet recommendations. 
                    Ensure all clinical data is current and accurate.
                  </p>

                  <div className="space-y-6">
                    <div className="p-5 bg-[var(--n-50)] rounded-xl border border-[var(--n-100)]">
                      <h4 className="text-xs font-bold text-[var(--n-400)] uppercase tracking-wider mb-3">Clinical Assessment Summary</h4>
                      <p className="text-sm text-[var(--n-700)] leading-relaxed">
                        Patient has <strong>{patient.conditions.length}</strong> active conditions documented, including {patient.conditions[0] || 'N/A'}. 
                        Recommended next step is to verify allergies and generate CDS guidance.
                      </p>
                    </div>

                    {!active.length && (
                      <div className="alert alert-warning">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <p className="font-bold text-sm">No allergies recorded</p>
                          <p className="text-xs mt-1">Clinical safety protocol requires verification of allergy status with patient.</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button onClick={() => goStep('allergies')} className="btn btn-primary btn-lg flex-1">
                        Next: Verify & Document Allergies →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ ALLERGIES ══ */}
              {step === 'allergies' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛡️</span>
                      <h2 className="text-xl font-bold text-[var(--n-900)]">Allergy Documentation</h2>
                    </div>
                    {canModify && (
                      <button id="add-allergy-btn" onClick={() => { setEditingAllergy(null); setShowAllergyModal(true) }} className="btn btn-primary btn-md">
                        + Add Allergy
                      </button>
                    )}
                  </div>

                  {active.length === 0 && (
                    <div className="alert alert-warning mb-6">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="font-bold text-sm">No allergies documented</p>
                        <p className="text-xs mt-1">Please add patient allergies or confirm that there are no known allergies (NKA) before proceeding to recommendations.</p>
                      </div>
                    </div>
                  )}

                  {active.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--n-50)] rounded-2xl border-2 border-dashed border-[var(--n-200)]">
                      <div className="text-5xl mb-4">🛡️</div>
                      <h3 className="text-lg font-semibold text-[var(--n-700)] mb-1">No Known Allergies (NKA)</h3>
                      <p className="text-sm text-[var(--n-400)] mb-6 max-w-xs mx-auto">Confirm with the patient before proceeding to diet recommendations.</p>
                      {canModify && (
                        <button onClick={() => { setEditingAllergy(null); setShowAllergyModal(true) }} className="btn btn-primary btn-md">Add Allergy Record</button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {active.map(a => (
                        <AllergyCard key={a.id} allergy={a}
                          onEdit={a => { setEditingAllergy(a); setShowAllergyModal(true) }}
                          onDeactivate={deactivateAllergy} />
                      ))}
                    </div>
                  )}

                  {active.length === 0 && (
                    <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allergiesConfirmed}
                          onChange={(e) => setAllergiesConfirmed(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 checked:bg-blue-600 checked:border-blue-600"
                        />
                        <span className="text-sm font-semibold text-[var(--n-800)]">
                          I have confirmed with the patient that there are <strong>no known allergies (NKA)</strong>
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-[var(--n-100)] flex items-center justify-between">
                    <button onClick={() => goStep('review')} className="btn btn-ghost btn-md">← Back</button>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={generateRec} 
                        disabled={loading.rec || (active.length === 0 && !allergiesConfirmed)}
                        className="btn btn-primary btn-md"
                      >
                        {loading.rec ? 'Generating...' : 'Confirm & Continue →'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ RECOMMENDATIONS ══ */}
              {step === 'recommendations' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">💡</span>
                    <h2 className="text-xl font-bold text-[var(--n-900)]">CDS Recommendations</h2>
                  </div>

                  {!rec ? (
                    <div className="text-center py-16">
                      <p className="text-[var(--n-400)] text-sm mb-4">Recommendations haven't been generated yet.</p>
                      <button onClick={generateRec} disabled={loading.rec} className="btn btn-primary btn-md">Generate Guidance</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Primary Recommendation Hero */}
                      <div className="bg-gradient-to-br from-indigo-600 to-[var(--brand-700)] text-white rounded-2xl p-6 shadow-lg shadow-indigo-100">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 px-2 py-1 bg-white/10 rounded">Primary Diet Selection</span>
                          <span className="text-2xl font-black">{rec.confidence}%</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{rec.primaryRecommendation}</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed mb-4">{rec.rationale}</p>
                        <div className="conf-bar bg-white/20">
                          <div className="conf-fill bg-white" style={{ width: `${rec.confidence}%` }}/>
                        </div>
                      </div>

                      {/* Matching Logic */}
                      <div>
                        <h4 className="text-xs font-bold text-[var(--n-400)] uppercase tracking-wider mb-4">Why this diet?</h4>
                        <div className="space-y-3">
                          {rec.matchedRules?.map((r, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-white border border-[var(--n-100)] rounded-xl hover:border-[var(--brand-200)] transition">
                              <div className="text-indigo-600 mt-1">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[var(--n-800)]">{r.name}</p>
                                <p className="text-xs text-[var(--n-500)] mt-1">{r.rationale}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-8 pt-6 border-t border-[var(--n-100)]">
                        <button onClick={() => goStep('allergies')} className="btn btn-ghost btn-md">← Back</button>
                        <button id="proceed-to-order-btn" onClick={() => goStep('order')} className="btn btn-primary btn-lg flex-1">Proceed to Order →</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ ORDER ══ */}
              {step === 'order' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">✍️</span>
                    <h2 className="text-xl font-bold text-[var(--n-900)]">Finalize Diet Order</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="p-5 bg-[var(--brand-50)] rounded-xl border border-[var(--brand-100)]">
                      <label className="label label-required !text-[var(--brand-700)]">Patient Diet Type</label>
                      <select value={selectedDiet} onChange={e => setSelectedDiet(e.target.value)} className="select text-[16px] !bg-white !border-[var(--brand-200)]" style={{ height: 52 }}>
                        <option value="">Choose diet...</option>
                        {DIET_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {rec && selectedDiet && selectedDiet !== rec.primaryRecommendation && (
                        <p className="text-[11px] text-amber-600 font-semibold mt-3 italic flex items-center gap-1">
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>
                          Note: Selected diet differs from CDS recommendation ({rec.primaryRecommendation})
                        </p>
                      )}
                    </div>

                    {conflicts.length > 0 && (
                      <div className="alert alert-critical">
                        <span className="text-lg">🚨</span>
                        <div className="flex-1">
                          <p className="font-bold text-sm">Clinical Safety Conflicts Detected</p>
                          <p className="text-xs mt-1">The selected diet conflicts with documented patient allergies or restrictions.</p>
                          <div className="mt-4">
                            <AlertBanner conflicts={conflicts} onOverride={() => {}} onAcceptAlternative={acceptAlt} />
                          </div>
                        </div>
                      </div>
                    )}

                    {conflicts.length > 0 && (
                      <div>
                        <label className="label label-required">Override Rationale</label>
                        <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                          className={`input ${!overrideReason.trim() && 'border-amber-300 bg-amber-50'}`} 
                          rows={4} placeholder="Required: Document clinical necessity for overriding the safety alerts..." />
                        {!canOverride && <p className="text-xs text-[var(--crit)] mt-2 font-bold px-2">🔴 Only Physicians (MD) or Dietitians (RD) may override safety alerts.</p>}
                      </div>
                    )}

                    <div className="flex gap-4 mt-8 pt-6 border-t border-[var(--n-100)]">
                      <button onClick={() => goStep('recommendations')} className="btn btn-ghost btn-md">← Back</button>
                      <button onClick={placeOrder} disabled={!selectedDiet || loading.order || (conflicts.length > 0 && (!overrideReason.trim() || !canOverride))}
                        className="btn btn-success btn-lg flex-1 shadow-lg">
                        {loading.order ? 'Authorizing Order...' : 'Sign & Complete Order ✓'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ CONFIRMATION ══ */}
              {step === 'confirmation' && orderPlaced && (
                <div className="text-center py-10 anim-pop">
                  <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">✓</div>
                  <h2 className="text-3xl font-extrabold text-[var(--n-900)] mb-2">Order Confirmed</h2>
                  <p className="text-[var(--n-500)] text-lg mb-10"><strong>{orderPlaced.dietType}</strong> assigned to {patient.name}</p>

                  <div className="bg-[var(--n-50)] rounded-2xl p-8 max-w-sm mx-auto text-left border border-[var(--n-100)] mb-10 shadow-sm">
                    <h4 className="text-[10px] font-bold text-[var(--n-400)] uppercase tracking-wider mb-4">Transmission Receipt</h4>
                    <div className="space-y-4 text-sm">
                      {[
                        ['Order ID', orderPlaced.id?.slice(0, 8).toUpperCase()],
                        ['Clinician', orderPlaced.user?.name],
                        ['Role', orderPlaced.user?.role],
                        ['Facility', 'SmartDiet General Hospital'],
                        ['Timestamp', new Date(orderPlaced.createdAt).toLocaleString()],
                      ].map(([l, v]) => (
                        <div key={l} className="flex justify-between border-b border-[var(--n-100)] pb-2">
                          <span className="text-[var(--n-400)] text-xs">{l}</span>
                          <span className="font-bold text-[var(--n-800)]">{v}</span>
                        </div>
                      ))}
                      {orderPlaced.overridden && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mb-1">Alerts Overridden</p>
                          <p className="text-xs text-amber-800 line-clamp-2 italic">"{orderPlaced.overrideReason}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 max-w-sm mx-auto">
                    <button id="patient-home-btn" onClick={() => navigate('/')} className="btn btn-primary btn-lg flex-1">Patient Home</button>
                    <button className="btn btn-secondary btn-lg" onClick={() => window.print()}>Print Summary</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Real-time CDS & Alerts (Sticky) */}
          <div className="col-span-3 sticky top-14 space-y-6 pt-6">
            
            {/* CDS Intelligence Panel */}
            <div className="card-elevated p-6 border-l-4 border-l-indigo-600 bg-white shadow-xl shadow-indigo-50">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🤖</span>
                <h4 className="text-[10px] font-bold text-[var(--n-400)] uppercase tracking-wider">Clinical Guidance</h4>
              </div>
              
              {!rec ? (
                <div className="text-center py-6">
                  <p className="text-xs text-[var(--n-400)] italic">Awaiting assessment data</p>
                  <div className="skel h-2 w-full mt-4 bg-[var(--n-100)] rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-200 animate-pulse" style={{ width: '40%' }}/>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-[var(--n-500)] font-bold">Confidence</span>
                      <span className={`text-xl font-black ${rec.confidence >= 80 ? 'text-indigo-600' : 'text-amber-600'}`}>
                        {rec.confidence}%
                      </span>
                    </div>
                    <div className="conf-bar bg-[var(--n-100)]">
                      <div className="conf-fill" style={{
                        width: `${rec.confidence}%`,
                        background: rec.confidence >= 80 ? 'var(--brand-600)' : 'var(--mod)'
                      }}/>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-[var(--n-400)] uppercase tracking-widest mb-2">Recommended Diet</p>
                    <p className="text-[15px] font-extrabold text-[var(--n-800)] leading-tight">{rec.primaryRecommendation}</p>
                  </div>

                  {rec.requiresRDConsult && (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                        🔔 Consult Required
                      </p>
                      <p className="text-[11px] leading-tight">Dietary complexity requires Registered Dietitian (RD) review.</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[var(--n-100)]">
                    <p className="text-[10px] font-bold text-[var(--n-400)] uppercase tracking-widest mb-2">Restricted Items</p>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.allergyDerivedRestrictions?.map(r => (
                        <span key={r} className="badge badge-severe uppercase" style={{ fontSize: '9px' }}>NO {r}</span>
                      ))}
                      {!rec.allergyDerivedRestrictions?.length && <span className="text-xs text-[var(--n-400)] italic">None</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Safety Alerts (Passive) */}
            {active.length > 0 && (
              <div className="card-elevated p-5 bg-[var(--crit-bg)] border-[var(--crit-border)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">⚠️</span>
                  <h4 className="text-[10px] font-bold text-[var(--crit)] uppercase tracking-wider">Documented Allergies</h4>
                </div>
                <div className="space-y-2">
                  {active.map(a => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--n-800)] px-2 py-0.5 bg-white rounded border border-[var(--crit-border)]">{a.substance}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${a.severity === 'SEVERE' ? 'bg-[var(--crit)] text-white' : 'bg-amber-100 text-amber-700'}`}>
                        {a.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!active.length && step !== 'review' && (
              <div className="card p-4 bg-amber-50 border-amber-200">
                <p className="text-[11px] text-amber-800 leading-snug font-medium">
                  <strong>Warning:</strong> No allergies on file. Clinical safety dictates secondary verification before order signing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Allergy Modal */}
      {showAllergyModal && (
        <AddAllergyModal patientId={patient.id} patientName={patient.name}
          editAllergy={editingAllergy}
          onClose={() => { setShowAllergyModal(false); setEditingAllergy(null) }}
          onSaved={onAllergySaved} />
      )}
    </div>
  )
}
