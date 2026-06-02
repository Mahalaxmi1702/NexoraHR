import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  Loader2,
  ShieldCheck,
  Users,
  UserRound,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type LoginMode = 'admin' | 'hr' | 'employee'

const COMPANY_WEBSITE = 'https://www.klabsindia.com/'

const demoAccounts = {
  admin: {
    label: 'Admin Login',
    subtitle: 'Full control over HRMS, employees, payroll, recruitment, and AI insights.',
    email: 'admin@nexorahr.com',
    password: 'Admin@123',
    icon: ShieldCheck,
    gradient: 'from-blue-600 to-violet-600',
  },
  hr: {
    label: 'HR Login',
    subtitle: 'Manage employees, recruitment, leave approvals, attendance, and HR workflows.',
    email: 'hr@nexorahr.com',
    password: 'Hr@123',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-600',
  },
  employee: {
    label: 'Employee Login',
    subtitle: 'Check attendance, apply leave, view payroll, documents, and ask AI assistant.',
    email: 'employee@nexorahr.com',
    password: 'Employee@123',
    icon: UserRound,
    gradient: 'from-orange-500 to-rose-600',
  },
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [mode, setMode] = useState<LoginMode>('admin')
  const [email, setEmail] = useState(demoAccounts.admin.email)
  const [password, setPassword] = useState(demoAccounts.admin.password)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quickLoading, setQuickLoading] = useState<LoginMode | null>(null)
  const [error, setError] = useState('')

  const selectMode = (selectedMode: LoginMode) => {
    setMode(selectedMode)
    setEmail(demoAccounts[selectedMode].email)
    setPassword(demoAccounts[selectedMode].password)
    setError('')
  }

  const doLogin = async (
    loginEmail: string,
    loginPassword: string,
    selectedMode?: LoginMode
  ) => {
    setError('')

    if (selectedMode) {
      setQuickLoading(selectedMode)
    } else {
      setLoading(true)
    }

    try {
      await login(loginEmail, loginPassword)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
      setQuickLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await doLogin(email, password)
  }

  const current = demoAccounts[mode]

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.35),transparent_35%)]" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden items-center justify-center p-10 lg:flex">
          <div className="max-w-xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded-3xl bg-white/10 p-4 backdrop-blur-xl">
              <img
                src="/logo.jpeg"
                alt="NexoraHR"
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <div>
                <h1 className="text-3xl font-black tracking-tight">NexoraHR</h1>
                <p className="text-sm text-blue-100">AI-Powered HRMS for K Labs India</p>

                <a
                  href={COMPANY_WEBSITE}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-200 transition hover:text-white hover:underline"
                >
                  Visit K Labs India
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <h2 className="text-5xl font-black leading-tight">
              Role-based access.
              <span className="block bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">
                Smarter HR control.
              </span>
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-slate-300">
              Separate login experiences for Admin, HR, and Employees with secure access
              to attendance, leave, payroll, recruitment, documents, and AI assistance.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {['Admin Panel', 'HR Console', 'Employee Portal'].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl bg-white/10 p-4 text-sm font-semibold backdrop-blur-xl"
                >
                  <Sparkles className="mb-2 h-5 w-5 text-blue-300" />
                  {item}
                </div>
              ))}
            </div>

            <a
              href={COMPANY_WEBSITE}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4" />
              Official K Labs India Website
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center p-5">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-white">
            <div className="mb-6 text-center">
              <img
                src="/logo.jpeg"
                alt="NexoraHR Logo"
                className="mx-auto mb-4 h-20 w-20 rounded-3xl object-cover shadow-lg"
              />

              <h2 className="text-2xl font-black">Login to NexoraHR</h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose Admin, HR, or Employee login
              </p>

              <a
                href={COMPANY_WEBSITE}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"
              >
                K Labs India
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              {(Object.keys(demoAccounts) as LoginMode[]).map((item) => {
                const account = demoAccounts[item]
                const Icon = account.icon
                const active = mode === item

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectMode(item)}
                    className={[
                      'rounded-3xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-lg',
                      active
                        ? 'border-blue-500 bg-blue-50 shadow-lg dark:border-blue-400 dark:bg-blue-950/40'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950',
                    ].join(' ')}
                  >
                    <div
                      className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r ${account.gradient} text-white`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <p className="text-sm font-black">{account.label}</p>

                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {account.subtitle}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className={`mb-5 rounded-3xl bg-gradient-to-r ${current.gradient} p-4 text-white shadow-lg`}>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                <div>
                  <p className="text-sm font-black">{current.label}</p>
                  <p className="text-xs text-white/80">{current.email}</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              {(Object.keys(demoAccounts) as LoginMode[]).map((item) => {
                const account = demoAccounts[item]

                return (
                  <button
                    key={item}
                    type="button"
                    disabled={quickLoading !== null || loading}
                    onClick={() => doLogin(account.email, account.password, item)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {quickLoading === item
                      ? 'Logging in...'
                      : `Demo ${account.label.replace(' Login', '')}`}
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={current.email}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Enter password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || quickLoading !== null}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${current.gradient} px-4 py-3 font-bold text-white shadow-lg shadow-blue-950/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {loading ? 'Signing in...' : `Sign in as ${current.label.replace(' Login', '')}`}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              New employee?{' '}
              <Link to="/register" className="font-bold text-blue-600">
                Create account
              </Link>
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                Demo passwords: Admin@123, Hr@123, Employee@123
              </div>

              <a
                href={COMPANY_WEBSITE}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300"
              >
                Visit K Labs India Website
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}