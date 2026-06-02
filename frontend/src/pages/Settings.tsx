import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { User, Moon, Sun, Bell, Shield, KeyRound, Save, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Settings() {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page-container pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-dark-muted mt-1">Manage your preferences and account</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" /> Profile Information
          </h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-gray-500 dark:text-dark-muted">{user?.email}</p>
              <p className="text-xs text-primary-600 dark:text-primary-400 capitalize mt-1">{user?.role} • {user?.department}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
              <input type="text" defaultValue={user?.name} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
              <input type="tel" defaultValue={user?.phone} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
              <input type="text" defaultValue={user?.department} className="input-field" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Designation</label>
              <input type="text" defaultValue={user?.designation} className="input-field" readOnly />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" /> Appearance
          </h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-dark-bg">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-5 h-5 text-primary-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                <p className="text-sm text-gray-500 dark:text-dark-muted">Toggle between light and dark themes</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isDark ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isDark ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-500" /> Notifications
          </h3>
          <div className="space-y-3">
            {['Email notifications', 'Push notifications', 'Leave approval alerts', 'Payroll updates'].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-bg">
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                <div className="w-10 h-6 rounded-full bg-primary-600 relative cursor-pointer">
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" /> Security
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
              <input type="password" className="input-field" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
              <input type="password" className="input-field" placeholder="Enter new password" />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary flex items-center gap-2 py-3 px-8">
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
