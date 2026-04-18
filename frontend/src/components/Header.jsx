import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const ROLE_STYLE = {
  RN: 'bg-sky-100 text-sky-700 border-sky-200',
  MD: 'bg-violet-100 text-violet-700 border-violet-200',
  RD: 'bg-teal-100 text-teal-700 border-teal-200',
  Admin: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function Header({ subtitle, backTo, actions }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="bg-[#0f172a] text-white h-14 flex items-center justify-between px-6 sticky top-0 z-40" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
      <div className="flex items-center gap-4 min-w-0">
        {backTo && (
          <button onClick={() => navigate(backTo)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm mr-1">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s ease infinite' }} />
          <span className="font-bold text-sm tracking-tight">SmartDiet CDSS</span>
          <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.5 bg-slate-800 rounded">v3</span>
        </div>
        {subtitle && (
          <>
            <div className="w-px h-4 bg-slate-700" />
            <span className="text-slate-300 text-sm font-medium truncate">{subtitle}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${ROLE_STYLE[user?.role] || ''}`}>
          {user?.role}
        </span>
        <span className="text-slate-300 text-sm hidden sm:block">{user?.name}</span>
        <button onClick={() => { logout(); navigate('/login') }}
          className="text-slate-500 hover:text-slate-300 text-xs font-medium px-2.5 py-1.5 rounded hover:bg-slate-800 transition">
          Sign out
        </button>
      </div>
    </header>
  )
}
