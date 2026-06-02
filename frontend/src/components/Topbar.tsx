import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Moon, Sun, Search, Menu, X } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function Topbar() {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const isAdmin = user?.role === 'admin' || user?.role === 'hr'

  const runSearch = () => {
    const q = searchText.trim()

    if (!q) return

    if (isAdmin) {
      navigate(`/employees?search=${encodeURIComponent(q)}`)
    } else {
      navigate(`/documents?search=${encodeURIComponent(q)}`)
    }

    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-md">
              <span className="text-sm font-bold text-white">N</span>
            </div>
          </div>

          <div className="hidden min-w-0 sm:block">
            <h2 className="truncate text-lg font-semibold text-slate-800 dark:text-white">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              NexoraHR workspace · {user?.role || 'employee'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`relative transition-all duration-300 ${searchOpen ? 'w-72' : 'w-10'}`}>
            {searchOpen ? (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                <Search className="h-4 w-4 text-slate-400" />

                <input
                  type="text"
                  placeholder={isAdmin ? 'Search employees...' : 'Search documents...'}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runSearch()
                  }}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white"
                  autoFocus
                />

                <button type="button" onClick={runSearch} title="Search">
                  <Search className="h-4 w-4 text-blue-600" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false)
                    setSearchText('')
                  }}
                  title="Close search"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <NotificationBell />

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}