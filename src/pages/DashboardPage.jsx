import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Flame, CalendarDays } from 'lucide-react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useApp } from '../context/AppContext'
import { ActiveTimers } from '../components/timer/ActiveTimer'
import { LogCard } from '../components/logs/LogCard'
import { formatDuration, todayString } from '../lib/utils'
import { CATEGORY_COLORS, PRESET_ACTIVITIES, MOOD_OPTIONS } from '../lib/constants'

function getColor(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom
}

function getMoodEmoji(value) {
  return MOOD_OPTIONS.find(m => m.value === value)?.emoji ?? ''
}

export function DashboardPage() {
  const { selectedDate, setSelectedDate, logsForDate, activeTimers } = useApp()
  const today = todayString()
  const isToday = selectedDate === today
  const logs = logsForDate(selectedDate)

  const totalMinutes = logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)
  const moodLogs = logs.filter(l => l.mood)
  const avgMood = moodLogs.length
    ? Math.round(moodLogs.reduce((s, l) => s + l.mood, 0) / moodLogs.length)
    : null

  const activityTotals = logs.reduce((acc, l) => {
    const name = l.activities?.name ?? 'Bilinmiyor'
    acc[name] = (acc[name] || 0) + (l.duration_minutes || 0)
    return acc
  }, {})

  function changeDate(dir) {
    const d = parseISO(selectedDate)
    const next = dir === 'next' ? addDays(d, 1) : subDays(d, 1)
    if (format(next, 'yyyy-MM-dd') > today) return
    setSelectedDate(format(next, 'yyyy-MM-dd'))
  }

  const dateLabel = isToday
    ? 'Bugün'
    : format(parseISO(selectedDate), 'EEEE, d MMMM', { locale: tr })

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <div className="space-y-4">

      {/* ── Date navigator ────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => changeDate('prev')}
          className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-700 transition-all active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <CalendarDays size={14} className="text-surface-500 shrink-0" />
          <span className="font-semibold text-white text-base capitalize truncate">{dateLabel}</span>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(today)}
              className="shrink-0 text-xs text-primary-400 bg-primary-500/15 px-2 py-0.5 rounded-full hover:bg-primary-500/25 transition-colors"
            >
              Bugün
            </button>
          )}
        </div>

        <button
          onClick={() => changeDate('next')}
          disabled={isToday}
          className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-700 transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Hero stat card ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5">
        {/* decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-primary-200 text-xs font-medium uppercase tracking-widest mb-1">
              {isToday ? 'Bugün toplam' : 'Toplam süre'}
            </p>
            {totalMinutes > 0 ? (
              <p className="text-4xl font-bold text-white">
                {hours > 0 && <span>{hours}<span className="text-2xl font-semibold text-primary-200">s </span></span>}
                {mins > 0 && <span>{mins}<span className="text-2xl font-semibold text-primary-200">d</span></span>}
                {totalMinutes === 0 && '0d'}
              </p>
            ) : (
              <p className="text-4xl font-bold text-white/40">—</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {avgMood && (
              <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
                <p className="text-xl">{getMoodEmoji(avgMood)}</p>
                <p className="text-primary-200 text-xs">Ortalama</p>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex items-center gap-4 mt-4 pt-3 border-t border-white/15">
          <div>
            <p className="text-2xl font-bold text-white">{logs.length}</p>
            <p className="text-primary-200 text-xs">kayıt</p>
          </div>
          {isToday && activeTimers.length > 0 && (
            <div>
              <p className="text-2xl font-bold text-white">{activeTimers.length}</p>
              <p className="text-primary-200 text-xs">aktif sayaç</p>
            </div>
          )}
          {totalMinutes >= 60 && (
            <div className="ml-auto flex items-center gap-1 text-yellow-300">
              <Flame size={14} />
              <span className="text-xs font-semibold">{formatDuration(totalMinutes)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Active timers (today only) ─────────────────── */}
      {isToday && activeTimers.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">
            Aktif Sayaçlar
          </h2>
          <ActiveTimers />
        </section>
      )}

      {/* ── Activity breakdown ────────────────────────── */}
      {Object.keys(activityTotals).length > 0 && (
        <section className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-widest">
            Aktivite Dağılımı
          </h2>
          {Object.entries(activityTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, mins]) => {
              const pct = Math.round((mins / totalMinutes) * 100)
              const color = getColor(name)
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-surface-200 font-medium">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-surface-500">{pct}%</span>
                      <span className="text-xs font-semibold text-surface-300 w-12 text-right">
                        {formatDuration(mins)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
        </section>
      )}

      {/* ── Log list ──────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">
          {isToday ? 'Bugünün Kayıtları' : 'Kayıtlar'}
        </h2>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-4">
              <Clock size={28} className="text-surface-600" />
            </div>
            <p className="font-medium text-surface-400">Henüz kayıt yok</p>
            <p className="text-xs text-surface-600 mt-1">
              {isToday
                ? 'Takip sekmesinden zamanlayıcı başlat'
                : 'Bu gün için kayıt bulunmuyor'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => <LogCard key={log.id} log={log} />)}
          </div>
        )}
      </section>
    </div>
  )
}
