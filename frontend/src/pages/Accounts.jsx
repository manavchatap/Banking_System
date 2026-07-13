import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  Eye,
} from 'lucide-react'
import api from '../api/axios'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { showToast } from '../components/ui/ToastContainer'
import styles from './Accounts.module.css'

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

export default function Accounts() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await api.post('/accounts')
      showToast('Account created successfully!', 'success')
      await fetchAll()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create account', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Accounts</h1>
          <p className={styles.subtitle}>Your bank account details</p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={fetchAll}>
            <RefreshCw size={15} />
            Refresh
          </Button>
          {accounts.length === 0 && (
            <Button size="sm" onClick={handleCreate} loading={creating}>
              <Plus size={15} />
              Open Account
            </Button>
          )}
        </div>
      </div>

      <Card padding="none">
        {loading ? (
          <Spinner center />
        ) : accounts.length === 0 ? (
          <div className={styles.empty}>
            <CreditCard size={40} />
            <h3>No accounts found</h3>
            <p>Open your first account to start banking</p>
            <Button onClick={handleCreate} loading={creating}>
              <Plus size={15} />
              Create Account
            </Button>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Status</th>
                  <th>Currency</th>
                  <th>Balance</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr
                    key={acc._id}
                    className={selectedAccount === acc._id ? styles.selectedRow : ''}
                  >
                    <td>
                      <div className={styles.accountIdCell}>
                        <div className={styles.accountIconWrap}>
                          <CreditCard size={15} />
                        </div>
                        <div>
                          <span className={styles.accountIdFull}>{acc._id}</span>
                          <span className={styles.accountIdShort}>···{acc._id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td><Badge label={acc.status} /></td>
                    <td>
                      <span className={styles.currency}>{acc.currency}</span>
                    </td>
                    <td>
                      <span className={styles.balance}>
                        {balances[acc._id] !== undefined
                          ? formatINR(balances[acc._id])
                          : <span className={styles.balanceLoading}>Loading…</span>}
                      </span>
                    </td>
                    <td className={styles.date}>{formatDate(acc.createdAt)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate('/transfer')}
                          disabled={acc.status !== 'ACTIVE'}
                        >
                          <ArrowRightLeft size={14} />
                          Transfer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Account summary */}
      {accounts.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Account Balance</p>
            <p className={styles.summaryValue}>
              {formatINR(Object.values(balances).reduce((s, b) => s + b, 0))}
            </p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Account Status</p>
            <p className={styles.summaryValue}>
              {accounts[0]?.status ?? '—'}
            </p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Currency</p>
            <p className={styles.summaryValue}>{accounts[0]?.currency ?? '—'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
