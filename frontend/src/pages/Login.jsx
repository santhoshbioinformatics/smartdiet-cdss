import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'

const DEMOS = [
  { label: 'Nurse', role: 'RN', email: 'nurse@smartdiet.com', password: 'nurse123', desc: 'View & document', color: 'bg-sky-50 border-sky-200 hover:border-sky-300' },
  { label: 'Doctor', role: 'MD', email: 'doctor@smartdiet.com', password: 'doctor123', desc: 'Full access + override', color: 'bg-violet-50 border-violet-200 hover:border-violet-300' },
  { label: 'Dietitian', role: 'RD', email: 'dietitian@smartdiet.com', password: 'dietitian123', desc: 'Diet management', color: 'bg-teal-50 border-teal-200 hover:border-teal-300' },
  { label: 'Admin', role: 'Admin', email: 'admin@smartdiet.com', password: 'admin123', desc: 'System admin', color: 'bg-slate-50 border-slate-200 hover:border-slate-300' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await api.post('/auth/login', { email, password })
      login(r.data.user, r.data.token)
      navigate('/')
    } catch { setError('Invalid email or password') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] anim-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s ease infinite' }} />
            <span className="text-white font-bold text-2xl tracking-tight">SmartDiet CDSS</span>
          </div>
          <p className="text-slate-400 text-sm">Clinical Decision Support System</p>
          <p className="text-amber-400/80 text-[11px] mt-2 font-semibold">⚠ For Demonstration Use Only</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl shadow-black/20">
          <h2 className="text-lg font-bold text-[var(--n-900)] mb-6">Sign in</h2>

          {error && <div className="alert alert-critical text-sm mb-5 anim-slide">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@hospital.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-[var(--n-100)]">
            <p className="text-[10px] text-[var(--n-400)] mb-3 font-bold uppercase tracking-widest">Quick Access</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMOS.map(d => (
                <button key={d.email} onClick={() => { setEmail(d.email); setPassword(d.password) }}
                  className={`text-left px-3.5 py-3 border rounded-xl text-xs transition group ${d.color}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[var(--n-800)]">{d.label}</span>
                    <span className="text-[10px] font-mono text-[var(--n-400)]">{d.role}</span>
                  </div>
                  <div className="text-[var(--n-400)] mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-500">v3.0 · Prisma + PostgreSQL · HIPAA-aware audit logging</p>
      </div>
    </div>
  )
}
