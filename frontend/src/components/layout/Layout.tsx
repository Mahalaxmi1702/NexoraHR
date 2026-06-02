import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar'
import Topbar from '../Topbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_30%)]" />

      <Sidebar />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}