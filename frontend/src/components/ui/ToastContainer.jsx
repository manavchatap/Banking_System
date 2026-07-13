import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Toast from './Toast'
import styles from './ToastContainer.module.css'

// Simple global event bus for toasts
const listeners = new Set()

export function showToast(message, type = 'success') {
  listeners.forEach((fn) => fn({ message, type, id: Date.now() + Math.random() }))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast])
    }
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return createPortal(
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </div>,
    document.body
  )
}
