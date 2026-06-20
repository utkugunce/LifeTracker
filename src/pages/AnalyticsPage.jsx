import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, parseISO, isWithinInterval,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { useApp } from '../context/AppContext'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { formatDuration } from '../lib/utils'
import { PRESET_ACTIVITIES, CATEGORY_COLORS } from '../lib/constants'

function getColor(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-white text-xs font-semibold">{payload[0].name || payload[0].payload.name}</p>
      <p className="text-primary-300 text-xs">{formatDuration(payload[0].value)}</p>
    </div>
  )
}

export function AnalyticsPage() {
  const { logs } = useApp()
  const [period, setPeriod] = useState('weekly')

  const now = new Date()
  const interval = period === 'weekly'
    ? { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    : { start: startOfMonth(now), end: endOfMonth(now) }

  const periodLogs = useMemo(() =>
    logs.filter(l => {
      try {
        return isWithinInterval(parseISO(l.log_date), interval)
      } catch { return false }
    }),
    [logs, interval.start, interval.end],
  )

  const totalMinutes = periodLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)

  // Daily bar chart data
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval(interval)
    return days.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayLogs = periodLogs.filter(l => l.log_date === dateStr)
      const minutes = dayLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)
      return {
        day: format(d, period === 'weekly' ? 'EEE' : 'd', { locale: tr }),
        minutes,
      }
    })
  }, [periodLogs, interval, period])

  // Activity pie chart data
  const activityData = useMemo(() => {
    const acc = {}
    periodLogs.forEach(l => {
      const name = l.activities?.name ?? 'Bilinmiyor'
      acc[name] = (acc[name] || 0) + (l.duration_minutes || 0)
    })
    return Object.entries(acc)
      .map(([name, minutes]) => ({ name, minutes, color: getColor(name) }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8)
  }, [periodLogs])

  // Mood average
  const moodLogs = periodLogs.filter(l => l.mood)
  const avgMood = moodLogs.length
    ? (moodLogs.reduce((sum, l) => sum + l.mood, 0) / moodLogs.length).toFixed(1)
    : null

  const moodEmojis = { 1: '😫', 2: '😞', 3: '😐', 4: '😊', 5: '😄' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Analiz</h1>
        <div className="flex bg-surface-800 rounded-xl p-1 border border-surface-700">
          {['weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p ? 'bg-primary-500 text-white' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {p === 'weekly' ? 'Hafta' : 'Ay'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-surface-400 mb-1">Toplam</p>
            <p className="text-lg font-bold text-white">{formatDuration(totalMinutes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-surface-400 mb-1">Oturum</p>
            <p className="text-lg font-bold text-white">{periodLogs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-surface-400 mb-1">Ruh hali</p>
            <p className="text-lg font-bold text-white">
              {avgMood ? `${moodEmojis[Math.round(avgMood)]} ${avgMood}` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily bar chart */}
      {totalMinutes > 0 ? (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-surface-200">Günlük Dağılım</h2>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={dailyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v >= 60 ? `${Math.floor(v / 60)}s` : `${v}d`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="minutes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity breakdown */}
          {activityData.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-surface-200">Aktivite Dağılımı</h2>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={activityData}
                      dataKey="minutes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={35}
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {activityData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-surface-300">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-surface-500">
                          {Math.round((d.minutes / totalMinutes) * 100)}%
                        </span>
                        <span className="text-xs font-medium text-surface-200 w-14 text-right">
                          {formatDuration(d.minutes)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-surface-500">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium text-surface-400">Henüz veri yok</p>
          <p className="text-sm mt-1">
            {period === 'weekly' ? 'Bu hafta' : 'Bu ay'} aktivite ekledikçe grafikler görünecek
          </p>
        </div>
      )}
    </div>
  )
}
