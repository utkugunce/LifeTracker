import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Clock, Flame, CalendarDays,
  Play, Plus, Zap, Check,
} from 'lucide-react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useApp } from '../context/AppContext'
import { ActiveTimers } from '../components/timer/ActiveTimer'
import { LogCard } from '../components/logs/LogCard'
import { Modal } from '../components/ui/Modal'
import { ActivitySearch } from '../components/ui/ActivitySearch'
import { MoodPicker } from '../components/ui/MoodPicker'
import { Input } from '../components/ui/Input'
import { formatDuration, todayString } from '../lib/utils'
import { CATEGORY_COLORS, PRESET_ACTIVITIES, MOOD_OPTIONS } from '../lib/constants'

function getColor(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom
}

function getEmoji(name) {
  return PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())?.emoji ?? '📌'
}

function getMoodEmoji(value) {
  return MOOD_OPTIONS.find(m => m.value === value)?.emoji ?? ''
}

const QUICK_CHIPS = [
  'Çalışma', 'Spor', 'Kitap Okuma', 'Koşu',
  'Sosyal Medya', 'Ders Çalışma',
]

function QuickEntry({ onTimerStarted }) {
  const { startTimer, addManualLog, activeTimers, activities } = useApp()
  const [starting, setStarting] = useState(null)
  const [started, setStarted] = useState(null)
  const [showManual, setShowManual] = useState(false)

  const [manualActivity, setManualActivity] = useState('')
  const [manualDuration, setManualDuration] = useState('')
  const [manualMood, setManualMood] = useState(null)
  const [manualNotes, setManualNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function quickStart(name) {
    const db = activities.find(a => a.name === name)
    const idOrName = db?.id || name

    const alreadyRunning = activeTimers.some(t =>
      t.activities?.name === name || t.activity_id === idOrName
    )
    if (alreadyRunning) return

    setStarting(name)
    try {
      await startTimer(idOrName)
      setStarted(name)
      setTimeout(() => setStarted(null), 1500)
      onTimerStarted?.()
    } catch (e) {
      console.error(e)
    } finally {
      setStarting(null)
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
      <section className="bg-surface-800 border border-surface-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-widest">Hızlı Giriş</h2>
          </div>
          <button
            onClick={() => setShowManual(true)}
            className="flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
          >
            <Plus size={12} />
            Manuel Ekle
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {QUICK_CHIPS.map(name => {
            const running = isRunning(name)
            const isStarting = starting === name
            const justStarted = started === name
            const emoji = getEmoji(name)
            const color = getColor(name)

            return (
              <button
                key={name}
                onClick={() => quickStart(name)}
                disabled={running || isStarting}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                style={{
                  borderColor: running ? `${color}60` : justStarted ? '#10b98160' : '#334155',
                  backgroundColor: running ? `${color}15` : justStarted ? '#10b98115' : 'transparent',
                }}
              >
                <span className="text-lg">{justStarted ? '✓' : emoji}</span>
                <span className="text-[11px] font-medium text-surface-300 leading-tight text-center truncate w-full">
                  {name}
                </span>
                {running && (
                  <span className="flex items-center gap-0.5 text-[9px] font-semibold" style={{ color }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                    Aktif
                  </span>
                )}
                {!running && !justStarted && (
                  <Play size={10} className="text-surface-500" />
                )}
              </button>
            )
          })}
        </div>
      </section>

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

      {/* ── Quick entry (today only) ──────────────────── */}
      {isToday && <QuickEntry />}

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
