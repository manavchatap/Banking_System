import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Landmark, ArrowLeft, ShieldCheck } from 'lucide-react'
import api from '../api/axios'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import styles from './Auth.module.css'
import fpStyles from './ForgotPassword.module.css'

const STEPS = { EMAIL: 'email', OTP: 'otp', RESET: 'reset', DONE: 'done' }
const OTP_TTL = 300 // 5 minutes in seconds

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep]             = useState(STEPS.EMAIL)
  const [email, setEmail]           = useState('')
  const [otp, setOtp]               = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [countdown, setCountdown]   = useState(0)

  // OTP countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // Step 1 — send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setStep(STEPS.OTP)
      setCountdown(OTP_TTL)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 — verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp.trim()) { setError('Enter the OTP'); return }
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp })
      setResetToken(data.resetToken)
      setStep(STEPS.RESET)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 3 — reset password
  const handleReset = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword })
      setStep(STEPS.DONE)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.leftPanel}>
        <div className={styles.brandBlock}>
          <div className={styles.brandIcon}><Landmark size={28} /></div>
          <h1 className={styles.brandName}>NexaBank</h1>
        </div>
        <div className={styles.heroText}>
          <h2>Reset your<br />password</h2>
          <p>Enter your email, verify your OTP, and set a new password securely.</p>
        </div>
        <div className={styles.features}>
          {['OTP expires in 5 minutes', 'One-time use only', 'Stored securely in Redis', 'Reset token valid for 10 minutes'].map(f => (
            <div key={f} className={styles.featureItem}>
              <span className={styles.featureDot} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>

          {/* Step indicator */}
          <div className={fpStyles.steps}>
            {['Email', 'Verify OTP', 'New Password'].map((label, i) => {
              const stepKeys = [STEPS.EMAIL, STEPS.OTP, STEPS.RESET]
              const current = [STEPS.EMAIL, STEPS.OTP, STEPS.RESET, STEPS.DONE].indexOf(step)
              return (
                <div key={label} className={fpStyles.stepItem}>
                  <div className={[
                    fpStyles.stepCircle,
                    current === i ? fpStyles.stepActive : '',
                    current > i  ? fpStyles.stepDone  : '',
                  ].join(' ')}>
                    {current > i ? '✓' : i + 1}
                  </div>
                  <span className={fpStyles.stepLabel}>{label}</span>
                  {i < 2 && <div className={[fpStyles.stepLine, current > i ? fpStyles.stepLineDone : ''].join(' ')} />}
                </div>
              )
            })}
          </div>

          {/* ── Step 1: Email ── */}
          {step === STEPS.EMAIL && (
            <>
              <div className={styles.formHeader}>
                <h2>Forgot password</h2>
                <p>We'll send a 6-digit OTP to your email</p>
              </div>
              <form onSubmit={handleSendOtp} noValidate>
                <div className={styles.fields}>
                  <Input
                    label="Email address"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    icon={Mail}
                    autoComplete="email"
                    required
                  />
                </div>
                {error && <div className={styles.errorAlert}>{error}</div>}
                <Button type="submit" fullWidth loading={loading} size="lg">
                  Send OTP
                </Button>
              </form>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === STEPS.OTP && (
            <>
              <div className={styles.formHeader}>
                <h2>Enter OTP</h2>
                <p>A 6-digit code was sent to <strong>{email}</strong></p>
              </div>

              {countdown > 0 ? (
                <div className={fpStyles.countdown}>
                  <ShieldCheck size={16} />
                  OTP expires in <strong>{formatTime(countdown)}</strong>
                </div>
              ) : (
                <div className={fpStyles.expired}>OTP has expired. Go back and request a new one.</div>
              )}

              <form onSubmit={handleVerifyOtp} noValidate>
                <div className={styles.fields}>
                  <Input
                    label="6-digit OTP"
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                  />
                </div>
                {error && <div className={styles.errorAlert}>{error}</div>}
                <Button type="submit" fullWidth loading={loading} size="lg" disabled={countdown <= 0}>
                  Verify OTP
                </Button>
              </form>

              <button className={fpStyles.resendBtn} onClick={() => { setStep(STEPS.EMAIL); setOtp(''); setError('') }}>
                Didn't receive it? Go back
              </button>
            </>
          )}

          {/* ── Step 3: New password ── */}
          {step === STEPS.RESET && (
            <>
              <div className={styles.formHeader}>
                <h2>New password</h2>
                <p>Choose a strong password for your account</p>
              </div>
              <form onSubmit={handleReset} noValidate>
                <div className={styles.fields}>
                  <Input
                    label="New password"
                    id="newPassword"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError('') }}
                    icon={Lock}
                    autoComplete="new-password"
                    required
                  />
                  <Input
                    label="Confirm password"
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                    icon={Lock}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {error && <div className={styles.errorAlert}>{error}</div>}
                <Button type="submit" fullWidth loading={loading} size="lg">
                  Reset Password
                </Button>
              </form>
            </>
          )}

          {/* ── Done ── */}
          {step === STEPS.DONE && (
            <div className={fpStyles.doneWrap}>
              <div className={fpStyles.doneIcon}>✓</div>
              <h2>Password reset!</h2>
              <p>Your password has been updated successfully. You can now sign in.</p>
              <Button fullWidth size="lg" onClick={() => navigate('/login', { replace: true })}>
                Back to Sign In
              </Button>
            </div>
          )}

          {/* Back to login */}
          {step !== STEPS.DONE && (
            <button className={fpStyles.backBtn} onClick={() => navigate('/login')}>
              <ArrowLeft size={14} /> Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
