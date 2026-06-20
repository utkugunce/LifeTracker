import { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { PRESET_ACTIVITIES, CATEGORY_COLORS } from '../../lib/constants'
import { clsx } from '../../lib/utils'

export function ActivitySearch({ value, onChange, placeholder = 'Aktivite ara veya ekle...' }) {
  const { activities } = useApp()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const allOptions = useMemo(() => {
    const customActivities = activities
      .filter(a => a.is_custom)
      .map(a => ({ id: a.id, name: a.name, emoji: '✨', category: 'custom' }))

    const presetNames = new Set(PRESET_ACTIVITIES.map(p => p.name.toLowerCase()))
    const presets = PRESET_ACTIVITIES.map(p => {
      const existing = activities.find(a => a.name.toLowerCase() === p.name.toLowerCase())
      return existing ? { id: existing.id, ...p } : { id: null, ...p }
    })

    return [...customActivities.filter(c => !presetNames.has(c.name.toLowerCase())), ...presets]
  }, [activities])

  const filtered = useMemo(() => {
    if (!query) return allOptions
    return allOptions.filter(o => o.name.toLowerCase().includes(query.toLowerCase()))
  }, [allOptions, query])

  const selected = allOptions.find(o => o.id === value || o.name === value)

  function select(option) {
    onChange(option.id || option.name)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-surface-500 transition-all"
        onClick={() => setOpen(true)}
      >
        <Search size={16} className="text-surface-400 shrink-0" />
        {selected && !open ? (
          <span className="text-white flex-1">
            {selected.emoji} {selected.name}
          </span>
        ) : (
          <input
            autoFocus={open}
            className="bg-transparent flex-1 text-white placeholder-surface-400 outline-none"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
          />
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl z-20 max-h-56 overflow-y-auto scrollbar-hide">
            {filtered.length === 0 && query ? (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-3 text-primary-400 hover:bg-surface-700 transition-colors"
                onClick={() => select({ id: null, name: query, emoji: '✨', category: 'custom' })}
              >
                <Plus size={16} />
                <span>&ldquo;{query}&rdquo; ekle</span>
              </button>
            ) : (
              filtered.map((opt, i) => (
                <button
                  key={opt.id || opt.name}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-700 transition-colors text-left"
                  onClick={() => select(opt)}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span className="text-surface-100 flex-1">{opt.name}</span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[opt.category] || CATEGORY_COLORS.custom }}
                  />
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
