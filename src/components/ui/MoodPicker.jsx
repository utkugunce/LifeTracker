import { MOOD_OPTIONS } from '../../lib/constants'
import { clsx } from '../../lib/utils'

export function MoodPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 justify-between">
      {MOOD_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={clsx(
            'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all',
            value === opt.value
              ? 'border-primary-500 bg-primary-500/20'
              : 'border-surface-600 hover:border-surface-400 bg-surface-700',
          )}
        >
          <span className="text-xl">{opt.emoji}</span>
          <span className="text-xs text-surface-400">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
