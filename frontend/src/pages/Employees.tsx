import { useEffect, useMemo, useState } from 'react'
import client from '../api/client'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Users,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Employee {
  id: number
  name: string
  email: string
  role: string
  department: string
  designation: string
  phone: string
  employee_id: string
  status: string
  work_mode: string
}

interface ImportResult {
  message: string
  created: number
  skipped: number
  total_rows_detected: number
  default_password: string
  results: Array<any>
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  department: '',
  designation: '',
  role: 'employee',
  work_mode: 'onsite',
  status: 'active',
  phone: '',
  employee_id: '',
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)

    try {
      const res = await client.get('/employees/')
      setEmployees(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const departments = useMemo(() => {
    return [...new Set(employees.map((e) => e.department).filter(Boolean))]
  }, [employees])

  const filtered = useMemo(() => {
    return employees.filter((employee) => {
      const q = search.toLowerCase().trim()

      const matchesSearch =
        !q ||
        employee.name?.toLowerCase().includes(q) ||
        employee.email?.toLowerCase().includes(q) ||
        employee.employee_id?.toLowerCase().includes(q) ||
        employee.designation?.toLowerCase().includes(q)

      const matchesDept = !filterDept || employee.department === filterDept

      return matchesSearch && matchesDept
    })
  }, [employees, search, filterDept])

  const openCreateModal = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEditModal = (employee: Employee) => {
    setEditing(employee)
    setForm({
      name: employee.name || '',
      email: employee.email || '',
      password: '',
      department: employee.department || '',
      designation: employee.designation || '',
      role: employee.role || 'employee',
      work_mode: employee.work_mode || 'onsite',
      status: employee.status || 'active',
      phone: employee.phone || '',
      employee_id: employee.employee_id || '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (editing) {
        const payload: any = { ...form }
        delete payload.password
        await client.patch(`/employees/${editing.id}`, payload)
      } else {
        await client.post('/employees/', {
          ...form,
          password: form.password || 'password123',
        })
      }

      setShowModal(false)
      setEditing(null)
      setForm(emptyForm)
      await fetchEmployees()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      await client.delete(`/employees/${id}`)
      await fetchEmployees()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Delete failed')
    }
  }

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!importFile) {
      alert('Please choose a file to import.')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const res = await client.post('/employees/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setImportResult(res.data)
      await fetchEmployees()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Bulk import failed')
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              <Users className="h-3.5 w-3.5" />
              Workforce Control Center
            </div>
            <h1 className="text-3xl font-black">Employees</h1>
            <p className="mt-1 text-sm text-slate-300">
              Manage employees manually or import bulk employee data from CSV, Excel, PDF, DOCX, or TXT.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              <Upload className="h-4 w-4" />
              Bulk Import
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Employees</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{employees.length}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Active</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            {employees.filter((e) => e.status === 'active').length}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Departments</p>
          <p className="mt-2 text-3xl font-black text-blue-600">{departments.length}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Remote/Hybrid</p>
          <p className="mt-2 text-3xl font-black text-violet-600">
            {employees.filter((e) => e.work_mode === 'remote' || e.work_mode === 'hybrid').length}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, ID, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-56"
          >
            <option value="">All Departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <button
            onClick={fetchEmployees}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">ID</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Department</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Designation</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((employee) => (
                <tr key={employee.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-950">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white">
                        {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950 dark:text-white">{employee.name}</p>
                        <p className="text-xs text-slate-500">{employee.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{employee.employee_id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{employee.department}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{employee.designation}</td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {employee.role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                        employee.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No employees found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    {editing ? 'Edit Employee' : 'Add Employee'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {editing ? 'Update employee details' : 'Create a new employee login'}
                  </p>
                </div>

                <button onClick={() => setShowModal(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                {error && (
                  <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />

                  <input
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    placeholder="Employee ID optional"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <input
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Department"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <input
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Designation"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={form.work_mode}
                    onChange={(e) => setForm({ ...form, work_mode: e.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>

                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>

                  {!editing && (
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Password, default password123"
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">Bulk Import Employees</h2>
                  <p className="text-sm text-slate-500">
                    Upload CSV, XLSX, PDF, DOCX, or TXT containing employee details.
                  </p>
                </div>
                <button onClick={() => setShowImportModal(false)}>
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleBulkImport} className="space-y-4">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
                  <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-blue-600" />
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf,.docx,.txt"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-bold file:text-white"
                    required
                  />
                  <p className="mt-3 text-xs text-slate-500">
                    Recommended columns: name, email, department, designation, phone, role, work_mode, employee_id.
                  </p>
                </div>

                <button
                  disabled={importing}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {importing ? 'Importing...' : 'Import Employees'}
                </button>
              </form>

              {importResult && (
                <div className="mt-5 rounded-3xl bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <div className="mb-2 flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    Import Completed
                  </div>
                  <p className="text-sm">Created: {importResult.created}</p>
                  <p className="text-sm">Skipped: {importResult.skipped}</p>
                  <p className="text-sm">Rows detected: {importResult.total_rows_detected}</p>
                  <p className="mt-2 text-xs">Default password: {importResult.default_password}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}