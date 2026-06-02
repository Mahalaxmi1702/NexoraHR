import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { ArrowRight, Sparkles, Shield, Zap, BarChart3, Users, Calendar, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const { isDark } = useTheme()

  const features = [
    { icon: Users, title: 'Employee Management', desc: 'Complete employee lifecycle management from onboarding to offboarding.' },
    { icon: Calendar, title: 'Smart Attendance', desc: 'AI-powered attendance tracking with check-in/out and health scoring.' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time insights into workforce metrics and attendance trends.' },
    { icon: Wallet, title: 'Payroll Automation', desc: 'Streamlined salary processing with automated calculations.' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Secure multi-role system with admin, HR, manager, and employee views.' },
    { icon: Zap, title: 'AI Assistant', desc: 'NexoraAI answers HR questions using real company data.' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      {/* Hero */}
      <nav className="px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">NexoraHR</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-600 dark:text-dark-muted hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="px-6 lg:px-12 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered HRMS for Modern Teams
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Transform Your <span className="gradient-text">Workforce</span><br />
            Management Experience
          </h1>
          <p className="text-lg text-gray-600 dark:text-dark-muted max-w-2xl mx-auto mb-10">
            NexoraHR is the intelligent HR platform powering K Labs India, Chennai. 
            Streamline attendance, leave, payroll, and documents with AI-driven insights.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2 text-lg">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary text-lg">
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="glass-card-strong p-2 lg:p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {[
                { label: 'Total Employees', value: '156', color: 'bg-blue-500' },
                { label: 'Present Today', value: '142', color: 'bg-emerald-500' },
                { label: 'Pending Leaves', value: '8', color: 'bg-amber-500' },
                { label: 'Attendance Health', value: '94%', color: 'bg-violet-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-50 dark:bg-dark-bg rounded-xl p-4 text-left">
                  <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 py-20 bg-gray-50 dark:bg-dark-bg/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything You Need</h2>
            <p className="text-gray-600 dark:text-dark-muted">A complete HR ecosystem built for scale</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-dark-muted">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card-strong p-12 bg-gradient-to-br from-primary-600/10 to-violet-600/10 dark:from-primary-900/20 dark:to-violet-900/20">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Transform HR?</h2>
            <p className="text-gray-600 dark:text-dark-muted mb-8">Join K Labs and hundreds of companies using NexoraHR</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-lg">Create Account</Link>
              <Link to="/login" className="btn-secondary text-lg">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 border-t border-gray-200 dark:border-dark-border text-center">
        <p className="text-sm text-gray-500 dark:text-dark-muted">
          © 2026 NexoraHR. Built for K Labs India, Chennai.
        </p>
      </footer>
    </div>
  )
}
