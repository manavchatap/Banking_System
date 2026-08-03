import { useState, useEffect, useCallback } from 'react'
import { ArrowUpRight, ArrowDownLeft, RefreshCw, History } from 'lucide-react'
import api from '../api/axios'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { showToast } from '../components/ui/ToastContainer'
import styles from './Transactions.module.css'

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(n)
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export default function Transactions() {
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('ALL') // ALL | DEBIT | CREDIT

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    try {
      const { data } = await api.get('/transactions/history')
      setHistory(data.history)
      if (isRefresh) showToast('Refreshed', 'success')
    } catch {
      showToast('Failed to load transaction history', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const filtered = filter === 'ALL'
    ? history
    : history.filter(tx => tx.type === filter)

  const totalDebits  = history.filter(t => t.type === 'DEBIT' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0)
  const totalCredits = history.filter(t => t.type === 'CREDIT' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Transaction History</h1>
          <p className={styles.subtitle}>All debits and credits on your account</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => fetchHistory(true)}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Summary cards */}
      {!loading && history.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Total Credits</p>
            <p className={[styles.summaryValue, styles.credit].join(' ')}>{formatINR(totalCredits)}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Total Debits</p>
            <p className={[styles.summaryValue, styles.debit].join(' ')}>{formatINR(totalDebits)}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Transactions</p>
            <p className={styles.summaryValue}>{history.length}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {['ALL', 'CREDIT', 'DEBIT'].map(f => (
          <button
            key={f}
            className={[styles.filterBtn, filter === f ? styles.filterActive : ''].join(' ')}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? 'All' : f === 'CREDIT' ? 'Credits' : 'Debits'}
            <span className={styles.filterCount}>
              {f === 'ALL' ? history.length : history.filter(t => t.type === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <Card padding="none">
        {loading ? (
          <Spinner center />
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <History size={36} />
            <p>{history.length === 0 ? 'No transactions yet' : `No ${filter.toLowerCase()} transactions`}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map((tx, i) => (
              <div key={tx._id} className={styles.txRow}>
                <div className={[styles.txIcon, tx.type === 'CREDIT' ? styles.creditIcon : styles.debitIcon].join(' ')}>
                  {tx.type === 'CREDIT'
                    ? <ArrowDownLeft size={18} />
                    : <ArrowUpRight size={18} />
                  }
                </div>
                <div className={styles.txInfo}>
                  <p className={styles.txType}>
                    {tx.type === 'CREDIT' ? 'Money Received' : 'Money Sent'}
                  </p>
                  <p className={styles.txDate}>{formatDate(tx.createdAt)}</p>
                  <p className={styles.txId}>
                    ···{tx._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className={styles.txRight}>
                  <p className={[styles.txAmount, tx.type === 'CREDIT' ? styles.creditAmount : styles.debitAmount].join(' ')}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatINR(tx.amount)}
                  </p>
                  <Badge label={tx.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
