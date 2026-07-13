import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Landmark } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import styles from './Auth.module.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((e2) => ({ ...e2, [e.target.name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.')
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
          <h2>Start your banking<br />journey today</h2>
          <p>Open your account in seconds and enjoy full-featured digital banking.</p>
        </div>
        <div className={styles.features}>
          {['Free to open', 'INR currency support', 'Instant transfers', 'Email confirmation'].map((f) => (
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
            <h2>Create account</h2>
            <p>Join NexaBank — it's free</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>
              <Input
                label="Full name"
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                icon={User}
                error={errors.name}
                autoComplete="name"
                required
              />
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                icon={Mail}
                error={errors.email}
                autoComplete="email"
                required
              />
              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                icon={Lock}
                error={errors.password}
                helper="Must be at least 6 characters"
                autoComplete="new-password"
                required
              />
            </div>

            {serverError && (
              <div className={styles.errorAlert} role="alert">
                {serverError}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              Create account
            </Button>
          </form>

          <p className={styles.switchAuth}>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
