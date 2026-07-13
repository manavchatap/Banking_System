import styles from './Badge.module.css'

const variantMap = {
  ACTIVE: 'success',
  COMPLETED: 'success',
  CREDIT: 'success',
  FROZEN: 'warning',
  PENDING: 'warning',
  CLOSED: 'default',
  FAILED: 'danger',
  REVERSED: 'danger',
  DEBIT: 'danger',
}

export default function Badge({ label, variant }) {
  const resolved = variant || variantMap[label] || 'default'
  return <span className={[styles.badge, styles[resolved]].join(' ')}>{label}</span>
}
