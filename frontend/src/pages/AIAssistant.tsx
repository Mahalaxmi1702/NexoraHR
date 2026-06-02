import { useEffect, useRef, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  Bot,
  User,
  Send,
  Sparkles,
  Loader2,
  Lightbulb,
  Zap,
  ShieldCheck,
  Brain,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
  data_used?: string
}

const suggestions = {
  employee: [
    'How many leaves do I have left?',
    'What is my attendance status today?',
    'Do I have any missing documents?',
    'Explain leave policy',
    'Show my latest payroll status',
    'Draft a sick leave request',
  ],
  admin: [
    'Give me workforce summary',
    'Which employees are absent today?',
    'Show pending leave requests',
    'Which employees have missing documents?',
    'Analyze attendance health',
    'Generate HR action plan for K Labs',
  ],
}

export default function AIAssistant() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || 'there'}! I’m NexoraAI, your HR copilot for K Labs. I can help with leave, attendance, payroll, documents, policies, and HR insights.`,
      data_used: 'HRMS Assistant',
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickSuggestions = isAdmin ? suggestions.admin : suggestions.employee

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setInput('')
    setLoading(true)

    try {
      const res = await client.post('/ai/chat', { message: msg })

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.reply || 'I could not generate a response.',
          data_used: res.data.data_used,
        },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err.response?.data?.detail ||
            'I am unable to process this right now. Please check if the backend AI route is running.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-96px)] flex-col gap-5">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-violet-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              <Sparkles className="h-3.5 w-3.5" />
              NexoraAI Intelligence Layer
            </div>

            <h1 className="flex items-center gap-2 text-2xl font-bold">
              NexoraAI Assistant
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-blue-100">
              Ask intelligent questions about HR records, attendance, leave, payroll,
              documents, and policies.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-white/10 p-3">
              <ShieldCheck className="mb-1 h-4 w-4 text-blue-200" />
              <p className="font-semibold">Role-aware</p>
              <p className="text-blue-100">Secured by login</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3">
              <Brain className="mb-1 h-4 w-4 text-violet-200" />
              <p className="font-semibold">HR Context</p>
              <p className="text-blue-100">Database powered</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <aside className="hidden w-80 border-r border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50 lg:block">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            Try asking
          </p>

          <div className="space-y-2">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSend(suggestion)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 lg:p-6">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-violet-600'
                      : 'bg-slate-950 dark:bg-white'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white dark:text-slate-950" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm lg:max-w-[72%] ${
                    msg.role === 'user'
                      ? 'rounded-tr-md bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                      : 'rounded-tl-md border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.data_used && (
                    <p className="mt-3 flex items-center gap-1 text-xs opacity-70">
                      <Zap className="h-3 w-3" />
                      {msg.data_used}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 dark:bg-white">
                  <Bot className="h-4 w-4 text-white dark:text-slate-950" />
                </div>
                <div className="rounded-3xl rounded-tl-md border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 flex gap-2 overflow-x-auto lg:hidden">
              {quickSuggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NexoraAI anything..."
                rows={1}
                className="max-h-32 min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}