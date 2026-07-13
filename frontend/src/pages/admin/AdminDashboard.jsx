import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Zap, RefreshCw, ChevronRight,
  ShieldCheck, AlertTriangle, CheckCircle, Snowflake, XCircle, Search,
} from 'lucide-react'
import api from '../../api/axios'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { showToast } from '../../components/ui/ToastContainer'
import styles from './Admin.module.css'

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(n ?? 0)
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function StatCard({ label, value, sub }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [sysAccount, setSysAccount]     = useState(null)
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [updatingId, setUpdatingId]     = useState(null)
  const [search, setSearch]             = useState('')

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    try {
      const [accRes, txRes, allAccRes] = await Promise.allSettled([
        api.get('/accounts'),
        api.get('/transactions/system/all'),
        api.get('/transactions/system/accounts'),
      ])
      if (accRes.status === 'fulfilled')
        setSysAccount(accRes.value.data.accounts[0] ?? null)
      if (txRes.status === 'fulfilled')
        setTransactions(txRes.value.data.transactions)
      if (allAccRes.status === 'fulfilled')
        setAccounts(allAccRes.value.data.accounts)
      if (isRefresh) showToast('Refreshed', 'success')
    } catch {
      showToast('Failed to load admin data', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const activeCount = accounts.filter(a => a.status === 'ACTIVE').length
  const frozenCount = accounts.filter(a => a.status === 'FROZEN').length
  const closedCount = accounts.filter(a => a.status === 'CLOSED').length
  const totalFunded = transactions.reduce((s, t) => s + (t.amount ?? 0), 0)

  const filteredAccounts = search.trim()
    ? accounts.filter(a =>
        a.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : accounts

  const handleStatusChange = async (accountId, newStatus) => {
    setUpdatingId(accountId)
    try {
      const { data } = await api.patch(`/accounts/${accountId}/status`, { status: newStatus })
      setAccounts(prev =>
        prev.map(a => a._id === accountId ? { ...a, status: data.account.status } : a)
      )
      showToast(`Account ${newStatus.toLowerCase()}`, 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.subtitle}>System overview — accounts and disbursement history</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" onClick={() => fetchAll(true)}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/accounts?panel=fund')}>
            <Zap size={14} /> Add Funds
          </Button>
        </div>
      </div>

      {loading ? <Spinner center /> : (
        <>
          {/* Stats */}
          <div className={styles.statsGrid}>
            <StatCard label="Total Accounts"   value={accounts.length}       sub="All customers" />
            <StatCard label="Active"           value={activeCount}           sub="Currently active" />
            <StatCard label="Frozen"           value={frozenCount}           sub="Access restricted" />
            <StatCard label="Closed"           value={closedCount}           sub="Deactivated" />
            <StatCard label="Funds Disbursed"  value={formatINR(totalFunded)} sub={`${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`} />
          </div>

          {/* System account strip */}
          {!sysAccount ? (
            <div className={styles.noticeBox}>
              <AlertTriangle size={16} />
              <span>
                <strong>No system account found.</strong> Go to All Accounts → Create Account to set one up.
              </span>
            </div>
          ) : (
            <div className={styles.sysStrip}>
              <div className={styles.sysStripLeft}>
                <ShieldCheck size={15} className={styles.sysStripIcon} />
                <span className={styles.sysStripLabel}>System Account</span>
                <code className={styles.sysStripId}>
                  ···{sysAccount._id.slice(-12).toUpperCase()}
                </code>
              </div>
              <Badge label={sysAccount.status} />
            </div>
          )}

          {/* All customer accounts */}
          <Card padding="none">
            <div className={styles.tableCardHeader}>
              <CardTitle>All Customer Accounts</CardTitle>
              <span className={styles.tableCount}>
                {filteredAccounts.length}{search ? ` of ${accounts.length}` : ''}
              </span>
            </div>

            {/* Search bar — full width, prominent */}
            <div className={styles.searchRow}>
              <div className={styles.searchInputWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="Search customers by name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search customers"
                />
                {search && (
                  <button
                    className={styles.searchClear}
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            {filteredAccounts.length === 0 ? (
              <div className={styles.emptyTable}>
                <CreditCard size={32} />
                <p>{search ? `No accounts match "${search}"` : 'No customer accounts yet'}</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Account ID</th>
                      <th>Status</th>
                      <th>Balance</th>
                      <th>Opened</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map(acc => (
                      <tr key={acc._id}>
                        <td>
                          <div className={styles.customerCell}>
                            <div className={styles.customerAvatar}>
                              {acc.user?.name?.slice(0, 2).toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <p className={styles.customerName}>{acc.user?.name ?? 'Unknown'}</p>
                              <p className={styles.customerEmail}>{acc.user?.email ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className={styles.accountCode}>
                            ···{acc._id.slice(-10).toUpperCase()}
                          </code>
                        </td>
                        <td><Badge label={acc.status} /></td>
                        <td><span className={styles.balance}>{formatINR(acc.balance)}</span></td>
                        <td className={styles.dateCell}>{formatDate(acc.createdAt)}</td>
                        <td>
                          <div className={styles.actionBtns}>
                            {acc.status !== 'ACTIVE' && (
                              <Button
                                size="sm" variant="ghost"
                                loading={updatingId === acc._id}
                                onClick={() => handleStatusChange(acc._id, 'ACTIVE')}
                              >
                                <CheckCircle size={13} /> Activate
                              </Button>
                            )}
                            {acc.status === 'ACTIVE' && (
                              <Button
                                size="sm" variant="ghost"
                                loading={updatingId === acc._id}
                                onClick={() => handleStatusChange(acc._id, 'FROZEN')}
                              >
                                <Snowflake size={13} /> Freeze
                              </Button>
                            )}
                            {acc.status !== 'CLOSED' && (
                              <Button
                                size="sm" variant="ghost"
                                loading={updatingId === acc._id}
                                onClick={() => handleStatusChange(acc._id, 'CLOSED')}
                              >
                                <XCircle size={13} /> Close
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Transaction history */}
          <Card padding="none">
            <div className={styles.tableCardHeader}>
              <CardTitle>Initial Funds — Transaction History</CardTitle>
              <span className={styles.tableCount}>{transactions.length}</span>
            </div>
            {transactions.length === 0 ? (
              <div className={styles.emptyTable}>
                <Zap size={32} />
                <p>No disbursements yet</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Account ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx._id}>
                        <td>
                          <div className={styles.customerCell}>
                            <div className={styles.customerAvatar}>
                              {tx.toAccount?.user?.name?.slice(0, 2).toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <p className={styles.customerName}>
                                {tx.toAccount?.user?.name ?? 'Unknown'}
                              </p>
                              <p className={styles.customerEmail}>
                                {tx.toAccount?.user?.email ?? ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className={styles.accountCode}>
                            ···{tx.toAccount?._id?.slice(-10).toUpperCase() ?? '—'}
                          </code>
                        </td>
                        <td><span className={styles.balance}>{formatINR(tx.amount)}</span></td>
                        <td><Badge label={tx.status} /></td>
                        <td className={styles.dateCell}>{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <div className={styles.quickLinks}>
              <button className={styles.quickLink} onClick={() => navigate('/admin/accounts?panel=fund')}>
                <div className={styles.qlIcon}><Zap size={16} /></div>
                <div>
                  <p className={styles.qlLabel}>Add Initial Funds</p>
                  <p className={styles.qlDesc}>Credit opening balance into a customer account</p>
                </div>
                <ChevronRight size={15} className={styles.qlArrow} />
              </button>
              <button className={styles.quickLink} onClick={() => navigate('/admin/accounts')}>
                <div className={styles.qlIcon}><CreditCard size={16} /></div>
                <div>
                  <p className={styles.qlLabel}>Create System Account</p>
                  <p className={styles.qlDesc}>Set up the system bank account if it doesn't exist yet</p>
                </div>
                <ChevronRight size={15} className={styles.qlArrow} />
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
