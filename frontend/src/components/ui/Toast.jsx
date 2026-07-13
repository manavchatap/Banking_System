import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import styles from './Toast.module.css'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
}

export default function Toast({ message, type = 'success', onClose }) {
  const Icon = icons[type] || CheckCircle

  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={[styles.toast, styles[type]].join(' ')} role="alert" aria-live="polite">
      <Icon size={18} className={styles.icon} />
      <span className={styles.message}>{message}</span>
      <button className={styles.close} onClick={onClose} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  )
}
