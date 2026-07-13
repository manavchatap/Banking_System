import { createContext, useContext, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

function parseStored() {
  try {
    const u = localStorage.getItem('bankUser')
    const s = localStorage.getItem('bankSystemUser')
    return { user: u ? JSON.parse(u) : null, isSystemUser: s === 'true' }
  } catch {
    return { user: null, isSystemUser: false }
  }
}

async function detectSystemUser() {
  // Use native fetch — completely bypasses the axios interceptor
  // A 401 here must never trigger window.location.href redirect
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    return res.status === 400
  } catch {
    return false
  }
}

export function AuthProvider({ children }) {
  const initial = parseStored()
  const [user, setUser]               = useState(initial.user)
  const [isSystemUser, setIsSystemUser] = useState(initial.isSystemUser)

  const _persist = (userData, sysUser) => {
    setUser(userData)
    setIsSystemUser(sysUser)
    localStorage.setItem('bankUser', JSON.stringify(userData))
    localStorage.setItem('bankSystemUser', String(sysUser))
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const sysUser = await detectSystemUser()
    _persist(data, sysUser)
    return { ...data, isSystemUser: sysUser }
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    _persist(data, false)
    return data
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    setUser(null)
    setIsSystemUser(false)
    localStorage.removeItem('bankUser')
    localStorage.removeItem('bankSystemUser')
  }

  return (
    <AuthContext.Provider value={{ user, isSystemUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
