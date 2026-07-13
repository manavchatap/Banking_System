import styles from './Input.module.css'

export default function Input({
  label,
  id,
  error,
  helper,
  icon: Icon,
  rightIcon: RightIcon,
  className = '',
  ...props
}) {
  return (
    <div className={[styles.group, className].join(' ')}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.wrapper}>
        {Icon && (
          <span className={styles.iconLeft} aria-hidden="true">
            <Icon size={17} />
          </span>
        )}
        <input
          id={id}
          className={[
            styles.input,
            Icon ? styles.hasIconLeft : '',
            RightIcon ? styles.hasIconRight : '',
            error ? styles.hasError : '',
          ].join(' ')}
          {...props}
        />
        {RightIcon && (
          <span className={styles.iconRight} aria-hidden="true">
            <RightIcon size={17} />
          </span>
        )}
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {helper && !error && <p className={styles.helper}>{helper}</p>}
    </div>
  )
}
