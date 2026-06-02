import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Clock, MapPin, CheckCircle, LogOut, Calendar, AlertCircle, Users } from 'lucide-react'
import { motion } from 'framer-motion'

interface AttendanceRecord {
  id: number
  date: string
  check_in: string
  check_out: string
  work_hours: number
  status: string
  work_mode: string
  location: string
  user?: { name: string; employee_id: string }
}

export default function Attendance() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'
  const [todayStatus, setTodayStatus] = useState<any>(null)
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([])
  const [teamAttendance, setTeamAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [todayRes, myRes] = await Promise.all([
        client.get('/attendance/today'),
        client.get('/attendance/my-attendance'),
      ])
      setTodayStatus(todayRes.data)
      setMyAttendance(myRes.data)

      if (isAdmin) {
        const teamRes = await client.get('/attendance/team-attendance')
        setTeamAttendance(teamRes.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      await client.post('/attendance/check-in', { work_mode: user?.work_mode || 'onsite', location: 'Office' })
      fetchData()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Check-in failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    try {
      await client.post('/attendance/check-out')
      fetchData()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Check-out failed')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
      case 'checked_out': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      case 'late': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      case 'absent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }
  }

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>
  }

  return (
    <div className="page-container pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
        <p className="text-gray-500 dark:text-dark-muted mt-1">Track your daily attendance and work hours</p>
      </div>

      {/* Check In/Out Card */}
      {!isAdmin && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${todayStatus?.status === 'checked_out' ? 'bg-blue-100 dark:bg-blue-900/30' : todayStatus?.status === 'checked_in' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Clock className={`w-8 h-8 ${todayStatus?.status === 'checked_out' ? 'text-blue-600' : todayStatus?.status === 'checked_in' ? 'text-emerald-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {todayStatus?.status === 'checked_out' ? 'Work Completed' : todayStatus?.status === 'checked_in' ? 'Currently Working' : 'Not Checked In'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-dark-muted">
                  {todayStatus?.check_in ? `Checked in at ${new Date(todayStatus.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Start your day by checking in'}
                </p>
                {todayStatus?.work_hours > 0 && (
                  <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">
                    Work hours: {todayStatus.work_hours}h
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {!todayStatus?.check_in && (
                <button onClick={handleCheckIn} disabled={actionLoading} className="btn-primary flex items-center gap-2 py-3 px-8">
                  <CheckCircle className="w-5 h-5" />
                  {actionLoading ? 'Checking in...' : 'Check In'}
                </button>
              )}
              {todayStatus?.check_in && !todayStatus?.check_out && (
                <button onClick={handleCheckOut} disabled={actionLoading} className="btn-primary flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <LogOut className="w-5 h-5" />
                  {actionLoading ? 'Checking out...' : 'Check Out'}
                </button>
              )}
              {todayStatus?.check_out && (
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Completed
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Team Attendance (Admin) */}
      {isAdmin && teamAttendance.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Today's Team Attendance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Check In</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Check Out</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Hours</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {teamAttendance.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                          {att.user?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">{att.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">
                      {att.check_in ? new Date(att.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">
                      {att.check_out ? new Date(att.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">{att.work_hours || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(att.status)}`}>{att.status.replace('_', ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Attendance History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Check In</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Check Out</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Hours</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Mode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {myAttendance.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(att.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">
                    {att.check_in ? new Date(att.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">
                    {att.check_out ? new Date(att.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">{att.work_hours || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted capitalize">{att.work_mode}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(att.status)}`}>{att.status.replace('_', ' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {myAttendance.length === 0 && (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-dark-border mx-auto mb-3" />
            <p className="text-gray-500 dark:text-dark-muted">No attendance records yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
