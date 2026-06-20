import { LayoutDashboard, Timer, Target, BarChart3 } from 'lucide-react'
import { clsx } from '../../lib/utils'

const tabs = [
  { id: 'dashboard', label: 'Bugün', icon: LayoutDashboard },
  { id: 'timer', label: 'Takip', icon: Timer },
  { id: 'goals', label: 'Hedefler', icon: Target },
  { id: 'analytics', label: 'Analiz', icon: BarChart3 },
]

export function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-900/95 backdrop-blur-md border-t border-surface-700 z-40 pb-safe">
      <div className="flex items-center max-w-md mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-150',
                isActive ? 'text-primary-400' : 'text-surface-500 hover:text-surface-300',
              )}
            >
              <Icon
                size={22}
                className={clsx('transition-transform', isActive && 'scale-110')}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={clsx('text-xs font-medium', isActive && 'font-semibold')}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
