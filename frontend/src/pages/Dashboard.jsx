import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  ArrowRightLeft,
  RefreshCw,
  Plus,
  CreditCard,
  ChevronRight,
  Shield,
  Zap,
  Lock,
  Clock,
  BookOpen,
  CheckCircle,
  Calendar,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { showToast } from '../components/ui/ToastContainer'
import styles from './Dashboard.module.css'

/* ─── helpers ─────────────────────────────────────────────────── */
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
  }).format(new Date(iso))
}

function shortId(id) {
  return '···' + id.slice(-8).toUpperCase()
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ─── sub-components ──────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, sub }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}><Icon size={17} /></div>
      <div className={styles.statContent}>
        <p className={styles.statTitle}>{title}</p>
        <p className={styles.statValue}>{value}</p>
        {sub && <p className={styles.statSub}>{sub}</p>}
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, onClick }) {
  return (
    <button className={styles.quickAction} onClick={onClick}>
      <div className={styles.qaIcon}><Icon size={16} /></div>
      <div>
        <p className={styles.qaLabel}>{label}</p>
        <p className={styles.qaDesc}>{desc}</p>
      </div>
      <ChevronRight size={15} className={styles.qaArrow} />
    </button>
  )
}

function PlatformItem({ icon: Icon, label, value }) {
  return (
    <div className={styles.platformItem}>
      <Icon size={15} className={styles.platformItemIcon} />
      <span className={styles.platformItemLabel}>{label}</span>
      <span className={styles.platformItemValue}>{value}</span>
    </div>
  )
}

/* ─── main component ──────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [accounts, setAccounts]           = useState([])
  const [balances, setBalances]           = useState({})
  const [loadingAccounts, setLoading]     = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [creatingAccount, setCreating]    = useState(false)

  const fetchAccounts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const { data } = await api.get('/accounts')
      setAccounts(data.accounts)
      const results = await Promise.allSettled(
        data.accounts.map((acc) => api.get(`/accounts/balance/${acc._id}`))
      )
      const bals = {}
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') bals[data.accounts[i]._id] = res.value.data.balance
      })
      setBalances(bals)
      if (isRefresh) showToast('Dashboard refreshed', 'success')
    } catch {
      showToast('Failed to load accounts', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const totalBalance   = Object.values(balances).reduce((s, b) => s + b, 0)
  const account        = accounts[0] ?? null
  const isLoading      = loadingAccounts || refreshing

  const handleCreateAccount = async () => {
    setCreating(true)
    try {
      await api.post('/accounts')
      showToast('Account opened successfully!', 'success')
      await fetchAccounts(true)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create account', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className={styles.subtitle}>Here's your financial overview for today</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" onClick={() => fetchAccounts(true)} loading={refreshing}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          {accounts.length === 0 && !loadingAccounts && (
            <Button size="sm" onClick={handleCreateAccount} loading={creatingAccount}>
              <Plus size={14} />
              Open Account
            </Button>
          )}
        </div>
      </div>

      {/* ── Balance hero ── */}
      <div className={styles.balanceHero}>
        <div className={styles.balanceLeft}>
          <p className={styles.balanceLabel}>Total Balance</p>
          <p className={styles.balanceAmount}>
            {isLoading ? '···' : formatINR(totalBalance)}
          </p>
          <div className={styles.balanceMeta}>
            {account && <Badge label={account.status} />}
            <span className={styles.balanceStatus}>
              {account ? `INR · ${shortId(account._id)}` : 'No account yet'}
            </span>
          </div>
        </div>
        <div className={styles.balanceRight}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/transfer')}
            disabled={!account || account.status !== 'ACTIVE'}
          >
            <ArrowRightLeft size={14} />
            Transfer
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/accounts')}
          >
            <CreditCard size={14} />
            Account
          </Button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className={styles.stats}>
        <StatCard
          title="Account Status"
          value={isLoading ? '···' : (account?.status ?? 'None')}
          icon={CheckCircle}
          sub="Current status"
        />
        <StatCard
          title="Currency"
          value={isLoading ? '···' : (account?.currency ?? '—')}
          icon={Wallet}
          sub="Account currency"
        />
        <StatCard
          title="Member Since"
          value={isLoading ? '···' : (account ? formatDate(account.createdAt) : '—')}
          icon={Calendar}
          sub="Account opened"
        />
      </div>

      {/* ── Two-column body ── */}
      <div className={styles.twoCol}>

        {/* Left col */}
        <div className={styles.leftCol}>

          {/* Account card */}
          <Card>
            <CardHeader>
              <CardTitle>My Account</CardTitle>
            </CardHeader>
            {isLoading ? (
              <Spinner center />
            ) : !account ? (
              <div className={styles.empty}>
                <Wallet size={36} className={styles.emptyIcon} />
                <h3>No account yet</h3>
                <p>Open your first account to start banking</p>
                <Button onClick={handleCreateAccount} loading={creatingAccount} size="sm">
                  <Plus size={14} /> Open Account
                </Button>
              </div>
            ) : (
              <div className={styles.accountCard}>
                <div className={styles.accountCardTop}>
                  <div className={styles.accountChip}>
                    <div className={styles.accountChipIcon}><CreditCard size={15} /></div>
                    <div className={styles.accountChipText}>
                      <p className={styles.accountLabel}>Account Number</p>
                      <p className={styles.accountId}>{shortId(account._id)}</p>
                    </div>
                  </div>
                  <Badge label={account.status} />
                </div>

                <div className={styles.accountBalance}>
                  {balances[account._id] !== undefined ? (
                    <span>{formatINR(balances[account._id])}</span>
                  ) : (
                    <span className={styles.balanceLoading}>Loading…</span>
                  )}
                  <span className={styles.currency}>{account.currency}</span>
                </div>

                <div className={styles.accountMeta}>
                  <Clock size={12} />
                  Opened on {formatDate(account.createdAt)}
                </div>

                <div className={styles.accountActions}>
                  <Button
                    size="sm"
                    onClick={() => navigate('/transfer')}
                    disabled={account.status !== 'ACTIVE'}
                  >
                    <ArrowRightLeft size={13} />
                    Send Money
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/accounts')}>
                    <CreditCard size={13} />
                    Details
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Platform info */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
            </CardHeader>
            <div className={styles.platformGrid}>
              <PlatformItem icon={Shield}   label="Security"       value="JWT + Blacklist" />
              <PlatformItem icon={BookOpen} label="Accounting"     value="Double-Entry Ledger" />
              <PlatformItem icon={Zap}      label="Transfers"      value="Idempotent" />
              <PlatformItem icon={Lock}     label="Passwords"      value="bcrypt hashed" />
              <PlatformItem icon={CheckCircle} label="Balance"     value="Ledger-derived" />
              <PlatformItem icon={Clock}    label="Token expiry"   value="3 days" />
            </div>
          </Card>
        </div>

        {/* Right col */}
        <div className={styles.rightCol}>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <div className={styles.quickActions}>
              <QuickAction
                icon={ArrowRightLeft}
                label="Send Money"
                desc="Transfer funds to another account"
                onClick={() => navigate('/transfer')}
              />
              <QuickAction
                icon={CreditCard}
                label="View Account"
                desc="See balance and account details"
                onClick={() => navigate('/accounts')}
              />
            </div>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About NexaBank</CardTitle>
            </CardHeader>
            <p className={styles.aboutText}>
              NexaBank is a secure digital banking platform built on a
              double-entry ledger architecture. Every transaction is atomic —
              funds are either fully transferred or not at all, ensuring your
              balance is always accurate.
            </p>
            <ul className={styles.aboutList}>
              {[
                'Real-time balance computed from ledger',
                'Idempotent transfers prevent duplicates',
                'Tokens auto-expire after 3 days',
                'Email confirmation on registration',
              ].map((item) => (
                <li key={item}>
                  <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
