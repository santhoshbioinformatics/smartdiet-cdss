import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Header from '../components/Header'
import AddPatientModal from '../components/AddPatientModal'

const FILTERS = ['All', 'Severe Allergies', 'Multi-Condition', 'No Allergies']

function riskLevel(p) {
  const severe = p.allergies?.some(a => a.severity === 'SEVERE')
  const moderate = p.allergies?.some(a => a.severity === 'MODERATE')
  const multi = p.conditions.length > 2
  if (severe || (moderate && multi)) return 'high'
  if (moderate || multi) return 'moderate'
  return 'stable'
}

const RISK_BADGE = {
  high: 'badge-risk-high',
  moderate: 'badge-risk-moderate',
  stable: 'badge-risk-stable',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showAddPatient, setShowAddPatient] = useState(false)

  function loadPatients() {
    api.get('/patients').then(r => { setPatients(r.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { loadPatients() }, [])

  const filtered = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.mrn.includes(search)
    if (!matchesSearch) return false
    if (filter === 'Severe Allergies') return p.allergies?.some(a => a.severity === 'SEVERE')
    if (filter === 'Multi-Condition') return p.conditions.length > 1
    if (filter === 'No Allergies') return !p.allergies?.length
    return true
  })

  const stats = {
    total: patients.length,
    withAllergies: patients.filter(p => p.allergies?.length > 0).length,
    severe: patients.filter(p => p.allergies?.some(a => a.severity === 'SEVERE')).length,
    multiCond: patients.filter(p => p.conditions.length > 1).length,
  }

  return (
    <div className="min-h-screen bg-[var(--n-50)]">
      <Header actions={
        <button onClick={() => setShowAddPatient(true)} className="btn btn-primary btn-sm" id="add-patient-btn">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
          Add Patient
        </button>
      } />

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Title */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[26px] font-bold text-[var(--n-900)] tracking-tight">Patient Dashboard</h1>
            <p className="text-[var(--n-400)] text-sm mt-1">Manage dietary assessments and allergy documentation</p>
          </div>
          <div className="bg-amber-50/80 border border-amber-200 text-amber-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg">
            ⚠ Demo Environment
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Total Patients', value: stats.total, color: 'text-[var(--brand-600)]', accent: 'bg-[var(--brand-50)]' },
            { label: 'Documented Allergies', value: stats.withAllergies, color: 'text-amber-600', accent: 'bg-amber-50' },
            { label: 'Severe Allergies', value: stats.severe, color: 'text-[var(--crit)]', accent: 'bg-[var(--crit-bg)]' },
            { label: 'Multi-Condition', value: stats.multiCond, color: 'text-violet-600', accent: 'bg-violet-50' },
          ].map(s => (
            <div key={s.label} className={`kpi ${s.accent}`}>
              <div className={`kpi-value ${s.color}`}>{loading ? '–' : s.value}</div>
              <div className="kpi-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--n-400)]" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients by name or MRN..."
              className="input text-[15px]" style={{ height: 44, borderRadius: 'var(--r-lg)', paddingLeft: 48 }} id="patient-search" />
          </div>
          <div className="flex gap-1.5">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'active' : ''}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Patient Cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="card p-6 h-[220px]"><div className="flex gap-3"><div className="skel w-12 h-12 rounded-full"/><div className="flex-1"><div className="skel h-4 w-36 mb-2"/><div className="skel h-3 w-24"/></div></div></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 anim-fade">
            <div className="text-5xl mb-4">🏥</div>
            <h3 className="text-lg font-semibold text-[var(--n-700)] mb-1">{search ? 'No matching patients' : 'No patients yet'}</h3>
            <p className="text-sm text-[var(--n-400)] mb-5">{search ? 'Try a different search term' : 'Create your first patient to begin'}</p>
            {!search && (
              <button onClick={() => setShowAddPatient(true)} className="btn btn-primary btn-md">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                Add Patient
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, idx) => {
              const risk = riskLevel(p)
              const activeAllergies = p.allergies?.filter(a => a.status === 'ACTIVE') || []
              return (
                <div key={p.id}
                  onClick={() => navigate(`/patient/${p.mrn}`)}
                  className="card card-hover p-6 cursor-pointer"
                  style={{ animationDelay: `${idx * 40}ms`, animation: `slideIn 0.3s var(--ease) both` }}
                  id={`patient-${p.mrn}`}>

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)] border border-[var(--brand-200)] flex items-center justify-center text-[var(--brand-600)] font-bold text-sm flex-shrink-0">
                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-[15px] text-[var(--n-800)]">{p.name}</div>
                        <div className="text-[var(--n-400)] text-xs font-mono mt-0.5">MRN {p.mrn}</div>
                      </div>
                    </div>
                    <span className={`badge ${RISK_BADGE[risk]}`}>
                      {risk === 'high' ? '● High' : risk === 'moderate' ? '● Moderate' : '● Stable'}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--n-500)] mb-3 flex items-center gap-2">
                    <span>{p.age}{p.sex?.[0]} · {p.weight}</span>
                    <span className="text-[var(--n-300)]">|</span>
                    <span>{p.unit}</span>
                    <span className="text-[var(--n-300)]">|</span>
                    <span>Dr. {p.attending.replace('Dr. ', '')}</span>
                  </div>

                  {/* Conditions */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {p.conditions.map(c => (
                      <span key={c} className="badge badge-info">{c}</span>
                    ))}
                  </div>

                  {/* Allergies */}
                  {activeAllergies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeAllergies.map(a => (
                        <span key={a.id} className={`badge ${a.severity === 'SEVERE' ? 'badge-severe' : a.severity === 'MODERATE' ? 'badge-moderate' : 'badge-mild'}`}>
                          ⚠ {a.substance}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick actions (hover) */}
                  <div className="patient-card-actions mt-3 pt-3 border-t border-[var(--n-100)] flex gap-2">
                    <button className="btn btn-primary btn-sm flex-1" onClick={e => { e.stopPropagation(); navigate(`/patient/${p.mrn}`) }}>
                      Review
                    </button>
                    <button className="btn btn-secondary btn-sm flex-1" onClick={e => { e.stopPropagation(); navigate(`/patient/${p.mrn}`) }}>
                      Order Diet
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <AddPatientModal
          onClose={() => setShowAddPatient(false)}
          onCreated={() => loadPatients()}
        />
      )}
    </div>
  )
}
