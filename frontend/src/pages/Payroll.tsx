import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Wallet, Plus, DollarSign, X, AlertCircle, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PayrollRecord {
  id: number
  user_id: number
  month: string
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  status: string
  pay_date: string
  user?: { name: string; employee_id: string }
}

export default function Payroll() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ user_id: '', month: '', basic_salary: '', allowances: '', deductions: '', status: 'pending' })
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [isAdmin])

  const fetchData = async () => {
    try {
      if (isAdmin) {
        const [allRes, empRes] = await Promise.all([
          client.get('/payroll/all'),
          client.get('/employees/'),
        ])
        setPayrolls(allRes.data)
        setEmployees(empRes.data)
      } else {
        const res = await client.get('/payroll/my-payslips')
        setPayrolls(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await client.post('/payroll/', {
        user_id: parseInt(form.user_id),
        month: form.month,
        basic_salary: parseFloat(form.basic_salary),
        allowances: parseFloat(form.allowances) || 0,
        deductions: parseFloat(form.deductions) || 0,
        status: form.status,
      })
      setShowModal(false)
      setForm({ user_id: '', month: '', basic_salary: '', allowances: '', deductions: '', status: 'pending' })
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create payroll')
    }
  }

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>
  }

  const totalPayout = payrolls.reduce((sum, p) => sum + p.net_salary, 0)

  return (
    <div className="page-container pb-24 lg:pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isAdmin ? 'Payroll Management' : 'My Salary'}</h1>
          <p className="text-gray-500 dark:text-dark-muted mt-1">{isAdmin ? 'Manage salary records for K Labs' : 'View your salary and payslip history'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Payroll
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-gray-500 dark:text-dark-muted">Total Records</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{payrolls.length}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-gray-500 dark:text-dark-muted">Total Payout</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalPayout.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-gray-500 dark:text-dark-muted">Avg. Salary</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{payrolls.length ? Math.round(totalPayout / payrolls.length).toLocaleString() : '0'}</p>
        </div>
      </div>

      {/* Payroll List */}
      <div className="glass-card p-6">
        <div className="space-y-4">
          {payrolls.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-5 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${p.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : p.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                      {p.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{p.month}</span>
                  </div>
                  {isAdmin && p.user && (
                    <p className="text-sm text-gray-600 dark:text-dark-muted">{p.user.name} ({p.user.employee_id})</p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-dark-muted">
                    <span>Basic: ₹{p.basic_salary.toLocaleString()}</span>
                    <span>Allowances: ₹{p.allowances.toLocaleString()}</span>
                    <span>Deductions: ₹{p.deductions.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">₹{p.net_salary.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">Net Salary</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {payrolls.length === 0 && (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-gray-300 dark:text-dark-border mx-auto mb-3" />
            <p className="text-gray-500 dark:text-dark-muted">No payroll records found</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Payroll Record</h2>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Employee</label>
                  <select value={form.user_id} onChange={(e) => setForm({...form, user_id: e.target.value})} className="input-field" required>
                    <option value="">Select Employee</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Month</label>
                  <input type="text" value={form.month} onChange={(e) => setForm({...form, month: e.target.value})} className="input-field" placeholder="January 2026" required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Basic</label>
                    <input type="number" value={form.basic_salary} onChange={(e) => setForm({...form, basic_salary: e.target.value})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Allowances</label>
                    <input type="number" value={form.allowances} onChange={(e) => setForm({...form, allowances: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deductions</label>
                    <input type="number" value={form.deductions} onChange={(e) => setForm({...form, deductions: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="input-field">
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Create Record</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
