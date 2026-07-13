import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw, Zap, Search, CheckCircle, UserPlus } from 'lucide-react'
import api from '../../api/axios'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { showToast } from '../../components/ui/ToastContainer'
import styles from './Admin.module.css'

function generateKey() {
  return `sys-fund-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(n)
}

/* ── Register customer panel ─────────────────────────────────── */
function RegisterCustomerPanel({ onDone }) {
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    if (!created) return
    const t = setTimeout(() => setCreated(null), 6000)
    return () => clearTimeout(t)
  }, [created])

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name     = 'Name is required'
    if (!form.email.trim()) e.email    = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)     e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Min 6 characters'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      setCreated(data)
      setForm({ name: '', email: '', password: '' })
      setErrors({})
      showToast(`Customer "${data.name}" registered!`, 'success')
      onDone()
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Register New Customer</CardTitle></CardHeader>
      <div className={styles.panelBody}>
        <p className={styles.panelNote}>
          Creates a new customer login. After registering, the customer can log in
          and open their bank account from their dashboard.
        </p>

        <Input
          label="Full Name"
          placeholder="John Doe"
          value={form.name}
          onChange={e => { setForm(f => ({...f, name: e.target.value})); setErrors(er => ({...er, name: ''})) }}
          error={errors.name}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="customer@example.com"
          value={form.email}
          onChange={e => { setForm(f => ({...f, email: e.target.value})); setErrors(er => ({...er, email: ''})) }}
          error={errors.email}
        />
        <Input
          label="Temporary Password"
          type="password"
          placeholder="Min. 6 characters"
          value={form.password}
          onChange={e => { setForm(f => ({...f, password: e.target.value})); setErrors(er => ({...er, password: ''})) }}
          error={errors.password}
          helper="Share this with the customer so they can log in"
        />

        {created && (
          <div className={styles.successBox}>
            <CheckCircle size={16} />
            <div>
              <strong>Customer registered successfully</strong>
              <p>Name: {created.name} · Email: {created.email}</p>
              <p>They can now log in and open their bank account.</p>
            </div>
          </div>
        )}

        <Button fullWidth onClick={handleSubmit} loading={loading}>
          <UserPlus size={14} /> Register Customer
        </Button>
      </div>
    </Card>
  )
}

/* ── Fund account panel ─────────────────────────────────────── */
function FundPanel({ onFunded }) {
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount]       = useState('')
  const [ikey, setIkey]           = useState(generateKey())
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)

  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => setResult(null), 5000)
    return () => clearTimeout(t)
  }, [result])

  const handleFund = async () => {
    if (!toAccount.trim()) { showToast('Enter the destination account ID', 'warning'); return }
    if (!amount || Number(amount) <= 0) { showToast('Enter a valid amount', 'warning'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/transactions/system/initial-funds', {
        toAccount: toAccount.trim(),
        amount: Number(amount),
        idempotencyKey: ikey,
      })
      setResult(data.transaction)
      showToast(`${formatINR(Number(amount))} added successfully!`, 'success')
      setToAccount('')
      setAmount('')
      setIkey(generateKey())
      onFunded()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add funds', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Add Initial Funds</CardTitle></CardHeader>
      <div className={styles.panelBody}>
        <p className={styles.panelNote}>
          Credits funds from the system account into a customer's account.
          The customer must share their <strong>Account ID</strong> with you first.
        </p>

        <Input
          label="Customer Account ID"
          placeholder="Paste the full account ObjectId…"
          value={toAccount}
          onChange={e => setToAccount(e.target.value)}
          icon={Search}
          helper="The customer's full MongoDB ObjectId — visible on their Accounts page"
        />

        <Input
          label="Amount (INR)"
          type="number"
          placeholder="e.g. 10000"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min="1"
          step="0.01"
        />

        <div className={styles.idempotencyBox}>
          <div className={styles.idempotencyRow}>
            <span className={styles.fieldLabel}>Reference Key</span>
            <button className={styles.regenBtn} onClick={() => setIkey(generateKey())}>
              Regenerate
            </button>
          </div>
          <div className={styles.idempotencyVal}>
            <Zap size={13} />
            <code>{ikey}</code>
          </div>
          <p className={styles.helperText}>Prevents duplicate transactions on retry</p>
        </div>

        {result && (
          <div className={styles.successBox}>
            <CheckCircle size={16} />
            <div>
              <strong>Funds added — transaction completed</strong>
              <p>Transaction ID: <code>{result._id}</code></p>
              <p>Amount: <strong>{formatINR(result.amount)}</strong> · Status: {result.status}</p>
            </div>
          </div>
        )}

        <Button fullWidth onClick={handleFund} loading={loading}>
          <Zap size={14} /> Add Funds
        </Button>
      </div>
    </Card>
  )
}

/* ── Main page ─────────────────────────────────────────────── */
export default function AdminAccounts() {
  const [searchParams] = useSearchParams()
  const [activePanel, setActivePanel] = useState(searchParams.get('panel') || null)
  const [sysAccount, setSysAccount]   = useState(null)
  const [loading, setLoading]         = useState(true)

  const fetchSysAccount = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    try {
      const { data } = await api.get('/accounts')
      setSysAccount(data.accounts[0] ?? null)
      if (isRefresh) showToast('Refreshed', 'success')
    } catch {
      showToast('Failed to load system account', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSysAccount() }, [fetchSysAccount])

  const togglePanel = (name) => setActivePanel(p => p === name ? null : name)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customer Management</h1>
          <p className={styles.subtitle}>Register customers and add initial funds</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" onClick={() => fetchSysAccount(true)}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button
            size="sm"
            variant={activePanel === 'register' ? 'secondary' : 'primary'}
            onClick={() => togglePanel('register')}
          >
            <UserPlus size={14} />
            {activePanel === 'register' ? 'Close' : 'Register Customer'}
          </Button>
          <Button
            size="sm"
            variant={activePanel === 'fund' ? 'secondary' : 'primary'}
            onClick={() => togglePanel('fund')}
          >
            <Zap size={14} />
            {activePanel === 'fund' ? 'Close' : 'Add Funds'}
          </Button>
        </div>
      </div>

      {/* System account strip */}
      {loading ? <Spinner center /> : (
        <Card padding="sm">
          <div className={styles.sysAccountMini}>
            <div className={styles.sysAccountMiniLeft}>
              <p className={styles.sysAccountLabel}>System Account</p>
              {sysAccount ? (
                <p className={styles.sysAccountId}>
                  ···{sysAccount._id.slice(-12).toUpperCase()}
                </p>
              ) : (
                <p className={styles.noAccountText}>No system account found</p>
              )}
            </div>
            {sysAccount && <Badge label={sysAccount.status} />}
          </div>
        </Card>
      )}

      {/* Panels */}
      {activePanel === 'register' && (
        <RegisterCustomerPanel onDone={() => { fetchSysAccount(true); setActivePanel(null) }} />
      )}
      {activePanel === 'fund' && (
        <FundPanel onFunded={() => fetchSysAccount(true)} />
      )}

      {/* Workflow — shown when no panel is open */}
      {!activePanel && (
        <Card>
          <CardHeader><CardTitle>Workflow</CardTitle></CardHeader>
          <div className={styles.howItWorks}>
            {[
              {
                step: '1',
                title: 'Register the customer',
                desc: 'Click "Register Customer", enter their name, email and a temporary password.',
              },
              {
                step: '2',
                title: 'Customer opens their bank account',
                desc: 'The customer logs in and creates their account from their dashboard.',
              },
              {
                step: '3',
                title: 'Customer shares their Account ID',
                desc: 'The Account ID is shown on the customer\'s Accounts page.',
              },
              {
                step: '4',
                title: 'Add initial funds',
                desc: 'Click "Add Funds", paste the Account ID and enter the opening balance amount.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className={styles.howStep}>
                <div className={styles.howStepNum}>{step}</div>
                <div>
                  <p className={styles.howStepTitle}>{title}</p>
                  <p className={styles.howStepDesc}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
