import { useEffect, useMemo, useState } from 'react'
import client from '../api/client'
import {
  Briefcase,
  Search,
  Upload,
  Star,
  PhoneCall,
  Mail,
  FileText,
  Sparkles,
  X,
  Trash2,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  Target,
  ClipboardList,
  Info,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Candidate {
  id: string
  candidate_name?: string
  name: string
  email: string
  phone: string
  role: string
  selected_role?: string
  ats_score: number
  match_percentage?: number
  match_level?: string
  recommendation?: string
  skills: string[]
  extracted_skills?: string[]
  matched_skills: string[]
  missing_skills: string[]
  resume_name: string
  status: 'New' | 'Shortlisted' | 'Called' | 'Rejected'
  summary: string
  uploaded_at: string
}

export default function Recruitment() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [roles, setRoles] = useState<string[]>([])

  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [minScore, setMinScore] = useState('')
  const [sortBy, setSortBy] = useState('ats_score')

  const [showUpload, setShowUpload] = useState(false)
  const [resumeFiles, setResumeFiles] = useState<File[]>([])
  const [targetRole, setTargetRole] = useState('AI Engineer')
  const [jobDescription, setJobDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  useEffect(() => {
    fetchRoles()
    fetchCandidates()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await client.get('/recruitment/roles')
      const apiRoles = res.data.roles || []
      setRoles(apiRoles)

      if (apiRoles.length > 0 && !targetRole) {
        setTargetRole(apiRoles[0])
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }

  const fetchCandidates = async () => {
    try {
      const params: any = {
        sort_by: sortBy,
      }

      if (roleFilter) params.role = roleFilter
      if (skillFilter) params.skill = skillFilter
      if (statusFilter) params.status = statusFilter
      if (minScore) params.min_score = minScore

      const res = await client.get('/recruitment/candidates', { params })
      setCandidates(res.data)
    } catch (err) {
      console.error('Failed to fetch candidates:', err)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [roleFilter, skillFilter, statusFilter, minScore, sortBy])

  const allSkills = useMemo(() => {
    const set = new Set<string>()

    candidates.forEach((candidate) => {
      const skills = candidate.extracted_skills || candidate.skills || []
      skills.forEach((skill) => set.add(skill))
    })

    return Array.from(set).sort()
  }, [candidates])

  const filteredCandidates = useMemo(() => {
    const q = search.toLowerCase().trim()

    return candidates.filter((candidate) => {
      if (!q) return true

      const name = candidate.candidate_name || candidate.name
      const skills = candidate.extracted_skills || candidate.skills || []

      return (
        name?.toLowerCase().includes(q) ||
        candidate.email?.toLowerCase().includes(q) ||
        candidate.role?.toLowerCase().includes(q) ||
        candidate.resume_name?.toLowerCase().includes(q) ||
        skills?.some((skill) => skill.toLowerCase().includes(q))
      )
    })
  }, [candidates, search])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (resumeFiles.length === 0) {
      alert('Please select at least one resume.')
      return
    }

    if (!targetRole) {
      alert('Please select the role you are recruiting for.')
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()

      resumeFiles.forEach((file) => {
        formData.append('files', file)
      })

      formData.append('target_role', targetRole)
      formData.append('role', targetRole)

      if (jobDescription.trim()) {
        formData.append('job_description', jobDescription.trim())
      }

      const res = await client.post('/recruitment/upload-resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadResult(res.data)
      setResumeFiles([])
      setJobDescription('')
      await fetchCandidates()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Resume upload failed')
    } finally {
      setUploading(false)
    }
  }

  const updateStatus = async (candidateId: string, status: Candidate['status']) => {
  try {
    const formData = new FormData()
    formData.append('status', status)

    await client.patch(`/recruitment/candidates/${candidateId}/status`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? { ...candidate, status }
          : candidate
      )
    )

    alert(`Candidate status updated to ${status}`)
  } catch (err: any) {
    console.error('Status update failed:', err)
    alert(err.response?.data?.detail || 'Failed to update candidate status')
  }
}

  const deleteCandidate = async (candidateId: string) => {
    if (!confirm('Delete this candidate?')) return

    try {
      await client.delete(`/recruitment/candidates/${candidateId}`)
      await fetchCandidates()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Delete failed')
    }
  }

  const getScoreStyle = (score: number) => {
    if (score >= 75) return 'from-emerald-500 to-green-600'
    if (score >= 55) return 'from-blue-600 to-violet-600'
    return 'from-amber-500 to-orange-600'
  }

  const getMatchLabel = (candidate: Candidate) => {
    if (candidate.match_level) return candidate.match_level
    if (candidate.ats_score >= 75) return 'Strong Match'
    if (candidate.ats_score >= 55) return 'Moderate Match'
    return 'Weak Match'
  }

  const averageScore =
    candidates.length > 0
      ? Math.round(candidates.reduce((sum, c) => sum + Number(c.ats_score || 0), 0) / candidates.length)
      : 0

  const topCandidates = candidates.filter((candidate) => candidate.ats_score >= 75).length

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              <Sparkles className="h-3.5 w-3.5" />
              AI Resume Screening
            </div>

            <h1 className="text-3xl font-black">Recruitment Hub</h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Select a hiring role, upload resumes, and NexoraHR calculates role-based ATS match,
              missing skills, and candidate recommendations.
            </p>
          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
          >
            <Upload className="h-4 w-4" />
            Analyze Resume
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Candidates</p>
            <Info className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{candidates.length}</p>
          <p className="mt-1 hidden text-xs text-slate-500 group-hover:block">Total resumes analyzed in this session.</p>
        </div>

        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Average ATS</p>
            <Info className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-blue-600">{averageScore}%</p>
          <p className="mt-1 hidden text-xs text-slate-500 group-hover:block">Average role-based match score.</p>
        </div>

        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Strong Matches</p>
            <Info className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-600">{topCandidates}</p>
          <p className="mt-1 hidden text-xs text-slate-500 group-hover:block">Candidates with ATS score 75% or above.</p>
        </div>

        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Shortlisted</p>
            <Info className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-violet-600">
            {candidates.filter((c) => c.status === 'Shortlisted').length}
          </p>
          <p className="mt-1 hidden text-xs text-slate-500 group-hover:block">Candidates moved to shortlist.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <Filter className="h-4 w-4 text-blue-600" />
          Filters
        </div>

        <div className="grid gap-3 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, skill, role..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">All Skills</option>
            {allSkills.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>

          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Any ATS</option>
            <option value="90">90+</option>
            <option value="80">80+</option>
            <option value="70">70+</option>
            <option value="60">60+</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ats_score">Sort by ATS</option>
            <option value="name">Sort by Name</option>
            <option value="role">Sort by Role</option>
          </select>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={fetchCandidates}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <Briefcase className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="font-bold text-slate-700 dark:text-slate-200">No candidates found</p>
          <p className="mt-1 text-sm text-slate-500">Upload resumes to generate role-based ATS scores.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredCandidates.map((candidate) => {
            const displayName = candidate.candidate_name || candidate.name || 'Candidate'
            const skills = candidate.extracted_skills || candidate.skills || []
            const score = Number(candidate.match_percentage || candidate.ats_score || 0)

            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-950 dark:text-white">
                      {displayName}
                    </h3>

                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Target className="h-4 w-4" />
                      {candidate.selected_role || candidate.role}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          candidate.status === 'Shortlisted'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : candidate.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                            : candidate.status === 'Called'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {candidate.status}
                      </span>

                      <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                        {getMatchLabel(candidate)}
                      </span>
                    </div>
                  </div>

                  <div className={`rounded-3xl bg-gradient-to-r ${getScoreStyle(score)} px-4 py-3 text-center text-white shadow-lg`}>
                    <p className="text-xs opacity-80">ATS Match</p>
                    <p className="text-3xl font-black">{score}%</p>
                  </div>
                </div>

                <div className="mb-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {candidate.email || 'No email found'}
                  </p>

                  <p className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-slate-400" />
                    {candidate.phone || 'No phone found'}
                  </p>

                  <p className="flex items-center gap-2 md:col-span-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    {candidate.resume_name}
                  </p>
                </div>

                <div className="mb-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500">ATS Match</span>
                    <span className="font-bold">{score}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreStyle(score)}`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    Extracted Skills
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {skills.length > 0 ? (
                      skills.slice(0, 16).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No clear skills detected</span>
                    )}
                  </div>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                    <p className="mb-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
                      Matched Skills
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      {candidate.matched_skills?.length
                        ? candidate.matched_skills.join(', ')
                        : 'No role-specific matches'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-900/20">
                    <p className="mb-2 text-xs font-black text-amber-700 dark:text-amber-300">
                      Missing Skills
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {candidate.missing_skills?.length
                        ? candidate.missing_skills.slice(0, 10).join(', ')
                        : 'None'}
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <p className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <ClipboardList className="h-4 w-4 text-blue-600" />
                    AI Recommendation
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {candidate.summary || 'No summary available'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus(candidate.id, 'Shortlisted')}
                    className="flex-1 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
                  >
                    Shortlist
                  </button>

                  <button
                    onClick={() => updateStatus(candidate.id, 'Called')}
                    className="flex-1 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"
                  >
                    Call
                  </button>

                  <button
                    onClick={() => updateStatus(candidate.id, 'Rejected')}
                    className="flex-1 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => deleteCandidate(candidate.id)}
                    className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showUpload && (
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
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    Analyze Resumes
                  </h2>
                  <p className="text-sm text-slate-500">
                    Choose the hiring role first. ATS score will be calculated based on that role.
                  </p>
                </div>

                <button onClick={() => setShowUpload(false)}>
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Recruiting for role
                  </label>

                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs text-slate-500">
                    Example: AI Engineer will check Python, ML, NLP, LLM, LangChain, RAG, FAISS, TensorFlow, PyTorch, and related skills.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Job description optional
                  </label>

                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={5}
                    placeholder="Paste job description here. NexoraHR will use it to improve skill matching..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
                  <Upload className="mx-auto mb-3 h-10 w-10 text-blue-600" />

                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    multiple
                    onChange={(e) => setResumeFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-bold file:text-white"
                    required
                  />

                  <p className="mt-3 text-xs text-slate-500">
                    Selected files: {resumeFiles.length}
                  </p>
                </div>

                <button
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 font-bold text-white disabled:opacity-60"
                >
                  <Star className="h-4 w-4" />
                  {uploading ? 'Analyzing resumes...' : 'Generate Role-Based ATS Scores'}
                </button>
              </form>

              {uploadResult && (
                <div className="mt-5 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    {uploadResult.failed_count > 0 ? (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                    Resume Processing Completed
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Processed: {uploadResult.processed_count}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Failed: {uploadResult.failed_count}
                  </p>

                  {uploadResult.failed?.length > 0 && (
                    <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                      {uploadResult.failed.map((f: any) => (
                        <p key={f.filename}>
                          {f.filename}: {f.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}