import { clsx } from '../../lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx('bg-surface-800 rounded-2xl border border-surface-700', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return (
    <div className={clsx('px-4 pt-4 pb-2', className)}>
      {children}
    </div>
  )
}

export function CardContent({ className, children }) {
  return (
    <div className={clsx('px-4 pb-4', className)}>
      {children}
    </div>
  )
}
