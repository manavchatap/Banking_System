import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transfer from './pages/Transfer'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAccounts from './pages/admin/AdminAccounts'

function UserRoute({ children }) {
  const { user, isSystemUser } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (isSystemUser) return <Navigate to="/admin" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, isSystemUser } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isSystemUser) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
            <Route path="/accounts"  element={<UserRoute><Accounts /></UserRoute>} />
            <Route path="/transfer"  element={<UserRoute><Transfer /></UserRoute>} />

            <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/accounts" element={<AdminRoute><AdminAccounts /></AdminRoute>} />
          </Route>

          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
