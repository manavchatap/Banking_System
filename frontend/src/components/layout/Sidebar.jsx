import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CreditCard, ArrowRightLeft,
  LogOut, Landmark, Users, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

const userNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts',  icon: CreditCard,       label: 'Accounts'  },
  { to: '/transfer',  icon: ArrowRightLeft,   label: 'Transfer'  },
]

const adminNav = [
  { to: '/admin',         icon: ShieldCheck, label: 'Admin Panel'     },
  { to: '/admin/accounts',icon: Users,       label: 'Accounts'    },
]

export default function Sidebar({ onClose }) {
  const { user, isSystemUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }) }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const navItems = isSystemUser ? adminNav : userNav

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}><Landmark size={18} /></div>
        <div>
          <span className={styles.brandName}>NexaBank</span>
          <span className={styles.brandTag}>
            {isSystemUser ? 'System Admin' : 'Personal Banking'}
          </span>
        </div>
      </div>

      <div className={styles.navSection}>
        <span className={styles.navLabel}>{isSystemUser ? 'Admin' : 'Menu'}</span>
        <nav className={styles.nav} aria-label="Main navigation">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.active : ''].join(' ')
              }
            >
              <span className={styles.navItemIcon}><Icon size={16} /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {isSystemUser && (
        <div className={styles.adminBadge}>
          <ShieldCheck size={13} />
          System Administrator
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.userRow}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userText}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Sign out">
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
