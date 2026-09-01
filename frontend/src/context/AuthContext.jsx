import { createContext, useContext, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

function parseStored() {
  try {
    const u = localStorage.getItem('bankUser')
    const s = localStorage.getItem('bankSystemUser')
    const t = localStorage.getItem('bankToken')
    return {
      user: u ? JSON.parse(u) : null,
      isSystemUser: s === 'true',
      token: t || null,
    }
  } catch {
    return { user: null, isSystemUser: false, token: null }
  }
}

export function AuthProvider({ children }) {
  const initial = parseStored()
  const [user, setUser]               = useState(initial.user)
  const [isSystemUser, setIsSystemUser] = useState(initial.isSystemUser)
  const [token, setToken]             = useState(initial.token)

  // Keep axios Authorization header in sync
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }

  const _persist = (userData, sysUser, tok) => {
    setUser(userData)
    setIsSystemUser(sysUser)
    setToken(tok)
    localStorage.setItem('bankUser', JSON.stringify(userData))
    localStorage.setItem('bankSystemUser', String(sysUser))
    if (tok) {
      localStorage.setItem('bankToken', tok)
      api.defaults.headers.common['Authorization'] = `Bearer ${tok}`
    }
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const sysUser = data.systemUser === true
    _persist(data, sysUser, data.token || null)
    return { ...data, isSystemUser: sysUser }
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    _persist(data, false, data.token || null)
    return data
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    setUser(null)
    setIsSystemUser(false)
    setToken(null)
    localStorage.removeItem('bankUser')
    localStorage.removeItem('bankSystemUser')
    localStorage.removeItem('bankToken')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, isSystemUser, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
