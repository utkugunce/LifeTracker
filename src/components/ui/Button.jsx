import { clsx } from '../../lib/utils'

const variants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25',
  secondary: 'bg-surface-700 hover:bg-surface-600 text-surface-100',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'hover:bg-surface-700 text-surface-300 hover:text-white',
  outline: 'border border-surface-600 hover:border-surface-400 text-surface-200 hover:bg-surface-700',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
  icon: 'p-2',
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
