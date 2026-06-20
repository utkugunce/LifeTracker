import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Clock, Flame, CalendarDays,
  Play, Plus, Zap, Sun, Moon, Sunrise, Sunset,
} from 'lucide-react'
import { format, addDays, subDays, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useApp } from '../context/AppContext'
import { ActiveTimers } from '../components/timer/ActiveTimer'
import { LogCard } from '../components/logs/LogCard'
import { Modal } from '../components/ui/Modal'
import { ActivitySearch } from '../components/ui/ActivitySearch'
import { MoodPicker } from '../components/ui/MoodPicker'
import { formatDuration, todayString } from '../lib/utils'
import { CATEGORY_COLORS, PRESET_ACTIVITIES, MOOD_OPTIONS } from '../lib/constants'

function getColor(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom
}

function getMoodEmoji(value) {
  return MOOD_OPTIONS.find(m => m.value === value)?.emoji ?? ''
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return { text: 'İyi Geceler!', sub: 'Geç saatlere kadar mı çalışıyorsun?', Icon: Moon }
  if (h < 12) return { text: 'Günaydın!', sub: 'Bugün nasıl gidiyor?', Icon: Sunrise }
  if (h < 18) return { text: 'İyi Günler!', sub: 'Bugün nasıl gidiyor?', Icon: Sun }
  return { text: 'İyi Akşamlar!', sub: 'Bugün nasıl geçti?', Icon: Sunset }
}

const QUICK_SHORTCUTS = [
  { name: 'Çalışma', emoji: '💼' },
  { name: 'Spor', emoji: '🏋️' },
  { name: 'Kitap Okuma', emoji: '📚' },
  { name: 'Koşu', emoji: '🏃' },
]

function QuickEntryCard() {
  const { startTimer, addManualLog, activeTimers, activities, logs } = useApp()
  const [starting, setStarting] = useState(null)
  const [showManual, setShowManual] = useState(false)

  const [manualActivity, setManualActivity] = useState('')
  const [manualDuration, setManualDuration] = useState('')
  const [manualMood, setManualMood] = useState(null)
  const [manualNotes, setManualNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const greeting = getGreeting()
  const GIcon = greeting.Icon

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekMinutes = useMemo(() =>
    logs
      .filter(l => {
        if (!l.duration_minutes) return false
        try { return isWithinInterval(parseISO(l.log_date), { start: weekStart, end: weekEnd }) }
        catch { return false }
      })
      .reduce((s, l) => s + (l.duration_minutes || 0), 0),
    [logs, weekStart.getTime()]
  )

  async function quickStart(name) {
    const db = activities.find(a => a.name === name)
    const idOrName = db?.id || name
    if (activeTimers.some(t => t.activities?.name === name || t.activity_id === idOrName)) return
    setStarting(name)
    try {
      await startTimer(idOrName)
    } catch (e) {
      console.error(e)
    } finally {
      setTimeout(() => setStarting(null), 600)
    }
  }

  function isRunning(name) {
    return activeTimers.some(t => t.activities?.name === name)
  }

  async function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualActivity || !manualDuration) return
    setSaving(true)
    try {
      await addManualLog({
        activityIdOrName: manualActivity,
        date: todayString(),
        durationMinutes: parseInt(manualDuration),
        mood: manualMood,
        notes: manualNotes,
      })
      setManualActivity('')
      setManualDuration('')
      setManualMood(null)
      setManualNotes('')
      setSaved(true)
      setTimeout(() => { setSaved(false); setShowManual(false) }, 1200)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a855f7 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute top-8 -right-4 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/10" />

        <div className="relative p-5">
          {/* Greeting */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{greeting.text}</h2>
              <p className="text-white/60 text-sm mt-0.5">{greeting.sub}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <GIcon size={20} className="text-white/80" />
            </div>
          </div>

          {/* Week stat pill */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2">
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Bu Hafta</p>
              <p className="text-lg font-bold text-white leading-tight">{formatDuration(weekMinutes)}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2">
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Aktif</p>
              <p className="text-lg font-bold text-white leading-tight">
                {activeTimers.length > 0 ? `${activeTimers.length} sayaç` : '—'}
              </p>
            </div>
          </div>

          {/* Quick start chips */}
          <div className="flex gap-2 mb-3">
            {QUICK_SHORTCUTS.map(({ name, emoji }) => {
              const running = isRunning(name)
              const isStarting = starting === name
              return (
                <button
                  key={name}
                  onClick={() => quickStart(name)}
                  disabled={running || isStarting}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-3 py-2 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                >
                  {isStarting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {running
                        ? <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        : <Plus size={12} strokeWidth={3} />
                      }
                    </>
                  )}
                  <span>{name}</span>
                </button>
              )
            })}
          </div>

          {/* Bottom actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowManual(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-black/20 hover:bg-black/30 backdrop-blur-sm rounded-xl py-2.5 text-white/90 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <Plus size={13} strokeWidth={2.5} />
              Kayıt Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Manual entry modal */}
      <Modal open={showManual} onClose={() => setShowManual(false)} title="Manuel Kayıt">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">Aktivite</p>
            <ActivitySearch
              value={manualActivity}
              onChange={setManualActivity}
              placeholder="Aktivite seç veya yaz..."
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">Süre</p>
            <div className="relative">
              <input
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="örn. 45"
                value={manualDuration}
                onChange={e => setManualDuration(e.target.value)}
                className="w-full bg-surface-700 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg font-semibold pr-20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">
                dakika
              </span>
            </div>
            {manualDuration && (
              <p className="text-xs text-surface-500 mt-1 ml-1">
                = {formatDuration(parseInt(manualDuration) || 0)}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">Ruh Hali</p>
            <MoodPicker value={manualMood} onChange={setManualMood} />
          </div>

          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">Not (isteğe bağlı)</p>
            <textarea
              value={manualNotes}
              onChange={e => setManualNotes(e.target.value)}
              placeholder="Bu aktivite hakkında..."
              rows={2}
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowManual(false)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-surface-300 bg-surface-700 hover:bg-surface-600 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!manualActivity || !manualDuration || saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              style={{
                background: saved
                  ? 'linear-gradient(135deg,#10b981,#059669)'
                  : 'linear-gradient(135deg,#22c55e,#16a34a)',
                boxShadow: '0 4px 20px rgba(34,197,94,0.25)',
              }}
            >
              {saved ? '✓ Kaydedildi!' : saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
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

      {/* ── Quick entry widget (today only) ───────────── */}
      {isToday && <QuickEntryCard />}

      {/* ── Hero stat card ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5">
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
                ? 'Yukarıdan hızlıca bir aktivite başlat'
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
