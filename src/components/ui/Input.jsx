import { clsx } from '../../lib/utils'

export function Input({ className, label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-surface-300">{label}</label>}
      <input
        className={clsx(
          'w-full bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Textarea({ className, label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-surface-300">{label}</label>}
      <textarea
        className={clsx(
          'w-full bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
