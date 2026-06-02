import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  Wallet,
  FileText,
  Bot,
  Settings,
  LogOut,
  Briefcase,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: any
  adminOnly?: boolean
}

const COMPANY_WEBSITE = 'https://www.klabsindia.com/'

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', path: '/employees', icon: Users, adminOnly: true },
  { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { label: 'Leave', path: '/leave', icon: CalendarDays },
  { label: 'Payroll', path: '/payroll', icon: Wallet },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Recruitment', path: '/recruitment', icon: Briefcase, adminOnly: true },
  { label: 'AI Assistant', path: '/ai', icon: Bot },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <img
                src="/logo.jpeg"
                alt="NexoraHR"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">
                NexoraHR
              </h1>

              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                K Labs India HRMS
              </p>

              <a
                href={COMPANY_WEBSITE}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1 truncate text-xs font-bold text-blue-600 transition hover:underline dark:text-blue-300"
              >
                klabsindia.com
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-4 rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 p-4 text-white shadow-lg shadow-blue-950/20">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-bold">NexoraAI Ready</p>
            </div>

            <p className="text-xs leading-relaxed text-blue-100">
              Ask HR questions about leave, attendance, payroll, documents, and employees.
            </p>

            <a
              href={COMPANY_WEBSITE}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/25"
            >
              K Labs India
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <nav className="space-y-1.5">
            {visibleNavItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-950/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white',
                    ].join(' ')
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {user?.name || 'User'}
            </p>

            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user?.email || 'user@nexorahr.com'}
            </p>

            <p className="mt-2 inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {user?.role || 'employee'}
            </p>
          </div>

          <a
            href={COMPANY_WEBSITE}
            target="_blank"
            rel="noreferrer"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            <ExternalLink className="h-4 w-4" />
            Company Website
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/30"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}