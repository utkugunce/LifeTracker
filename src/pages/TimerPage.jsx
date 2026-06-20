import { useState } from 'react'
import { Play, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ActiveTimerFull, StopTimerModal } from '../components/timer/ActiveTimer'
import { ActivitySearch } from '../components/ui/ActivitySearch'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { MoodPicker } from '../components/ui/MoodPicker'
import { todayString } from '../lib/utils'
import { PRESET_ACTIVITIES, CATEGORY_COLORS } from '../lib/constants'

// Quick-launch activity chips
const QUICK_ACTIVITIES = [
  'Çalışma', 'Spor', 'Kitap Okuma', 'Meditasyon',
  'Koşu', 'Sosyal Medya', 'Ders Çalışma', 'Yemek Pişirme',
]

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

export function TimerPage() {
  const { startTimer, addManualLog, activeTimers, activities } = useApp()

  const [selected, setSelected] = useState('')
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(null)
  const [showManual, setShowManual] = useState(false)

  // Manual form
  const [manualActivity, setManualActivity] = useState('')
  const [manualDate, setManualDate] = useState(todayString())
  const [manualDuration, setManualDuration] = useState('')
  const [manualMood, setManualMood] = useState(null)
  const [manualNotes, setManualNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const quickOptions = QUICK_ACTIVITIES.map(name => {
    const db = activities.find(a => a.name === name)
    return db ? { id: db.id, name } : { id: null, name }
  })

  async function handleStart() {
    if (!selected) return
    setStarting(true)
    try {
      await startTimer(selected)
      setSelected('')
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
      })
      setManualActivity('')
      setManualDuration('')
      setManualMood(null)
      setManualNotes('')
      setManualDate(todayString())
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
        {/* Title bar */}
        <div className="px-4 pt-4 pb-3 border-b border-surface-700/60">
          <h2 className="font-semibold text-white text-base">Zamanlayıcı Başlat</h2>
          <p className="text-xs text-surface-500 mt-0.5">
            Birden fazla aktiviteyi aynı anda takip edebilirsiniz
          </p>
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

          {/* Search / custom */}
          <div>
            <p className="text-xs text-surface-500 mb-2">Ara veya yeni ekle</p>
            <ActivitySearch
              value={selected}
              onChange={setSelected}
              placeholder="Aktivite ara veya yaz..."
            />
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!selected || starting || alreadyRunning}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            style={{
              background: selected && !alreadyRunning
                ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                : undefined,
              backgroundColor: !selected || alreadyRunning ? '#1e293b' : undefined,
              color: selected && !alreadyRunning ? '#fff' : '#64748b',
              boxShadow: selected && !alreadyRunning
                ? '0 4px 24px rgba(14,165,233,0.35)'
                : undefined,
            }}
          >
            <Play size={18} strokeWidth={2.5} />
            {starting
              ? 'Başlatılıyor...'
              : alreadyRunning
              ? 'Zaten çalışıyor'
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
