import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, parseISO, isWithinInterval,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { BarChart3, Clock, Smile, Trophy, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDuration } from '../lib/utils'
import { PRESET_ACTIVITIES, CATEGORY_COLORS, MOOD_OPTIONS } from '../lib/constants'

const PIE_COLORS = [
  '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#f97316', '#06b6d4', '#6366f1',
]

function getColor(name, index) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return CATEGORY_COLORS[preset?.category] ?? PIE_COLORS[index % PIE_COLORS.length]
}

function getEmoji(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return preset?.emoji ?? '📌'
}

function moodEmoji(score) {
  const m = MOOD_OPTIONS.find(o => o.value === Math.round(score))
  return m?.emoji ?? '😐'
}

function ChartTooltip({ active, payload, label, type }) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 shadow-xl">
      {label && <p className="text-surface-400 text-[10px] mb-0.5">{label}</p>}
      <p className="text-white text-xs font-semibold">
        {payload[0].payload.name || label}
      </p>
      <p className="text-primary-300 text-xs">
        {type === 'mood'
          ? `${moodEmoji(val)} ${val.toFixed(1)}`
          : formatDuration(Math.round(val))}
      </p>
    </div>
  )
}

export function AnalyticsPage() {
  const { logs } = useApp()
  const [period, setPeriod] = useState('weekly')

  const now = new Date()
  const interval = useMemo(() =>
    period === 'weekly'
      ? { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      : { start: startOfMonth(now), end: endOfMonth(now) },
    [period]
  )

  const periodLogs = useMemo(() =>
    logs.filter(l => {
      if (!l.duration_minutes) return false
      try {
        return isWithinInterval(parseISO(l.log_date), interval)
      } catch { return false }
    }),
    [logs, interval.start.getTime(), interval.end.getTime()]
  )

  const totalMinutes = useMemo(() =>
    periodLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0),
    [periodLogs]
  )

  const days = useMemo(() => eachDayOfInterval(interval), [interval.start.getTime(), interval.end.getTime()])

  const dailyData = useMemo(() =>
    days.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayLogs = periodLogs.filter(l => l.log_date === dateStr)
      const minutes = dayLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0)
      return {
        day: format(d, period === 'weekly' ? 'EEE' : 'd', { locale: tr }),
        fullDay: format(d, 'd MMM', { locale: tr }),
        minutes,
      }
    }),
    [periodLogs, days, period]
  )

  const moodData = useMemo(() =>
    days.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayMoods = periodLogs.filter(l => l.log_date === dateStr && l.mood)
      const avg = dayMoods.length
        ? dayMoods.reduce((s, l) => s + l.mood, 0) / dayMoods.length
        : null
      return {
        day: format(d, period === 'weekly' ? 'EEE' : 'd', { locale: tr }),
        fullDay: format(d, 'd MMM', { locale: tr }),
        mood: avg,
      }
    }),
    [periodLogs, days, period]
  )

  const hasMoodData = moodData.some(d => d.mood !== null)

  const activityData = useMemo(() => {
    const acc = {}
    periodLogs.forEach(l => {
      const name = l.activities?.name ?? 'Bilinmiyor'
      acc[name] = (acc[name] || 0) + (l.duration_minutes || 0)
    })
    return Object.entries(acc)
      .map(([name, minutes], i) => ({ name, minutes, color: getColor(name, i), emoji: getEmoji(name) }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8)
  }, [periodLogs])

  const moodLogs = periodLogs.filter(l => l.mood)
  const avgMood = moodLogs.length
    ? moodLogs.reduce((s, l) => s + l.mood, 0) / moodLogs.length
    : null

  const topActivity = activityData[0] ?? null

  const hasData = totalMinutes > 0

  return (
    <div className="space-y-5">
      {/* Period toggle */}
      <div className="flex bg-surface-800 rounded-xl p-1 border border-surface-700">
        {[
          { value: 'weekly', label: 'Bu Hafta' },
          { value: 'monthly', label: 'Bu Ay' },
        ].map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              period === p.value
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-5">
            <BarChart3 size={36} className="text-surface-600" />
          </div>
          <p className="font-semibold text-surface-300 text-lg">Henüz veri yok</p>
          <p className="text-sm text-surface-500 mt-1.5 max-w-[16rem] leading-relaxed">
            {period === 'weekly' ? 'Bu hafta' : 'Bu ay'} aktivite takip ettikçe grafikler burada görünecek
          </p>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface-800 border border-surface-700 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={12} className="text-primary-400" />
                <span className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Toplam</span>
              </div>
              <p className="text-lg font-bold text-white leading-tight">{formatDuration(totalMinutes)}</p>
            </div>

            <div className="bg-surface-800 border border-surface-700 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy size={12} className="text-amber-400" />
                <span className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">En Çok</span>
              </div>
              {topActivity ? (
                <div>
                  <p className="text-lg font-bold text-white leading-tight">{formatDuration(topActivity.minutes)}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5 truncate">{topActivity.emoji} {topActivity.name}</p>
                </div>
              ) : (
                <p className="text-lg font-bold text-surface-600">—</p>
              )}
            </div>

            <div className="bg-surface-800 border border-surface-700 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Smile size={12} className="text-green-400" />
                <span className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Mod</span>
              </div>
              {avgMood ? (
                <div>
                  <p className="text-lg font-bold text-white leading-tight">{avgMood.toFixed(1)}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">{moodEmoji(avgMood)} {MOOD_OPTIONS.find(m => m.value === Math.round(avgMood))?.label ?? ''}</p>
                </div>
              ) : (
                <p className="text-lg font-bold text-surface-600">—</p>
              )}
            </div>
          </div>

          {/* Daily bar chart */}
          <div className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <TrendingUp size={14} className="text-primary-400" />
              <h3 className="text-sm font-semibold text-surface-200">Günlük Aktivite</h3>
            </div>
            <div className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v >= 60 ? `${Math.floor(v / 60)}s` : `${v}d`}
                    width={40}
                  />
                  <Tooltip
                    content={<ChartTooltip type="duration" />}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="minutes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mood line chart */}
          {hasMoodData && (
            <div className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <Smile size={14} className="text-green-400" />
                <h3 className="text-sm font-semibold text-surface-200">Ruh Hali Trendi</h3>
              </div>
              <div className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={moodData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 10, fill: '#475569' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={v => ['😫', '😞', '😐', '😊', '😄'][v - 1] || ''}
                    />
                    <Tooltip content={<ChartTooltip type="mood" />} />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Activity distribution */}
          {activityData.length > 0 && (
            <div className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <BarChart3 size={14} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-surface-200">Aktivite Dağılımı</h3>
              </div>
              <div className="px-4 pb-2">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={activityData}
                      dataKey="minutes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={72}
                      innerRadius={40}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {activityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip type="duration" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="px-4 pb-4 space-y-2">
                {activityData.map(d => {
                  const pct = Math.round((d.minutes / totalMinutes) * 100)
                  return (
                    <div key={d.name} className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-surface-300 flex-1 truncate">{d.emoji} {d.name}</span>
                      <span className="text-[10px] text-surface-500 tabular-nums w-8 text-right">{pct}%</span>
                      <span className="text-xs font-medium text-surface-200 tabular-nums w-12 text-right">
                        {formatDuration(d.minutes)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
