import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Landmark } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      navigate(result.isSystemUser ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.brandBlock}>
          <div className={styles.brandIcon}>
            <Landmark size={28} />
          </div>
          <h1 className={styles.brandName}>NexaBank</h1>
        </div>
        <div className={styles.heroText}>
          <h2>Secure & modern<br />personal banking</h2>
          <p>Manage your accounts, transfer funds, and track every transaction in one place.</p>
        </div>
        <div className={styles.features}>
          {['Double-entry ledger system', 'Real-time balance tracking', 'Idempotent transfers', 'Secure JWT auth'].map((f) => (
            <div key={f} className={styles.featureItem}>
              <span className={styles.featureDot} />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                icon={Mail}
                autoComplete="email"
                required
              />
              <Input
                label="Password"
                id="password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                icon={Lock}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.showPwd}
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPwd ? 'Hide' : 'Show'} password
              </button>
            </div>

            {error && (
              <div className={styles.errorAlert} role="alert">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign in
            </Button>
          </form>

          <div className={styles.switchAuth}>
            <Link to="/forgot-password" className={styles.link}>
              Forgot password?
            </Link>
          </div>

          <p className={styles.switchAuth}>
            Contact the bank administrator to create an account.
          </p>
        </div>
      </div>
    </div>
  )
}
