import { format, formatDistanceToNow, isToday, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

export function formatDuration(minutes) {
  if (!minutes || minutes < 1) return '0d'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}d`
  if (m === 0) return `${h}s`
  return `${h}s ${m}d`
}

export function formatElapsed(startTime) {
  const start = new Date(startTime)
  const now = new Date()
  const seconds = Math.floor((now - start) / 1000)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function elapsedMinutes(startTime) {
  const start = new Date(startTime)
  const now = new Date()
  return Math.floor((now - start) / 1000 / 60)
}

export function formatDate(dateStr) {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (isToday(d)) return 'Bugün'
    return format(d, 'd MMMM yyyy', { locale: tr })
  } catch {
    return dateStr
  }
}

export function formatTime(dateStr) {
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    return format(d, 'HH:mm')
  } catch {
    return ''
  }
}

export function todayString() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function clsx(...classes) {
  return classes.filter(Boolean).join(' ')
}
