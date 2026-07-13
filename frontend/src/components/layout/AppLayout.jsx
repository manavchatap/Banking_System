import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import ToastContainer from '../ui/ToastContainer'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={[styles.sidebarWrap, sidebarOpen ? styles.open : ''].join(' ')}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className={styles.main}>
        {/* Mobile header */}
        <header className={styles.mobileHeader}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className={styles.mobileTitle}>NexaBank</span>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
