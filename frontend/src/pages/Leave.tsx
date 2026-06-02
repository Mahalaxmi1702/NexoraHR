import { useEffect, useMemo, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LeaveRecord {
  id: number
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: string
  admin_reply: string
  days: number
  created_at: string
  user?: {
    name?: string
    employee_id?: string | null
    email?: string
  }
}

interface LeaveBreakdownItem {
  allowed: number
  used: number
  remaining: number
}

interface LeaveBalance {
  year?: number
  total_allowed?: number
  total_used?: number
  total_remaining?: number
  breakdown?: Record<string, LeaveBreakdownItem>
  balance?: Record<string, number>
  special_leave_note?: Record<string, string>
}

export default function Leave() {
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin' || user?.role === 'hr'

  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [balance, setBalance] = useState<LeaveBalance | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: '',
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [replyById, setReplyById] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchData()
  }, [user?.role])

  const fetchData = async () => {
    try {
      setLoading(true)

      if (isAdmin) {
        const res = await client.get('/leave/requests')
        setLeaves(Array.isArray(res.data) ? res.data : [])
      } else {
        const [myRes, balRes] = await Promise.all([
          client.get('/leave/my-leaves'),
          client.get('/leave/balance'),
        ])

        setLeaves(Array.isArray(myRes.data) ? myRes.data : [])
        setBalance(balRes.data || null)
      }
    } catch (err: any) {
      console.error('Leave fetch failed:', err)
      alert(err.response?.data?.detail || 'Failed to load leave data')
    } finally {
      setLoading(false)
    }
  }

  const calculateDays = () => {
    if (!form.start_date || !form.end_date) return 1

    const start = new Date(form.start_date)
    const end = new Date(form.end_date)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1

    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(diff, 1)
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.start_date || !form.end_date) {
      alert('Please select start and end date')
      return
    }

    if (new Date(form.start_date) > new Date(form.end_date)) {
      alert('Start date cannot be after end date')
      return
    }

    if (!form.reason.trim()) {
      alert('Please enter reason for leave')
      return
    }

    try {
      setSubmitting(true)

      await client.post('/leave/apply', {
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason.trim(),
        days: calculateDays(),
      })

      setShowModal(false)
      setForm({
        leave_type: 'casual',
        start_date: '',
        end_date: '',
        reason: '',
      })

      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply leave')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await client.patch(`/leave/${id}/approve`, {
        admin_reply: replyById[id] || 'Approved',
      })

      setReplyById((prev) => ({ ...prev, [id]: '' }))
      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve leave')
    }
  }

  const handleReject = async (id: number) => {
    try {
      await client.patch(`/leave/${id}/reject`, {
        admin_reply: replyById[id] || 'Rejected',
      })

      setReplyById((prev) => ({ ...prev, [id]: '' }))
      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject leave')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const filteredLeaves = useMemo(() => {
    if (activeTab === 'all') return leaves
    return leaves.filter((leave) => leave.status === activeTab)
  }, [leaves, activeTab])

  const balanceCards = useMemo(() => {
    if (!balance) return []

    if (balance.breakdown) {
      return Object.entries(balance.breakdown).map(([type, data]) => ({
        type,
        allowed: data.allowed,
        used: data.used,
        remaining: data.remaining,
      }))
    }

    if (balance.balance) {
      return Object.entries(balance.balance).map(([type, remaining]) => ({
        type,
        allowed: Number(remaining),
        used: 0,
        remaining: Number(remaining),
      }))
    }

    return []
  }, [balance])

  if (loading) {
    return (
      <div className="page-container flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="page-container pb-24 lg:pb-8">
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isAdmin ? 'Leave Management' : 'My Leave'}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-dark-muted">
            {isAdmin ? 'Manage employee leave requests' : 'Apply and track your leave requests'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          {!isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Apply Leave
            </button>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="mb-8">
          {balanceCards.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {balanceCards.slice(0, 4).map((item) => (
                <div key={item.type} className="metric-card">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-violet-600">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.remaining}
                  </p>

                  <p className="text-sm capitalize text-gray-500 dark:text-dark-muted">
                    {item.type} Leave Left
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Used {item.used} / {item.allowed}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Leave balance is not available right now.
              </div>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(activeTab === status ? 'all' : status)}
              className={`metric-card text-left ${activeTab === status ? 'ring-2 ring-primary-500' : ''}`}
            >
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {leaves.filter((leave) => leave.status === status).length}
              </p>
              <p className="text-sm capitalize text-gray-500 dark:text-dark-muted">
                {status} Requests
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="glass-card p-6">
        <div className="space-y-4">
          {filteredLeaves.map((leave) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-dark-border dark:bg-dark-bg"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>

                    <span className="text-xs capitalize text-gray-500 dark:text-dark-muted">
                      {leave.leave_type} Leave
                    </span>

                    <span className="text-xs text-gray-500 dark:text-dark-muted">
                      {leave.days} day(s)
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(leave.start_date).toLocaleDateString()} → {new Date(leave.end_date).toLocaleDateString()}
                  </p>

                  <p className="mt-1 text-sm text-gray-600 dark:text-dark-muted">
                    {leave.reason || 'No reason provided'}
                  </p>

                  {leave.admin_reply && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400">
                      <CheckCircle className="h-3.5 w-3.5" />
                      HR: {leave.admin_reply}
                    </p>
                  )}

                  {isAdmin && leave.user && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
                      By: {leave.user.name || 'Employee'} {leave.user.employee_id ? `(${leave.user.employee_id})` : ''}
                    </p>
                  )}
                </div>

                {isAdmin && leave.status === 'pending' && (
                  <div className="flex min-w-[260px] flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Reply message..."
                      value={replyById[leave.id] || ''}
                      onChange={(e) =>
                        setReplyById((prev) => ({
                          ...prev,
                          [leave.id]: e.target.value,
                        }))
                      }
                      className="input-field py-2 text-sm"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(leave.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>

                      <button
                        onClick={() => handleReject(leave.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredLeaves.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-dark-border" />
            <p className="text-gray-500 dark:text-dark-muted">
              No leave records found
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-dark-card"
            >
              <div className="border-b border-gray-200 p-6 dark:border-dark-border">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Apply for Leave
                </h2>
              </div>

              <form onSubmit={handleApply} className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Leave Type
                  </label>

                  <select
                    value={form.leave_type}
                    onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="annual">Annual Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="paternity">Paternity Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>

                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Date
                    </label>

                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-dark-bg dark:text-dark-muted">
                  Total days: <span className="font-bold">{calculateDays()}</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason
                  </label>

                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="input-field min-h-[80px] resize-none"
                    placeholder="Enter reason for leave..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex-1 disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}