import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  Users,
  CalendarCheck,
  CalendarDays,
  Wallet,
  FileText,
  Clock,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface DashboardMetrics {
  total_employees?: number
  active_employees?: number
  present_today?: number
  absent_today?: number
  pending_leaves?: number
  approved_leaves?: number
  rejected_leaves?: number
  total_payroll?: number
  total_documents?: number
  open_positions?: number
  attendance_rate?: number
  department_distribution?: Record<string, number>
  work_mode_distribution?: Record<string, number>
  attendance_trend?: any[]
  leave_summary?: Record<string, number>
  payroll_label?: string
}

interface LeaveBalance {
  total_allowed?: number
  total_used?: number
  total_remaining?: number
  balance?: Record<string, number>
  breakdown?: Record<
    string,
    {
      allowed: number
      used: number
      remaining: number
    }
  >
}

const COMPANY_WEBSITE = 'https://www.klabsindia.com/'

const emptyMetrics: DashboardMetrics = {
  total_employees: 0,
  active_employees: 0,
  present_today: 0,
  absent_today: 0,
  pending_leaves: 0,
  approved_leaves: 0,
  rejected_leaves: 0,
  total_payroll: 0,
  total_documents: 0,
  open_positions: 0,
  attendance_rate: 0,
  department_distribution: {},
  work_mode_distribution: {},
  attendance_trend: [],
  leave_summary: {},
  payroll_label: '',
}

function safeNumber(value: any): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function formatCurrency(value: any): string {
  return `₹${safeNumber(value).toLocaleString('en-IN')}`
}

function getLeaveRemaining(leaveBalance: LeaveBalance | null): number {
  if (!leaveBalance) return 0

  if (typeof leaveBalance.total_remaining === 'number') {
    return leaveBalance.total_remaining
  }

  if (leaveBalance.balance && typeof leaveBalance.balance === 'object') {
    return Object.values(leaveBalance.balance).reduce(
      (sum, value) => sum + safeNumber(value),
      0
    )
  }

  if (leaveBalance.breakdown && typeof leaveBalance.breakdown === 'object') {
    return Object.values(leaveBalance.breakdown).reduce(
      (sum, item: any) => sum + safeNumber(item?.remaining),
      0
    )
  }

  return 0
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: any
  gradient: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'

  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics)
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)

    try {
      const metricsRequest = client.get('/dashboard/metrics')
      const leaveRequest = client.get('/leave/balance')

      const [metricsRes, leaveRes] = await Promise.allSettled([
        metricsRequest,
        leaveRequest,
      ])

      if (metricsRes.status === 'fulfilled') {
        setMetrics({
          ...emptyMetrics,
          ...(metricsRes.value.data || {}),
          department_distribution:
            metricsRes.value.data?.department_distribution || {},
          work_mode_distribution:
            metricsRes.value.data?.work_mode_distribution || {},
          attendance_trend: metricsRes.value.data?.attendance_trend || [],
          leave_summary: metricsRes.value.data?.leave_summary || {},
          payroll_label: metricsRes.value.data?.payroll_label || '',
        })
      } else {
        setMetrics(emptyMetrics)
      }

      if (leaveRes.status === 'fulfilled') {
        setLeaveBalance(leaveRes.value.data || null)
      } else {
        setLeaveBalance(null)
      }
    } catch (error) {
      console.error('Dashboard fetch failed:', error)
      setMetrics(emptyMetrics)
      setLeaveBalance(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const departmentDistribution = metrics.department_distribution || {}
  const workModeDistribution = metrics.work_mode_distribution || {}
  const leaveSummary = metrics.leave_summary || {}

  const leaveRemaining = getLeaveRemaining(leaveBalance)

  const presentToday = safeNumber(metrics.present_today)
  const totalEmployees = safeNumber(metrics.total_employees)
  const attendanceRate =
    safeNumber(metrics.attendance_rate) ||
    (totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0)

  const payrollSubtitle = metrics.payroll_label || 'Total payroll value'

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading NexoraHR dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-violet-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              <Sparkles className="h-3.5 w-3.5" />
              NexoraHR Intelligence Dashboard
            </div>

            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-blue-100">
              {isAdmin
                ? 'Monitor K Labs India workforce, attendance, leave, payroll, and document activity from one place.'
                : 'Track your attendance, leave balance, payroll status, and HR updates.'}
            </p>

            <a
              href={COMPANY_WEBSITE}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-200 transition hover:text-white hover:underline"
            >
              Official K Labs India Website
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={COMPANY_WEBSITE}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4" />
              Visit K Labs India
            </a>

            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={safeNumber(metrics.total_employees)}
            subtitle={`${safeNumber(metrics.active_employees)} active employees`}
            icon={Users}
            gradient="from-blue-600 to-violet-600"
          />

          <StatCard
            title="Present Today"
            value={safeNumber(metrics.present_today)}
            subtitle={`${attendanceRate}% attendance rate`}
            icon={CalendarCheck}
            gradient="from-emerald-500 to-teal-600"
          />

          <StatCard
            title="Pending Leaves"
            value={safeNumber(metrics.pending_leaves)}
            subtitle="Waiting for HR action"
            icon={CalendarDays}
            gradient="from-amber-500 to-orange-600"
          />

          <StatCard
            title="Payroll"
            value={formatCurrency(metrics.total_payroll)}
            subtitle={payrollSubtitle}
            icon={Wallet}
            gradient="from-rose-500 to-pink-600"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Leave Balance"
            value={`${leaveRemaining} days`}
            subtitle="Regular paid leave remaining"
            icon={CalendarDays}
            gradient="from-blue-600 to-violet-600"
          />

          <StatCard
            title="Attendance Today"
            value={presentToday > 0 ? 'Marked' : 'Not marked'}
            subtitle="Check your attendance page"
            icon={Clock}
            gradient="from-emerald-500 to-teal-600"
          />

          <StatCard
            title="Documents"
            value={safeNumber(metrics.total_documents)}
            subtitle="Uploaded records"
            icon={FileText}
            gradient="from-amber-500 to-orange-600"
          />

          <StatCard
            title="Payroll"
            value={formatCurrency(metrics.total_payroll)}
            subtitle={payrollSubtitle || 'Latest payroll overview'}
            icon={Wallet}
            gradient="from-rose-500 to-pink-600"
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                HR Overview
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Key activity summary for K Labs India
              </p>
            </div>

            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-medium text-slate-500">Approved Leaves</p>
              <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                {safeNumber(metrics.approved_leaves)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-medium text-slate-500">Rejected Leaves</p>
              <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                {safeNumber(metrics.rejected_leaves)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-medium text-slate-500">Open Positions</p>
              <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                {safeNumber(metrics.open_positions)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
              Leave Summary
            </h3>

            {Object.keys(leaveSummary).length === 0 ? (
              <p className="text-sm text-slate-500">
                No leave summary available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(leaveSummary).map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="capitalize text-slate-500">
                        {key.replace('_', ' ')}
                      </span>

                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {safeNumber(value)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
                        style={{
                          width: `${Math.min(safeNumber(value) * 10, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-50 to-violet-50 p-4 dark:from-blue-950/30 dark:to-violet-950/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  K Labs India
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Official company website connected to this HRMS project.
                </p>
              </div>

              <a
                href={COMPANY_WEBSITE}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Visit Website
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Work Modes
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Employee distribution
                </p>
              </div>

              <Building2 className="h-5 w-5 text-violet-600" />
            </div>

            {Object.keys(workModeDistribution).length === 0 ? (
              <p className="text-sm text-slate-500">No work mode data yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(workModeDistribution).map(([mode, value]) => (
                  <div
                    key={mode}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950"
                  >
                    <span className="text-sm capitalize text-slate-600 dark:text-slate-300">
                      {mode}
                    </span>

                    <span className="font-bold text-slate-950 dark:text-white">
                      {safeNumber(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Departments
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Team-wise count
                </p>
              </div>

              <Users className="h-5 w-5 text-blue-600" />
            </div>

            {Object.keys(departmentDistribution).length === 0 ? (
              <p className="text-sm text-slate-500">No department data yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(departmentDistribution).map(([dept, value]) => (
                  <div
                    key={dept}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950"
                  >
                    <span className="text-sm capitalize text-slate-600 dark:text-slate-300">
                      {dept}
                    </span>

                    <span className="font-bold text-slate-950 dark:text-white">
                      {safeNumber(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">
          Quick Status
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="text-sm font-bold">System Online</p>
              <p className="text-xs opacity-80">Frontend and dashboard active</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            <Sparkles className="h-5 w-5" />
            <div>
              <p className="text-sm font-bold">NexoraAI Ready</p>
              <p className="text-xs opacity-80">Ask HR questions anytime</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="text-sm font-bold">Pending Tasks</p>
              <p className="text-xs opacity-80">
                {safeNumber(metrics.pending_leaves)} leave request(s)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}