import { useState, useMemo } from 'react'
import {
  Plus, Target, AlertTriangle, CheckCircle2, Trash2,
  TrendingUp, ShieldAlert, Calendar, Clock, X,
} from 'lucide-react'
import { startOfWeek, startOfMonth, parseISO, isWithinInterval, endOfWeek, endOfMonth } from 'date-fns'
import { useApp } from '../context/AppContext'
import { Modal } from '../components/ui/Modal'
import { ActivitySearch } from '../components/ui/ActivitySearch'
import { formatDuration } from '../lib/utils'
import { PRESET_ACTIVITIES, CATEGORY_COLORS } from '../lib/constants'

function getActivityMeta(name) {
  const preset = PRESET_ACTIVITIES.find(p => p.name.toLowerCase() === name?.toLowerCase())
  return {
    emoji: preset?.emoji ?? '📌',
    color: CATEGORY_COLORS[preset?.category] ?? CATEGORY_COLORS.custom,
  }
}

function calcProgress(goal, logs) {
  const now = new Date()
  const isWeekly = goal.period === 'weekly'
  const start = isWeekly ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now)
  const end = isWeekly ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now)

  const spent = logs
    .filter(l => {
      if (l.activity_id !== goal.activity_id) return false
      try {
        const d = parseISO(l.log_date)
        return isWithinInterval(d, { start, end })
      } catch {
        return false
      }
    })
    .reduce((s, l) => s + (l.duration_minutes || 0), 0)

  const target = goal.target_minutes
  const ratio = target > 0 ? spent / target : 0
  const pct = Math.min(100, Math.round(ratio * 100))
  const isLimit = goal.type === 'limit'
  const exceeded = isLimit && spent > target
  const achieved = !isLimit && spent >= target

  let barColor
  if (isLimit) {
    barColor = exceeded ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981'
  } else {
    barColor = achieved ? '#10b981' : '#0ea5e9'
  }

  return { spent, target, pct, isLimit, exceeded, achieved, barColor }
}

function GoalCard({ goal, logs, onDelete }) {
  const { spent, target, pct, isLimit, exceeded, achieved, barColor } = calcProgress(goal, logs)
  const name = goal.activities?.name ?? 'Bilinmiyor'
  const { emoji, color } = getActivityMeta(name)
  const remaining = target - spent

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden">
      <div className="h-0.5 w-full" style={{ backgroundColor: barColor }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: `${color}18` }}
          >
            {emoji}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm leading-tight truncate">{name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${barColor}18`, color: barColor }}
              >
                {isLimit
                  ? <><ShieldAlert size={10} />Limit</>
                  : <><TrendingUp size={10} />Hedef</>}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-surface-700 text-surface-400 font-medium">
                <Calendar size={10} />
                {goal.period === 'weekly' ? 'Haftalık' : 'Aylık'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onDelete(goal)}
            className="p-1.5 rounded-lg text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 mt-0.5"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-end justify-between mt-4 mb-2">
          <div>
            <span className="text-2xl font-bold text-white">{formatDuration(spent)}</span>
            <span className="text-sm text-surface-500 ml-1">/ {formatDuration(target)}</span>
          </div>
          <span className="text-xl font-bold tabular-nums" style={{ color: barColor }}>
            {pct}%
          </span>
        </div>

        <div className="h-2.5 bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>

        <div className="mt-2.5">
          {exceeded && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
              <AlertTriangle size={12} />
              Limiti {formatDuration(spent - target)} aştınız!
            </div>
          )}
          {achieved && !isLimit && (
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
              <CheckCircle2 size={12} />
              Hedef tamamlandı!
            </div>
          )}
          {!exceeded && !achieved && (
            <div className="flex items-center gap-1.5 text-surface-500 text-xs">
              <Clock size={11} />
              {isLimit
                ? `${formatDuration(remaining)} daha kullanabilirsin`
                : `${formatDuration(remaining)} daha gerekiyor`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryStrip({ goals, logs }) {
  const stats = useMemo(() => {
    let achieved = 0, exceeded = 0
    goals.forEach(g => {
      const p = calcProgress(g, logs)
      if (p.achieved && !p.isLimit) achieved++
      if (p.exceeded && p.isLimit) exceeded++
    })
    return { achieved, exceeded, total: goals.length }
  }, [goals, logs])

  if (stats.total === 0) return null

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-surface-800 border border-surface-700 rounded-2xl p-3 text-center">
        <p className="text-xl font-bold text-white">{stats.total}</p>
        <p className="text-xs text-surface-500 mt-0.5">Toplam</p>
      </div>
      <div className="bg-surface-800 border border-green-500/20 rounded-2xl p-3 text-center">
        <p className="text-xl font-bold text-green-400">{stats.achieved}</p>
        <p className="text-xs text-surface-500 mt-0.5">Tamamlandı</p>
      </div>
      <div className="bg-surface-800 border border-red-500/20 rounded-2xl p-3 text-center">
        <p className="text-xl font-bold text-red-400">{stats.exceeded}</p>
        <p className="text-xs text-surface-500 mt-0.5">Aşıldı</p>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ open, goal, onConfirm, onClose }) {
  if (!open || !goal) return null
  const name = goal.activities?.name ?? 'Bilinmiyor'
  const { emoji } = getActivityMeta(name)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-800 border border-surface-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Hedefi Sil</h3>
          <p className="text-sm text-surface-400">
            <span className="text-white font-medium">{emoji} {name}</span> hedefini silmek istediğinize emin misiniz?
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-surface-300 bg-surface-700 hover:bg-surface-600 transition-all"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-[0.98]"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_FORM = { activity: '', type: 'target', targetMinutes: '', period: 'weekly' }

function AddGoalModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.activity || !form.targetMinutes) return
    setSaving(true)
    try {
      await onSave({
        activityIdOrName: form.activity,
        type: form.type,
        targetMinutes: parseInt(form.targetMinutes),
        period: form.period,
      })
      setForm(EMPTY_FORM)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function handleClose() { setForm(EMPTY_FORM); onClose() }

  return (
    <Modal open={open} onClose={handleClose} title="Yeni Hedef / Limit">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">Aktivite</p>
          <ActivitySearch
            value={form.activity}
            onChange={v => set('activity', v)}
            placeholder="Aktivite seç veya yaz..."
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">Tür</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                value: 'target',
                icon: TrendingUp,
                label: 'Minimum Hedef',
                desc: 'En az bu kadar yap',
                activeColor: 'border-green-500 bg-green-500/15',
                iconColor: 'text-green-400',
              },
              {
                value: 'limit',
                icon: ShieldAlert,
                label: 'Maksimum Limit',
                desc: 'En fazla bu kadar yap',
                activeColor: 'border-orange-500 bg-orange-500/15',
                iconColor: 'text-orange-400',
              },
            ].map(opt => {
              const Icon = opt.icon
              const active = form.type === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('type', opt.value)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    active ? opt.activeColor : 'border-surface-600 bg-surface-700 hover:border-surface-500'
                  }`}
                >
                  <Icon size={18} className={active ? opt.iconColor : 'text-surface-500'} />
                  <p className="text-sm font-semibold text-white mt-2 leading-tight">{opt.label}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{opt.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">Periyot</p>
          <div className="flex bg-surface-700 rounded-xl p-1">
            {[
              { value: 'weekly', label: 'Haftalık' },
              { value: 'monthly', label: 'Aylık' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('period', opt.value)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  form.period === opt.value
                    ? 'bg-primary-500 text-white shadow'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-2">Süre Hedefi</p>
          <div className="relative">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="örn. 120"
              value={form.targetMinutes}
              onChange={e => set('targetMinutes', e.target.value)}
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg font-semibold pr-20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">
              dakika
            </span>
          </div>
          {form.targetMinutes && (
            <p className="text-xs text-surface-500 mt-1.5 ml-1">
              = {formatDuration(parseInt(form.targetMinutes) || 0)}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-surface-300 bg-surface-700 hover:bg-surface-600 transition-all"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving || !form.activity || !form.targetMinutes}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            style={{
              background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
              boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
            }}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function GoalsPage() {
  const { goals, logs, addGoal, deleteGoal } = useApp()
  const [adding, setAdding] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const targets = goals.filter(g => g.type === 'target')
  const limits = goals.filter(g => g.type === 'limit')

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteGoal(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Hedefler & Limitler</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
            boxShadow: '0 3px 14px rgba(14,165,233,0.3)',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Ekle
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-5">
            <Target size={36} className="text-surface-600" />
          </div>
          <p className="font-semibold text-surface-300 text-lg">Henüz hedef yok</p>
          <p className="text-sm text-surface-500 mt-1 max-w-xs">
            Haftalık veya aylık hedefler & limitler ekleyerek ilerlemenizi takip edin
          </p>
          <button
            onClick={() => setAdding(true)}
            className="mt-5 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}
          >
            <Plus size={16} /> İlk Hedefi Ekle
          </button>
        </div>
      ) : (
        <>
          <SummaryStrip goals={goals} logs={logs} />

          {targets.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-green-400" />
                <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest">
                  Minimum Hedefler ({targets.length})
                </h3>
              </div>
              <div className="space-y-3">
                {targets.map(g => (
                  <GoalCard key={g.id} goal={g} logs={logs} onDelete={setDeleteTarget} />
                ))}
              </div>
            </section>
          )}

          {limits.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={13} className="text-orange-400" />
                <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest">
                  Maksimum Limitler ({limits.length})
                </h3>
              </div>
              <div className="space-y-3">
                {limits.map(g => (
                  <GoalCard key={g.id} goal={g} logs={logs} onDelete={setDeleteTarget} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <AddGoalModal open={adding} onClose={() => setAdding(false)} onSave={addGoal} />
      <DeleteConfirmModal
        open={!!deleteTarget}
        goal={deleteTarget}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
