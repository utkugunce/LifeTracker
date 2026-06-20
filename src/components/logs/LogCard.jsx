import { useState } from 'react'
import { Pencil, Trash2, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatDuration, formatTime } from '../../lib/utils'
import { PRESET_ACTIVITIES, CATEGORY_COLORS, MOOD_OPTIONS } from '../../lib/constants'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { MoodPicker } from '../ui/MoodPicker'

function getActivityMeta(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return {
    emoji: preset?.emoji ?? '📌',
    color: CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom,
  }
}

function getMoodEmoji(value) {
  return MOOD_OPTIONS.find(m => m.value === value)?.emoji ?? ''
}

export function LogCard({ log }) {
  const { updateLog, deleteLog } = useApp()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [form, setForm] = useState({ duration_minutes: log.duration_minutes, mood: log.mood, notes: log.notes || '' })
  const [saving, setSaving] = useState(false)

  const name = log.activities?.name ?? 'Bilinmiyor'
  const { emoji, color } = getActivityMeta(name)

  async function handleSave() {
    setSaving(true)
    try {
      await updateLog(log.id, form)
      setEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteLog(log.id)
      setConfirming(false)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 p-3.5 bg-surface-800 rounded-2xl border border-surface-700">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-white text-sm leading-tight">{name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-surface-400">
                  <Clock size={11} />
                  {formatDuration(log.duration_minutes)}
                </span>
                {log.mood && (
                  <span className="text-xs">{getMoodEmoji(log.mood)}</span>
                )}
                {log.start_time && (
                  <span className="text-xs text-surface-500">{formatTime(log.start_time)}</span>
                )}
              </div>
              {log.notes && (
                <p className="text-xs text-surface-400 mt-1 line-clamp-2">{log.notes}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => { setForm({ duration_minutes: log.duration_minutes, mood: log.mood, notes: log.notes || '' }); setEditing(true) }}
                className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-700 transition-all"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Kaydı Düzenle">
        <div className="space-y-4">
          <Input
            label="Süre (dakika)"
            type="number"
            min={1}
            value={form.duration_minutes}
            onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
          />
          <div>
            <p className="text-sm font-medium text-surface-300 mb-2">Ruh hali</p>
            <MoodPicker value={form.mood} onChange={mood => setForm(f => ({ ...f, mood }))} />
          </div>
          <Textarea
            label="Notlar"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>İptal</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Kaydı Sil">
        <div className="space-y-4">
          <p className="text-surface-300">
            <strong className="text-white">{name}</strong> kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>İptal</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Sil</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
