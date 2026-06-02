import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  id: number
  email: string
  name: string
  role: string
  department: string
  designation: string
  phone: string
  employee_id: string
  status: string
  work_mode: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexora-token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me')
      setUser(res.data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    const res = await axios.post('/api/auth/login', formData)
    const newToken = res.data.access_token
    localStorage.setItem('nexora-token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    setToken(newToken)
    await fetchUser()
  }

  const logout = () => {
    localStorage.removeItem('nexora-token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
