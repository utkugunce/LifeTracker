import { useState } from 'react'
import { Play, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ActiveTimers } from '../components/timer/ActiveTimer'
import { ActivitySearch } from '../components/ui/ActivitySearch'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { MoodPicker } from '../components/ui/MoodPicker'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { todayString } from '../lib/utils'

export function TimerPage() {
  const { startTimer, addManualLog, activeTimers } = useApp()

  const [timerActivity, setTimerActivity] = useState('')
  const [startingTimer, setStartingTimer] = useState(false)

  const [manualActivity, setManualActivity] = useState('')
  const [manualDate, setManualDate] = useState(todayString())
  const [manualDuration, setManualDuration] = useState('')
  const [manualMood, setManualMood] = useState(null)
  const [manualNotes, setManualNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleStartTimer() {
    if (!timerActivity) return
    setStartingTimer(true)
    try {
      await startTimer(timerActivity)
      setTimerActivity('')
    } catch (e) {
      console.error(e)
    } finally {
      setStartingTimer(false)
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
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Active timers at the top */}
      {activeTimers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-300 mb-2 uppercase tracking-wider">
            Aktif ({activeTimers.length})
          </h2>
          <ActiveTimers />
        </div>
      )}

      {/* Start new timer */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Play size={16} className="text-primary-400" />
            Zamanlayıcı Başlat
          </h2>
          <p className="text-xs text-surface-400 mt-0.5">Birden fazla aktiviteyi aynı anda takip edebilirsiniz</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ActivitySearch
              value={timerActivity}
              onChange={setTimerActivity}
              placeholder="Aktivite seç veya yaz..."
            />
            <Button
              className="w-full"
              onClick={handleStartTimer}
              disabled={!timerActivity || startingTimer}
            >
              <Play size={16} />
              {startingTimer ? 'Başlatılıyor...' : 'Başlat'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual entry */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Plus size={16} className="text-green-400" />
            Manuel Kayıt Ekle
          </h2>
          <p className="text-xs text-surface-400 mt-0.5">Geçmiş aktiviteleri sonradan ekleyin</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualLog} className="space-y-3">
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
                label="Süre (dakika)"
                type="number"
                min={1}
                placeholder="30"
                value={manualDuration}
                onChange={e => setManualDuration(e.target.value)}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-300 mb-2">Ruh hali (isteğe bağlı)</p>
              <MoodPicker value={manualMood} onChange={setManualMood} />
            </div>
            <Textarea
              label="Notlar (isteğe bağlı)"
              placeholder="Bu aktivite hakkında..."
              value={manualNotes}
              onChange={e => setManualNotes(e.target.value)}
              rows={2}
            />
            <Button
              type="submit"
              className="w-full"
              variant={saved ? 'secondary' : 'primary'}
              disabled={!manualActivity || !manualDuration || saving}
            >
              {saved ? '✓ Kaydedildi!' : saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
