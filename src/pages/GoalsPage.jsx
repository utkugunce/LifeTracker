import { useState, useMemo } from 'react'
import { Plus, Target, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO } from 'date-fns'
import { useApp } from '../context/AppContext'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { ActivitySearch } from '../components/ui/ActivitySearch'
import { formatDuration } from '../lib/utils'

function GoalProgress({ goal, logs }) {
  const now = new Date()
  let start, end

  if (goal.period === 'weekly') {
    start = startOfWeek(now, { weekStartsOn: 1 })
    end = endOfWeek(now, { weekStartsOn: 1 })
  } else {
    start = startOfMonth(now)
    end = endOfMonth(now)
  }

  const periodLogs = logs.filter(l => {
    if (l.activity_id !== goal.activity_id) return false
    const d = parseISO(l.log_date)
    return d >= start && d <= end
  })

  const spentMinutes = periodLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)
  const target = goal.target_minutes
  const pct = Math.min(100, Math.round((spentMinutes / target) * 100))
  const isLimit = goal.type === 'limit'
  const exceeded = isLimit && spentMinutes > target
  const achieved = !isLimit && spentMinutes >= target

  const color = exceeded ? '#ef4444' : achieved ? '#10b981' : isLimit ? '#f59e0b' : '#0ea5e9'
  const Icon = exceeded ? AlertTriangle : achieved ? CheckCircle : Target

  return (
    <div className="flex items-start gap-3 p-3.5 bg-surface-800 rounded-2xl border border-surface-700">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div>
            <p className="font-medium text-white text-sm leading-tight">
              {goal.activities?.name}
            </p>
            <p className="text-xs text-surface-500">
              {goal.type === 'target' ? 'Hedef' : 'Limit'} · {goal.period === 'weekly' ? 'Haftalık' : 'Aylık'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono font-semibold" style={{ color }}>
              {formatDuration(spentMinutes)}
            </p>
            <p className="text-xs text-surface-500">/ {formatDuration(target)}</p>
          </div>
        </div>
        <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        {exceeded && (
          <p className="text-xs text-red-400 mt-1">
            Limiti {formatDuration(spentMinutes - target)} aştınız!
          </p>
        )}
        {achieved && (
          <p className="text-xs text-green-400 mt-1">Hedef tamamlandı! 🎉</p>
        )}
      </div>
      <button
        onClick={() => goal.onDelete?.(goal.id)}
        className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export function GoalsPage() {
  const { goals, logs, addGoal, deleteGoal } = useApp()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ activity: '', type: 'target', targetMinutes: '', period: 'weekly' })
  const [saving, setSaving] = useState(false)

  const goalsWithDelete = useMemo(() =>
    goals.map(g => ({ ...g, onDelete: deleteGoal })),
    [goals, deleteGoal],
  )

  const targets = goalsWithDelete.filter(g => g.type === 'target')
  const limits = goalsWithDelete.filter(g => g.type === 'limit')

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.activity || !form.targetMinutes) return
    setSaving(true)
    try {
      await addGoal({
        activityIdOrName: form.activity,
        type: form.type,
        targetMinutes: parseInt(form.targetMinutes),
        period: form.period,
      })
      setForm({ activity: '', type: 'target', targetMinutes: '', period: 'weekly' })
      setAdding(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Hedefler & Limitler</h1>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus size={16} />
          Ekle
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-16 text-surface-500">
          <Target size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-surface-400">Henüz hedef yok</p>
          <p className="text-sm mt-1">Haftalık veya aylık hedefler ekleyin</p>
          <Button className="mt-4" onClick={() => setAdding(true)}>
            <Plus size={16} /> İlk Hedefi Ekle
          </Button>
        </div>
      ) : (
        <>
          {targets.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-2">
                Hedefler ({targets.length})
              </h2>
              <div className="space-y-2">
                {targets.map(g => <GoalProgress key={g.id} goal={g} logs={logs} />)}
              </div>
            </div>
          )}
          {limits.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-2">
                Limitler ({limits.length})
              </h2>
              <div className="space-y-2">
                {limits.map(g => <GoalProgress key={g.id} goal={g} logs={logs} />)}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Hedef / Limit Ekle">
        <form onSubmit={handleAdd} className="space-y-4">
          <ActivitySearch
            value={form.activity}
            onChange={v => setForm(f => ({ ...f, activity: v }))}
            placeholder="Aktivite seç..."
          />
          <div>
            <p className="text-sm font-medium text-surface-300 mb-2">Tür</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'target', label: '🎯 Hedef', desc: 'Minimum süre' },
                { value: 'limit', label: '⚠️ Limit', desc: 'Maximum süre' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.type === opt.value
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-surface-600 bg-surface-700 hover:border-surface-500'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{opt.label}</p>
                  <p className="text-xs text-surface-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Süre (dakika)"
              type="number"
              min={1}
              placeholder="120"
              value={form.targetMinutes}
              onChange={e => setForm(f => ({ ...f, targetMinutes: e.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-surface-300">Periyot</label>
              <select
                className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
              >
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setAdding(false)}>
              İptal
            </Button>
            <Button className="flex-1" type="submit" disabled={saving || !form.activity || !form.targetMinutes}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
