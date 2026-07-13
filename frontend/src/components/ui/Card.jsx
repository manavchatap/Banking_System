import styles from './Card.module.css'

export default function Card({ children, className = '', padding = 'md', ...props }) {
  return (
    <div className={[styles.card, styles[padding], className].join(' ')} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return <div className={[styles.header, className].join(' ')}>{children}</div>
}

export function CardTitle({ children, className = '' }) {
  return <h2 className={[styles.title, className].join(' ')}>{children}</h2>
}

export function CardBody({ children, className = '' }) {
  return <div className={[styles.body, className].join(' ')}>{children}</div>
}
