import { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from '../../lib/utils'

export function Modal({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={clsx(
        'relative bg-surface-800 border border-surface-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90dvh] overflow-y-auto',
        className,
      )}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-surface-800 z-10 border-b border-surface-700">
          <h2 className="font-semibold text-white text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
