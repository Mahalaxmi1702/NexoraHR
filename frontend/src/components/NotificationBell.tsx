import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, FileText, CalendarClock, AlertCircle } from 'lucide-react'
import client from '../api/client'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  read: boolean
}

function getIcon(type: string) {
  if (type === 'documents') return <FileText className="h-4 w-4" />
  if (type === 'attendance') return <CalendarClock className="h-4 w-4" />
  if (type === 'leave') return <AlertCircle className="h-4 w-4" />
  return <CheckCircle2 className="h-4 w-4" />
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  const unreadCount = items.filter((item) => !item.read).length

  const fetchNotifications = async () => {
    setLoading(true)

    try {
      const res = await client.get('/notifications/')
      setItems(res.data)
    } catch (err) {
      console.error('Notification fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((prev) => !prev)
          fetchNotifications()
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-white">Notifications</p>
            <p className="text-xs text-slate-500">HRMS alerts and reminders</p>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">No notifications</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-2xl p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      item.read
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                  >
                    {getIcon(item.type)}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}