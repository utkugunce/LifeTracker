import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Zap } from 'lucide-react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useApp } from '../context/AppContext'
import { ActiveTimers } from '../components/timer/ActiveTimer'
import { LogCard } from '../components/logs/LogCard'
import { Card, CardContent } from '../components/ui/Card'
import { formatDuration, todayString } from '../lib/utils'
import { CATEGORY_COLORS, PRESET_ACTIVITIES } from '../lib/constants'

function getColor(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom
}

export function DashboardPage() {
  const { selectedDate, setSelectedDate, logsForDate, activeTimers } = useApp()
  const logs = logsForDate(selectedDate)
  const today = todayString()

  const totalMinutes = logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)

  function changeDate(direction) {
    const d = parseISO(selectedDate)
    const next = direction === 'next' ? addDays(d, 1) : subDays(d, 1)
    if (format(next, 'yyyy-MM-dd') > today) return
    setSelectedDate(format(next, 'yyyy-MM-dd'))
  }

  const isToday = selectedDate === today
  const dateLabel = isToday
    ? 'Bugün'
    : format(parseISO(selectedDate), 'EEEE, d MMMM', { locale: tr })

  // Aggregate by activity for summary
  const activityTotals = logs.reduce((acc, log) => {
    const name = log.activities?.name ?? 'Bilinmiyor'
    if (!acc[name]) acc[name] = 0
    acc[name] += log.duration_minutes || 0
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => changeDate('prev')}
          className="p-2 rounded-xl hover:bg-surface-700 text-surface-400 hover:text-white transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-white text-lg capitalize">{dateLabel}</h1>
          {!isToday && (
            <button onClick={() => setSelectedDate(today)} className="text-xs text-primary-400 hover:text-primary-300">
              Bugüne dön
            </button>
          )}
        </div>
        <button
          onClick={() => changeDate('next')}
          disabled={isToday}
          className="p-2 rounded-xl hover:bg-surface-700 text-surface-400 hover:text-white transition-all disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-primary-400" />
              <span className="text-xs text-surface-400 font-medium">Toplam Süre</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatDuration(totalMinutes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-xs text-surface-400 font-medium">Aktivite</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {logs.length}
              {activeTimers.length > 0 && isToday && (
                <span className="text-sm text-primary-400 ml-1">+{activeTimers.length} aktif</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Timers (today only) */}
      {isToday && activeTimers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-300 mb-2 uppercase tracking-wider">Aktif Zamanlayıcılar</h2>
          <ActiveTimers />
        </div>
      )}

      {/* Activity Summary Bar */}
      {Object.keys(activityTotals).length > 0 && (
        <div className="space-y-2">
          {Object.entries(activityTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, mins]) => (
              <div key={name}>
                <div className="flex justify-between text-xs text-surface-400 mb-1">
                  <span>{name}</span>
                  <span>{formatDuration(mins)}</span>
                </div>
                <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (mins / totalMinutes) * 100)}%`,
                      backgroundColor: getColor(name),
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Log List */}
      <div>
        <h2 className="text-sm font-semibold text-surface-300 mb-2 uppercase tracking-wider">
          {isToday ? "Bugünün Kayıtları" : "Kayıtlar"}
        </h2>
        {logs.length === 0 ? (
          <div className="text-center py-12 text-surface-500">
            <Clock size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Henüz kayıt yok</p>
            <p className="text-xs mt-1">Zamanlayıcı başlatın veya manuel kayıt ekleyin</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => <LogCard key={log.id} log={log} />)}
          </div>
        )}
      </div>
    </div>
  )
}
