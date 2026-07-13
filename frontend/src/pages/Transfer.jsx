import { useState, useEffect, useCallback } from 'react'
import {
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Info,
  Zap,
} from 'lucide-react'
import api from '../api/axios'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { showToast } from '../components/ui/ToastContainer'
import styles from './Transfer.module.css'

function generateIdempotencyKey() {
  return `txn-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
}

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const STATUS_STEPS = ['PENDING', 'COMPLETED']

export default function Transfer() {
  const [accounts, setAccounts] = useState([])
  const [balances, setBalances] = useState({})
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const [form, setForm] = useState({
    toAccount: '',
    amount: '',
    idempotencyKey: generateIdempotencyKey(),
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { success, data, message }
  const [step, setStep] = useState('form') // 'form' | 'confirm' | 'processing' | 'done'

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    try {
      const { data } = await api.get('/accounts')
      setAccounts(data.accounts)
      const bals = {}
      await Promise.allSettled(
        data.accounts.map(async (acc) => {
          const res = await api.get(`/accounts/balance/${acc._id}`)
          bals[acc._id] = res.data.balance
        })
      )
      setBalances(bals)
    } catch {
      showToast('Failed to load accounts', 'error')
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE')
  const fromAccount = activeAccounts[0] // Backend auto-selects first account
  const fromBalance = fromAccount ? (balances[fromAccount._id] ?? 0) : 0

  const validate = () => {
    const errs = {}
    if (!form.toAccount.trim()) errs.toAccount = 'Recipient account ID is required'
    else if (form.toAccount.trim() === fromAccount?._id) errs.toAccount = 'Cannot transfer to your own account'
    if (!form.amount) errs.amount = 'Amount is required'
    else if (isNaN(form.amount) || Number(form.amount) <= 0) errs.amount = 'Enter a valid amount greater than 0'
    else if (Number(form.amount) > fromBalance) errs.amount = `Insufficient balance. Available: ${formatINR(fromBalance)}`
    return errs
  }

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((er) => ({ ...er, [e.target.name]: '' }))
  }

  const handleReview = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setStep('confirm')
  }

  const handleConfirm = async () => {
    setStep('processing')
    setSubmitting(true)
    try {
      const { data } = await api.post('/transactions', {
        toAccount: form.toAccount.trim(),
        amount: Number(form.amount),
        idempotencyKey: form.idempotencyKey,
      })
      setResult({ success: true, data: data.data, message: data.message })
      setStep('done')
      showToast('Transfer completed successfully!', 'success')
    } catch (err) {
      const msg = err.response?.data?.message || 'Transfer failed. Please try again.'
      setResult({ success: false, message: msg })
      setStep('done')
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewTransfer = () => {
    setForm({ toAccount: '', amount: '', idempotencyKey: generateIdempotencyKey() })
    setErrors({})
    setResult(null)
    setStep('form')
  }

  if (loadingAccounts) return <Spinner center />

  if (activeAccounts.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Transfer Funds</h1>
        </div>
        <Card>
          <div className={styles.noAccount}>
            <AlertCircle size={40} />
            <h3>No active accounts</h3>
            <p>You need at least one active account to send money.</p>
            <Button onClick={() => navigate('/accounts')}>
              Go to Accounts
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Transfer Funds</h1>
          <p className={styles.subtitle}>Send money to any account instantly</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Main card */}
        <div className={styles.mainCol}>
          {step === 'form' && (
            <Card>
              <CardHeader>
                <CardTitle>New Transfer</CardTitle>
                <div className={styles.stepIndicator}>
                  <span className={[styles.stepDot, styles.active].join(' ')} />
                  <span className={styles.stepLine} />
                  <span className={styles.stepDot} />
                  <span className={styles.stepLine} />
                  <span className={styles.stepDot} />
                </div>
              </CardHeader>

              <form onSubmit={handleReview} noValidate>
                {/* From account */}
                <div className={styles.section}>
                  <label className={styles.fieldLabel}>From Account</label>
                  <div className={styles.fromCard}>
                    <div className={styles.fromCardLeft}>
                      <div className={styles.fromIcon}>
                        <ArrowRightLeft size={18} />
                      </div>
                      <div>
                        <p className={styles.fromId}>···{fromAccount._id.slice(-10).toUpperCase()}</p>
                        <p className={styles.fromBal}>
                          Available: <strong>{formatINR(fromBalance)}</strong>
                        </p>
                      </div>
                    </div>
                    <Badge label={fromAccount.status} />
                  </div>
                </div>

                <div className={styles.divider}>
                  <div className={styles.dividerLine} />
                  <div className={styles.dividerIcon}>
                    <ArrowRightLeft size={16} />
                  </div>
                  <div className={styles.dividerLine} />
                </div>

                {/* To account */}
                <div className={styles.section}>
                  <Input
                    label="Recipient Account ID"
                    id="toAccount"
                    name="toAccount"
                    type="text"
                    placeholder="Enter the destination account ID"
                    value={form.toAccount}
                    onChange={handleChange}
                    error={errors.toAccount}
                    helper="The full MongoDB ObjectId of the recipient's account"
                  />
                </div>

                {/* Amount */}
                <div className={styles.section}>
                  <Input
                    label="Amount (INR)"
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleChange}
                    error={errors.amount}
                    min="1"
                    step="0.01"
                  />
                  {form.amount && !errors.amount && (
                    <p className={styles.amountPreview}>
                      You will send <strong>{formatINR(Number(form.amount))}</strong>
                    </p>
                  )}
                </div>

                {/* Idempotency key */}
                <div className={styles.section}>
                  <div className={styles.idempotencyRow}>
                    <label className={styles.fieldLabel}>Transaction Reference</label>
                    <button
                      type="button"
                      className={styles.regenerateBtn}
                      onClick={() => setForm((f) => ({ ...f, idempotencyKey: generateIdempotencyKey() }))}
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className={styles.idempotencyValue}>
                    <Zap size={14} />
                    <code>{form.idempotencyKey}</code>
                  </div>
                  <p className={styles.idempotencyNote}>
                    Prevents duplicate transactions if you retry.
                  </p>
                </div>

                <Button type="submit" fullWidth size="lg">
                  Review Transfer
                </Button>
              </form>
            </Card>
          )}

          {/* Confirm step */}
          {step === 'confirm' && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Transfer</CardTitle>
                <div className={styles.stepIndicator}>
                  <span className={[styles.stepDot, styles.done].join(' ')} />
                  <span className={[styles.stepLine, styles.activeLine].join(' ')} />
                  <span className={[styles.stepDot, styles.active].join(' ')} />
                  <span className={styles.stepLine} />
                  <span className={styles.stepDot} />
                </div>
              </CardHeader>

              <div className={styles.confirmDetails}>
                <div className={styles.confirmRow}>
                  <span>From</span>
                  <span className={styles.confirmMono}>···{fromAccount._id.slice(-10).toUpperCase()}</span>
                </div>
                <div className={styles.confirmRow}>
                  <span>To</span>
                  <span className={styles.confirmMono}>···{form.toAccount.slice(-10).toUpperCase()}</span>
                </div>
                <div className={[styles.confirmRow, styles.confirmAmount].join(' ')}>
                  <span>Amount</span>
                  <span>{formatINR(Number(form.amount))}</span>
                </div>
                <div className={styles.confirmRow}>
                  <span>Reference</span>
                  <code className={styles.confirmRef}>{form.idempotencyKey}</code>
                </div>
              </div>

              <div className={styles.confirmWarning}>
                <Info size={16} />
                <span>This action cannot be undone. Please verify the details before confirming.</span>
              </div>

              <div className={styles.confirmActions}>
                <Button variant="secondary" onClick={() => setStep('form')} fullWidth>
                  Edit Details
                </Button>
                <Button onClick={handleConfirm} loading={submitting} fullWidth>
                  Confirm Transfer
                </Button>
              </div>
            </Card>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <Card>
              <div className={styles.processing}>
                <div className={styles.processingSpinner}>
                  <Spinner size="lg" />
                </div>
                <h3>Processing Transfer</h3>
                <p>Please wait while we process your transfer. This may take a few seconds.</p>
                <div className={styles.processingSteps}>
                  {['Validating accounts', 'Checking balance', 'Recording transaction', 'Updating ledger'].map((s, i) => (
                    <div key={s} className={[styles.procStep, i === 0 ? styles.procActive : ''].join(' ')}>
                      <div className={styles.procDot} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Done */}
          {step === 'done' && result && (
            <Card>
              <div className={styles.resultWrap}>
                {result.success ? (
                  <>
                    <div className={styles.successIcon}>
                      <CheckCircle2 size={48} />
                    </div>
                    <h3>Transfer Successful!</h3>
                    <p>{result.message}</p>

                    {result.data && (
                      <div className={styles.txDetails}>
                        <div className={styles.txRow}>
                          <span>Transaction ID</span>
                          <code>{result.data._id}</code>
                        </div>
                        <div className={styles.txRow}>
                          <span>Amount</span>
                          <strong>{formatINR(result.data.amount)}</strong>
                        </div>
                        <div className={styles.txRow}>
                          <span>Status</span>
                          <Badge label={result.data.status} />
                        </div>
                        <div className={styles.txRow}>
                          <span>Date</span>
                          <span>{formatDate(result.data.updatedAt || result.data.createdAt)}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.failIcon}>
                      <AlertCircle size={48} />
                    </div>
                    <h3>Transfer Failed</h3>
                    <p>{result.message}</p>
                  </>
                )}

                <div className={styles.doneActions}>
                  <Button onClick={handleNewTransfer} fullWidth>
                    Make Another Transfer
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Side info */}
        <div className={styles.sideCol}>
          <Card>
            <CardTitle>Your Accounts</CardTitle>
            <div className={styles.accountList}>
              {accounts.map((acc) => (
                <div key={acc._id} className={styles.miniAccount}>
                  <div>
                    <p className={styles.miniId}>···{acc._id.slice(-8).toUpperCase()}</p>
                    <Badge label={acc.status} />
                  </div>
                  <p className={styles.miniBal}>
                    {balances[acc._id] !== undefined ? formatINR(balances[acc._id]) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Transfer Notes</CardTitle>
            <ul className={styles.notesList}>
              <li>Transfers are processed using a double-entry ledger</li>
              <li>Both accounts must be ACTIVE</li>
              <li>Minimum transfer amount is ₹1</li>
              <li>The recipient account ID is the full MongoDB ObjectId</li>
              <li>Duplicate transfers are prevented via the reference key</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
