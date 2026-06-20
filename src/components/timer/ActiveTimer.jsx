import { useState, useEffect } from 'react'
import { Square, Pause } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatElapsed } from '../../lib/utils'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { MoodPicker } from '../ui/MoodPicker'
import { Textarea } from '../ui/Input'
import { PRESET_ACTIVITIES, CATEGORY_COLORS } from '../../lib/constants'

function getActivityEmoji(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return preset?.emoji ?? '⏱️'
}

function getActivityColor(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom
}

function TimerCard({ timer, onStop }) {
  const [elapsed, setElapsed] = useState(formatElapsed(timer.start_time))

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(timer.start_time))
    }, 1000)
    return () => clearInterval(interval)
  }, [timer.start_time])

  const name = timer.activities?.name ?? 'Bilinmiyor'
  const color = getActivityColor(name)

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
    >
      <span className="text-2xl">{getActivityEmoji(name)}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">{name}</p>
        <p className="text-xs font-mono" style={{ color }}>{elapsed}</p>
      </div>
      <button
        onClick={() => onStop(timer)}
        className="p-2 rounded-xl transition-all active:scale-90"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Square size={18} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export function ActiveTimers() {
  const { activeTimers, stopTimer } = useApp()
  const [stopping, setStopping] = useState(null)
  const [mood, setMood] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleStop() {
    if (!stopping) return
    setSubmitting(true)
    try {
      await stopTimer(stopping.id, mood, notes)
      setStopping(null)
      setMood(null)
      setNotes('')
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (activeTimers.length === 0) return null

  return (
    <>
      <div className="space-y-2">
        {activeTimers.map(timer => (
          <TimerCard key={timer.id} timer={timer} onStop={setStopping} />
        ))}
      </div>

      <Modal
        open={!!stopping}
        onClose={() => setStopping(null)}
        title="Zamanlayıcıyı Durdur"
      >
        <div className="space-y-4">
          <p className="text-surface-300 text-sm">
            <strong className="text-white">{stopping?.activities?.name}</strong> aktivitesini tamamladınız. Nasıldı?
          </p>
          <div>
            <p className="text-sm font-medium text-surface-300 mb-2">Ruh hali</p>
            <MoodPicker value={mood} onChange={setMood} />
          </div>
          <Textarea
            label="Notlar (isteğe bağlı)"
            placeholder="Bu aktivite hakkında düşünceleriniz..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStopping(null)}>
              İptal
            </Button>
            <Button className="flex-1" onClick={handleStop} disabled={submitting}>
              {submitting ? 'Kaydediliyor...' : 'Tamamla'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
