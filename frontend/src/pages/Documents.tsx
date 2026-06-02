import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  FolderOpen,
  Upload,
  Search,
  Trash2,
  FileText,
  X,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DocumentRecord {
  id: number
  title: string
  doc_type: string
  file_path: string
  notes: string
  created_at: string
  user_id?: number
  uploaded_by?: number
  user?: {
    name: string
    employee_id: string
  }
}

const docTypeColors: Record<string, string> = {
  resume: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  id_proof: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  contract: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  certificate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  tax_form: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export default function Documents() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'

  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    user_id: '',
    title: '',
    doc_type: 'other',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [isAdmin, filterType])

  const fetchData = async () => {
    setLoading(true)

    try {
      const params: any = {}

      if (filterType) params.doc_type = filterType
      if (search.trim()) params.search = search.trim()

      const res = await client.get('/documents/', { params })
      setDocs(res.data)

      if (isAdmin) {
        const empRes = await client.get('/employees/')
        setEmployees(empRes.data)
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      alert('Please choose a file to upload.')
      return
    }

    if (!form.title.trim()) {
      alert('Please enter a document title.')
      return
    }

    const targetUserId = isAdmin ? form.user_id : String(user?.id)

    if (!targetUserId) {
      alert('Please select an employee.')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('user_id', targetUserId)
      formData.append('title', form.title.trim())
      formData.append('doc_type', form.doc_type)
      formData.append('notes', form.notes.trim())
      formData.append('file', selectedFile)

      await client.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setShowModal(false)
      setSelectedFile(null)
      setForm({
        user_id: '',
        title: '',
        doc_type: 'other',
        notes: '',
      })

      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (doc: DocumentRecord) => {
  try {
    const response = await client.get(`/documents/${doc.id}/download`, {
      responseType: 'blob',
    })

    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const blob = new Blob([response.data], { type: contentType })
    const blobUrl = window.URL.createObjectURL(blob)

    const extension =
      contentType.includes('pdf') ? '.pdf' :
      contentType.includes('image/png') ? '.png' :
      contentType.includes('image/jpeg') ? '.jpg' :
      contentType.includes('word') ? '.docx' :
      ''

    const safeTitle = doc.title?.replace(/[^a-z0-9_\- ]/gi, '_') || 'document'

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = safeTitle.endsWith(extension) ? safeTitle : `${safeTitle}${extension}`
    document.body.appendChild(link)
    link.click()

    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (err: any) {
    alert(err.response?.data?.detail || 'Unable to download document')
  }
}

  const handleView = async (doc: DocumentRecord) => {
  try {
    const response = await client.get(`/documents/${doc.id}/download`, {
      responseType: 'blob',
    })

    const contentType = response.headers['content-type'] || 'application/pdf'
    const blob = new Blob([response.data], { type: contentType })
    const blobUrl = window.URL.createObjectURL(blob)

    window.open(blobUrl, '_blank')
  } catch (err: any) {
    alert(err.response?.data?.detail || 'Unable to open document')
  }
}

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this document?')) return

    try {
      await client.delete(`/documents/${id}`)
      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Delete failed')
    }
  }

  return (
    <div className="min-h-[calc(100vh-90px)] space-y-6 pb-24 lg:pb-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-violet-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              <FolderOpen className="h-3.5 w-3.5" />
              NexoraHR Document Vault
            </div>
            <h1 className="text-2xl font-bold">
              {isAdmin ? 'Employee Documents' : 'My Documents'}
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              {isAdmin
                ? 'View, upload, and manage employee records securely.'
                : 'Upload and access your employment documents.'}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:scale-[1.02]"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-48"
          >
            <option value="">All Types</option>
            <option value="resume">Resume</option>
            <option value="id_proof">ID Proof</option>
            <option value="contract">Contract</option>
            <option value="certificate">Certificate</option>
            <option value="tax_form">Tax Form</option>
            <option value="other">Other</option>
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
          >
            Search
          </button>

          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex min-h-[45vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <FolderOpen className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">No documents found</p>
          <p className="mt-1 text-sm text-slate-500">Upload a document to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-md">
                  <FileText className="h-6 w-6 text-white" />
                </div>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h3 className="mb-2 truncate text-base font-bold text-slate-900 dark:text-white">
                {doc.title}
              </h3>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    docTypeColors[doc.doc_type] || docTypeColors.other
                  }`}
                >
                  {doc.doc_type.replace('_', ' ')}
                </span>
              </div>

              {isAdmin && doc.user && (
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                  {doc.user.name} ({doc.user.employee_id})
                </p>
              )}

              <p className="min-h-[36px] text-sm text-slate-500 line-clamp-2 dark:text-slate-400">
                {doc.notes || 'No notes added.'}
              </p>

              <p className="mt-4 text-xs text-slate-400">
                Uploaded on {new Date(doc.created_at).toLocaleDateString()}
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => handleView(doc)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>

                <button
                  onClick={() => handleDownload(doc)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Upload Document
                  </h2>
                  <p className="text-sm text-slate-500">Add employee document record</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4 p-6">
                {isAdmin && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Employee
                    </label>
                    <select
                      value={form.user_id}
                      onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Document title"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Document Type
                  </label>
                  <select
                    value={form.doc_type}
                    onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="resume">Resume</option>
                    <option value="id_proof">ID Proof</option>
                    <option value="contract">Contract</option>
                    <option value="certificate">Certificate</option>
                    <option value="tax_form">Tax Form</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="min-h-[80px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Optional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload'}
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