import { useState, useEffect, useRef } from 'react'
import { Play, Plus, ChevronDown, ChevronUp, X, Square, Coffee } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ActiveTimerFull, StopTimerModal } from '../components/timer/ActiveTimer'
import { ActivitySearch } from '../components/ui/ActivitySearch'
import { Input, Textarea } from '../components/ui/Input'
import { MoodPicker } from '../components/ui/MoodPicker'
import { todayString } from '../lib/utils'
import { PRESET_ACTIVITIES, CATEGORY_COLORS } from '../lib/constants'

const QUICK_ACTIVITIES = [
  'Çalışma', 'Spor', 'Kitap Okuma', 'Meditasyon',
  'Koşu', 'Sosyal Medya', 'Ders Çalışma', 'Yemek Pişirme',
]

const POMODORO_WORK = 25 * 60

function QuickChip({ activity, onSelect }) {
  const preset = PRESET_ACTIVITIES.find(p => p.name === activity.name)
  const color = CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom

  return (
    <button
      type="button"
      onClick={() => onSelect(activity)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all active:scale-95 whitespace-nowrap"
      style={{
        borderColor: `${color}50`,
        backgroundColor: `${color}12`,
        color,
      }}
    >
      <span>{preset?.emoji ?? '📌'}</span>
      <span>{activity.name}</span>
    </button>
  )
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')

  function addTag() {
    const raw = input.trim().replace(/,/g, '')
    if (!raw) return
    const tag = raw.startsWith('#') ? raw : `#${raw}`
    if (!tags.includes(tag)) onChange([...tags, tag])
    setInput('')
  }

  function removeTag(t) { onChange(tags.filter(x => x !== t)) }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div>
      <p className="text-xs text-surface-500 mb-2">Etiketler (isteğe bağlı)</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(t => (
            <span
              key={t}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-500/15 text-primary-300 text-xs font-medium"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="text-primary-400/60 hover:text-primary-300 leading-none"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder="#kodlama, #proje... (Enter ile ekle)"
        className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  )
}

function PomodoroCircle({ timeLeft, total, pomodoroState }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const progress = timeLeft / total
  const offset = circ * (1 - progress)
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const isWork = pomodoroState === 'work'
  const color = isWork ? '#0ea5e9' : '#10b981'
  const label = isWork ? 'ÇALIŞMA' : 'MOLA'

  return (
    <div className="flex flex-col items-center py-4">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 0.9s linear' }}
        />
        <text x="64" y="58" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="ui-monospace, monospace">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </text>
        <text x="64" y="78" textAnchor="middle" fill={color} fontSize="11" fontWeight="600" letterSpacing="1">
          {label}
        </text>
      </svg>
    </div>
  )
}

function PomodoroActiveCard({ onStop }) {
  const { pomodoroState, pomodoroTimeLeft, pomodoroActivity, stopPomodoro } = useApp()
  const total = pomodoroState === 'work' ? POMODORO_WORK : 5 * 60

  async function handleStop() {
    stopPomodoro()
    if (onStop) onStop()
  }

  return (
    <section className="bg-surface-800 border border-primary-500/30 rounded-2xl overflow-hidden">
      <div className="h-0.5 w-full bg-gradient-to-r from-primary-500 to-cyan-400" />
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🍅</span>
            <span className="text-sm font-semibold text-white">Pomodoro Çalışıyor</span>
          </div>
          {pomodoroActivity?.activityIdOrName && (
            <span className="text-xs text-surface-400 truncate max-w-[120px]">
              {pomodoroActivity.activityIdOrName}
            </span>
          )}
        </div>
      </div>

      <PomodoroCircle
        timeLeft={pomodoroTimeLeft}
        total={total}
        pomodoroState={pomodoroState}
      />

      {pomodoroActivity?.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {pomodoroActivity.tags.map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-300">{t}</span>
          ))}
        </div>
      )}

      <div className="px-4 pb-4">
        <button
          onClick={handleStop}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-red-300 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 transition-all active:scale-[0.98]"
        >
          <Square size={14} />
          Durdur
        </button>
      </div>
    </section>
  )
}

export function TimerPage() {
  const {
    startTimer, addManualLog, activeTimers, activities,
    pomodoroState, startPomodoro, stopPomodoro,
  } = useApp()

  const [selected, setSelected] = useState('')
  const [tags, setTags] = useState([])
  const [isPomodoroMode, setIsPomodoroMode] = useState(false)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(null)
  const [showManual, setShowManual] = useState(false)

  const [manualActivity, setManualActivity] = useState('')
  const [manualDate, setManualDate] = useState(todayString())
  const [manualDuration, setManualDuration] = useState('')
  const [manualMood, setManualMood] = useState(null)
  const [manualNotes, setManualNotes] = useState('')
  const [manualTags, setManualTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const pomodoroRunning = pomodoroState === 'work' || pomodoroState === 'break'

  const quickOptions = QUICK_ACTIVITIES.map(name => {
    const db = activities.find(a => a.name === name)
    return db ? { id: db.id, name } : { id: null, name }
  })

  async function handleStart() {
    if (!selected) return
    setStarting(true)
    try {
      if (isPomodoroMode) {
        startPomodoro(selected, tags)
        await startTimer(selected, { tags, isPomodoro: true })
      } else {
        await startTimer(selected, { tags, isPomodoro: false })
      }
      setSelected('')
      setTags([])
    } catch (e) {
      console.error(e)
    } finally {
      setStarting(false)
    }
  }

  async function handleManualLog(e) {
    e.preventDefault()
    if (!manualActivity || !manualDuration) return
    setSaving(true)
    try {
      await addManualLog({
        activityIdOrName: manualActivity,
        date: manualDate,
        durationMinutes: parseInt(manualDuration),
        mood: manualMood,
        notes: manualNotes,
        tags: manualTags,
      })
      setManualActivity('')
      setManualDuration('')
      setManualMood(null)
      setManualNotes('')
      setManualDate(todayString())
      setManualTags([])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const alreadyRunning = activeTimers.some(t => {
    const name = t.activities?.name ?? ''
    return name === selected || t.activity_id === selected
  })

  return (
    <div className="space-y-5">

      {/* ── Pomodoro active display ───────────────────── */}
      {pomodoroRunning && (
        <PomodoroActiveCard onStop={() => {}} />
      )}

      {/* ── Active timers ─────────────────────────────── */}
      {activeTimers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-widest">
              Aktif Sayaçlar
            </h2>
            <span className="text-xs font-semibold text-primary-400 bg-primary-500/15 px-2 py-0.5 rounded-full">
              {activeTimers.length} çalışıyor
            </span>
          </div>
          {activeTimers.map(t => (
            <ActiveTimerFull key={t.id} timer={t} onStop={setStopping} />
          ))}
        </section>
      )}

      {/* ── New timer ─────────────────────────────────── */}
      <section className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-surface-700/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white text-base">Zamanlayıcı Başlat</h2>
              <p className="text-xs text-surface-500 mt-0.5">
                {isPomodoroMode ? '25 dk çalışma / 5 dk mola döngüsü' : 'Birden fazla aktiviteyi aynı anda takip edin'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPomodoroMode(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isPomodoroMode
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                  : 'bg-surface-700 border-surface-600 text-surface-400 hover:text-surface-200'
              }`}
            >
              <span>🍅</span>
              Pomodoro
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick chips */}
          <div>
            <p className="text-xs text-surface-500 mb-2">Hızlı seç</p>
            <div className="flex flex-wrap gap-2">
              {quickOptions.map(opt => (
                <QuickChip
                  key={opt.name}
                  activity={opt}
                  onSelect={o => setSelected(o.id || o.name)}
                />
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <p className="text-xs text-surface-500 mb-2">Ara veya yeni ekle</p>
            <ActivitySearch
              value={selected}
              onChange={setSelected}
              placeholder="Aktivite ara veya yaz..."
            />
          </div>

          {/* Tag input */}
          <TagInput tags={tags} onChange={setTags} />

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!selected || starting || alreadyRunning || pomodoroRunning}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            style={{
              background: selected && !alreadyRunning && !pomodoroRunning
                ? isPomodoroMode
                  ? 'linear-gradient(135deg, #f97316, #ea580c)'
                  : 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                : undefined,
              backgroundColor: (!selected || alreadyRunning || pomodoroRunning) ? '#1e293b' : undefined,
              color: selected && !alreadyRunning && !pomodoroRunning ? '#fff' : '#64748b',
              boxShadow: selected && !alreadyRunning && !pomodoroRunning
                ? isPomodoroMode
                  ? '0 4px 24px rgba(249,115,22,0.35)'
                  : '0 4px 24px rgba(14,165,233,0.35)'
                : undefined,
            }}
          >
            {isPomodoroMode ? <span className="text-base">🍅</span> : <Play size={18} strokeWidth={2.5} />}
            {starting
              ? 'Başlatılıyor...'
              : pomodoroRunning
              ? 'Pomodoro çalışıyor'
              : alreadyRunning
              ? 'Zaten çalışıyor'
              : isPomodoroMode
              ? 'Pomodoro Başlat'
              : 'Başlat'}
          </button>
        </div>
      </section>

      {/* ── Manual entry (collapsible) ─────────────────── */}
      <section className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          onClick={() => setShowManual(v => !v)}
        >
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-green-400" />
            <span className="font-semibold text-white text-sm">Manuel Kayıt Ekle</span>
          </div>
          {showManual
            ? <ChevronUp size={16} className="text-surface-400" />
            : <ChevronDown size={16} className="text-surface-400" />
          }
        </button>

        {showManual && (
          <form onSubmit={handleManualLog} className="px-4 pb-4 space-y-4 border-t border-surface-700/60 pt-4">
            <ActivitySearch
              value={manualActivity}
              onChange={setManualActivity}
              placeholder="Aktivite seç veya yaz..."
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tarih"
                type="date"
                value={manualDate}
                max={todayString()}
                onChange={e => setManualDate(e.target.value)}
              />
              <Input
                label="Süre (dk)"
                type="number"
                min={1}
                placeholder="30"
                value={manualDuration}
                onChange={e => setManualDuration(e.target.value)}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-surface-300 mb-2.5">Ruh hali</p>
              <MoodPicker value={manualMood} onChange={setManualMood} />
            </div>

            <Textarea
              label="Notlar (isteğe bağlı)"
              placeholder="Bu aktivite hakkında..."
              value={manualNotes}
              onChange={e => setManualNotes(e.target.value)}
              rows={2}
            />

            <TagInput tags={manualTags} onChange={setManualTags} />

            <button
              type="submit"
              disabled={!manualActivity || !manualDuration || saving}
              className="w-full py-3 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              style={{
                background: saved
                  ? 'linear-gradient(135deg,#10b981,#059669)'
                  : 'linear-gradient(135deg,#22c55e,#16a34a)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(34,197,94,0.25)',
              }}
            >
              {saved ? '✓ Kaydedildi!' : saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        )}
      </section>

      {/* Stop modal */}
      <StopTimerModal timer={stopping} onClose={() => setStopping(null)} />
    </div>
  )
}
