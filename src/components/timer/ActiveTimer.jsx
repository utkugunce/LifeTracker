import { useState, useEffect } from 'react'
import { Square } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatElapsed } from '../../lib/utils'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { MoodPicker } from '../ui/MoodPicker'
import { Textarea } from '../ui/Input'
import { PRESET_ACTIVITIES, CATEGORY_COLORS } from '../../lib/constants'

function getActivityMeta(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return {
    emoji: preset?.emoji ?? '⏱️',
    color: CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom,
  }
}

// Compact card — used on Dashboard
export function ActiveTimerCompact({ timer, onStop }) {
  const [elapsed, setElapsed] = useState(formatElapsed(timer.start_time))
  useEffect(() => {
    const id = setInterval(() => setElapsed(formatElapsed(timer.start_time)), 1000)
    return () => clearInterval(id)
  }, [timer.start_time])

  const name = timer.activities?.name ?? 'Bilinmiyor'
  const { emoji, color } = getActivityMeta(name)

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
    >
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">{name}</p>
        <p className="font-mono text-xs font-semibold" style={{ color }}>{elapsed}</p>
      </div>
      <button
        onClick={() => onStop(timer)}
        className="p-2 rounded-xl active:scale-90 transition-transform"
        style={{ backgroundColor: `${color}25`, color }}
      >
        <Square size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// Full card — used on TimerPage
export function ActiveTimerFull({ timer, onStop }) {
  const [elapsed, setElapsed] = useState(formatElapsed(timer.start_time))
  useEffect(() => {
    const id = setInterval(() => setElapsed(formatElapsed(timer.start_time)), 1000)
    return () => clearInterval(id)
  }, [timer.start_time])

  const name = timer.activities?.name ?? 'Bilinmiyor'
  const { emoji, color } = getActivityMeta(name)

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: `${color}50`, backgroundColor: `${color}0d` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Pulsing dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: color }}
            />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
            Çalışıyor
          </span>
        </div>
        <button
          onClick={() => onStop(timer)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ backgroundColor: `${color}25`, color }}
        >
          <Square size={12} strokeWidth={3} />
          Durdur
        </button>
      </div>

      {/* Activity */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <p className="font-semibold text-white text-base leading-tight">{name}</p>
          <p
            className="font-mono text-2xl font-bold tracking-tight mt-0.5"
            style={{ color }}
          >
            {elapsed}
          </p>
        </div>
      </div>
    </div>
  )
}

// Stop modal — shared
export function StopTimerModal({ timer, onClose }) {
  const { stopTimer } = useApp()
  const [mood, setMood] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const name = timer?.activities?.name ?? ''
  const { emoji, color } = getActivityMeta(name)

  async function handleStop() {
    setSubmitting(true)
    try {
      await stopTimer(timer.id, mood, notes)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={!!timer} onClose={onClose} title="Aktiviteyi Tamamla">
      <div className="space-y-5">
        {/* Activity summary */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
        >
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-semibold text-white">{name}</p>
            <p className="text-xs text-surface-400">Nasıl geçti?</p>
          </div>
        </div>

        {/* Mood */}
        <div>
          <p className="text-sm font-medium text-surface-300 mb-2.5">Ruh hali</p>
          <MoodPicker value={mood} onChange={setMood} />
        </div>

        {/* Notes */}
        <Textarea
          label="Notlar (isteğe bağlı)"
          placeholder="Bu aktivite hakkında düşünceleriniz..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
            İptal
          </Button>
          <Button className="flex-1" onClick={handleStop} disabled={submitting}>
            {submitting ? 'Kaydediliyor...' : 'Tamamla ✓'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Legacy export used by DashboardPage
export function ActiveTimers() {
  const { activeTimers } = useApp()
  const [stopping, setStopping] = useState(null)

  if (activeTimers.length === 0) return null

  return (
    <>
      <div className="space-y-2">
        {activeTimers.map(t => (
          <ActiveTimerCompact key={t.id} timer={t} onStop={setStopping} />
        ))}
      </div>
      <StopTimerModal timer={stopping} onClose={() => setStopping(null)} />
    </>
  )
}
