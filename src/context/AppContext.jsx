import { createContext, useContext, useEffect, useReducer, useCallback, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { todayString, formatDuration } from '../lib/utils'
import { format, subDays } from 'date-fns'

const AppContext = createContext(null)

const POMODORO_WORK = 25 * 60
const POMODORO_BREAK = 5 * 60

const initialState = {
  activities: [],
  logs: [],
  goals: [],
  activeTimers: [],
  streaks: [],
  badges: [],
  userBadges: [],
  newBadge: null,
  selectedDate: todayString(),
  loading: false,
  error: null,
  pomodoroState: 'idle',
  pomodoroTimeLeft: POMODORO_WORK,
  pomodoroActivity: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_ACTIVITIES': return { ...state, activities: action.payload }
    case 'ADD_ACTIVITY': return { ...state, activities: [...state.activities, action.payload] }
    case 'SET_LOGS': return { ...state, logs: action.payload }
    case 'ADD_LOG': return { ...state, logs: [action.payload, ...state.logs] }
    case 'UPDATE_LOG':
      return { ...state, logs: state.logs.map(l => l.id === action.payload.id ? action.payload : l) }
    case 'DELETE_LOG':
      return { ...state, logs: state.logs.filter(l => l.id !== action.payload) }
    case 'SET_GOALS': return { ...state, goals: action.payload }
    case 'ADD_GOAL': return { ...state, goals: [...state.goals, action.payload] }
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g) }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) }
    case 'SET_ACTIVE_TIMERS': return { ...state, activeTimers: action.payload }
    case 'ADD_TIMER': return { ...state, activeTimers: [...state.activeTimers, action.payload] }
    case 'REMOVE_TIMER':
      return { ...state, activeTimers: state.activeTimers.filter(t => t.id !== action.payload) }
    case 'SET_DATE': return { ...state, selectedDate: action.payload }
    case 'SET_STREAKS': return { ...state, streaks: action.payload }
    case 'SET_BADGES': return { ...state, badges: action.payload }
    case 'SET_USER_BADGES': return { ...state, userBadges: action.payload }
    case 'ADD_USER_BADGE': return { ...state, userBadges: [...state.userBadges, action.payload] }
    case 'SET_NEW_BADGE': return { ...state, newBadge: action.payload }
    case 'SET_POMODORO':
      return { ...state, ...action.payload }
    default: return state
  }
}

function sendNotification(title, body) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/pwa-192x192.png' })
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { user } = useAuth()
  const pomodoroRef = useRef(null)
  const pomodoroStateRef = useRef(state.pomodoroState)
  const pomodoroTimeRef = useRef(state.pomodoroTimeLeft)

  useEffect(() => {
    pomodoroStateRef.current = state.pomodoroState
    pomodoroTimeRef.current = state.pomodoroTimeLeft
  }, [state.pomodoroState, state.pomodoroTimeLeft])

  // ── Fetch functions ────────────────────────────────
  const fetchActivities = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('activities').select('*').eq('user_id', user.id).order('name')
    if (!error && data) dispatch({ type: 'SET_ACTIVITIES', payload: data })
  }, [user])

  const fetchLogs = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('time_logs')
      .select('*, activities(name, is_custom)')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .order('start_time', { ascending: false })
    if (!error && data) dispatch({ type: 'SET_LOGS', payload: data })
  }, [user])

  const fetchGoals = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('goals').select('*, activities(name, is_custom)').eq('user_id', user.id)
    if (!error && data) dispatch({ type: 'SET_GOALS', payload: data })
  }, [user])

  const fetchActiveTimers = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('time_logs')
      .select('*, activities(name, is_custom)')
      .eq('user_id', user.id)
      .is('end_time', null)
      .not('start_time', 'is', null)
    if (!error && data) dispatch({ type: 'SET_ACTIVE_TIMERS', payload: data })
  }, [user])

  const fetchStreaks = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('user_streaks').select('*').eq('user_id', user.id)
    if (!error && data) dispatch({ type: 'SET_STREAKS', payload: data })
  }, [user])

  const fetchBadges = useCallback(async () => {
    const { data, error } = await supabase.from('badges').select('*')
    if (!error && data) dispatch({ type: 'SET_BADGES', payload: data })
  }, [])

  const fetchUserBadges = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('user_badges').select('*, badges(*)').eq('user_id', user.id)
    if (!error && data) dispatch({ type: 'SET_USER_BADGES', payload: data })
  }, [user])

  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_ACTIVITIES', payload: [] })
      dispatch({ type: 'SET_LOGS', payload: [] })
      dispatch({ type: 'SET_GOALS', payload: [] })
      dispatch({ type: 'SET_ACTIVE_TIMERS', payload: [] })
      dispatch({ type: 'SET_STREAKS', payload: [] })
      dispatch({ type: 'SET_USER_BADGES', payload: [] })
      return
    }
    fetchActivities()
    fetchLogs()
    fetchGoals()
    fetchActiveTimers()
    fetchStreaks()
    fetchBadges()
    fetchUserBadges()
  }, [user, fetchActivities, fetchLogs, fetchGoals, fetchActiveTimers, fetchStreaks, fetchBadges, fetchUserBadges])

  // Midnight transition
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_DATE', payload: todayString() })
      fetchLogs()
      fetchActiveTimers()
    }, midnight - now)
    return () => clearTimeout(timer)
  }, [fetchLogs, fetchActiveTimers])

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ── Streak logic ───────────────────────────────────
  async function updateStreak() {
    if (!user) return
    const today = todayString()
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

    const { data: existing } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .is('activity_id', null)
      .maybeSingle()

    if (!existing) {
      const { data } = await supabase
        .from('user_streaks')
        .insert({ user_id: user.id, activity_id: null, current_streak: 1, longest_streak: 1, last_logged_date: today })
        .select().single()
      if (data) dispatch({ type: 'SET_STREAKS', payload: [data] })
      return
    }

    if (existing.last_logged_date === today) return

    let newStreak
    if (existing.last_logged_date === yesterday) {
      newStreak = existing.current_streak + 1
    } else {
      newStreak = 1
    }

    const longest = Math.max(newStreak, existing.longest_streak)
    const { data } = await supabase
      .from('user_streaks')
      .update({ current_streak: newStreak, longest_streak: longest, last_logged_date: today })
      .eq('id', existing.id)
      .select().single()

    if (data) {
      dispatch({ type: 'SET_STREAKS', payload: state.streaks.map(s => s.id === data.id ? data : s) })
    }
  }

  // ── Badge logic ────────────────────────────────────
  async function checkAndAwardBadges(log) {
    if (!user) return
    const earned = state.userBadges.map(ub => ub.badge_id)

    for (const badge of state.badges) {
      if (earned.includes(badge.id)) continue

      let qualifies = false
      switch (badge.condition_type) {
        case 'first_log':
          qualifies = true
          break
        case 'deep_focus_90':
          qualifies = (log.duration_minutes || 0) >= 90
          break
        case 'weekly_home_goal': {
          const actName = log.activities?.name ?? ''
          const homeActivities = ['Ev İşleri', 'Bulaşık Yıkama', 'Temizlik', 'Yemek Pişirme']
          qualifies = homeActivities.some(h => h.toLowerCase() === actName.toLowerCase())
          if (qualifies) {
            const homeGoal = state.goals.find(g =>
              g.type === 'target' && g.period === 'weekly' &&
              homeActivities.some(h => g.activities?.name?.toLowerCase() === h.toLowerCase())
            )
            qualifies = !!homeGoal
          }
          break
        }
        case 'streak_7': {
          const general = state.streaks.find(s => !s.activity_id)
          qualifies = general && general.current_streak >= 7
          break
        }
        case 'streak_30': {
          const general = state.streaks.find(s => !s.activity_id)
          qualifies = general && general.current_streak >= 30
          break
        }
        case 'pomodoro_10': {
          const pomoCount = state.logs.filter(l => l.is_pomodoro).length + (log.is_pomodoro ? 1 : 0)
          qualifies = pomoCount >= 10
          break
        }
      }

      if (qualifies) {
        const { data, error } = await supabase
          .from('user_badges')
          .insert({ user_id: user.id, badge_id: badge.id })
          .select('*, badges(*)')
          .single()
        if (!error && data) {
          dispatch({ type: 'ADD_USER_BADGE', payload: data })
          dispatch({ type: 'SET_NEW_BADGE', payload: badge })
          sendNotification('Rozet Kazandın! 🏆', `${badge.icon} ${badge.name}: ${badge.description}`)
          setTimeout(() => dispatch({ type: 'SET_NEW_BADGE', payload: null }), 5000)
        }
      }
    }
  }

  // ── Limit notification check ───────────────────────
  function checkLimitNotifications(log) {
    const { goals, logs: allLogs } = state
    const limitGoals = goals.filter(g => g.type === 'limit' && g.activity_id === log.activity_id)
    for (const goal of limitGoals) {
      const totalSpent = allLogs
        .filter(l => l.activity_id === goal.activity_id)
        .reduce((s, l) => s + (l.duration_minutes || 0), 0) + (log.duration_minutes || 0)
      if (totalSpent > goal.target_minutes) {
        const actName = log.activities?.name ?? 'Aktivite'
        sendNotification(
          'Limit Aşımı! ⚠️',
          `${actName} limitini ${formatDuration(totalSpent - goal.target_minutes)} aştın!`
        )
      }
    }
  }

  // ── Post-log hook (streak + badges + limit check) ──
  async function onLogCompleted(log) {
    await updateStreak()
    await checkAndAwardBadges(log)
    checkLimitNotifications(log)
  }

  // ── Core CRUD ──────────────────────────────────────
  async function ensureActivity(nameOrId) {
    if (state.activities.find(a => a.id === nameOrId)) return nameOrId
    const existing = state.activities.find(a => a.name.toLowerCase() === nameOrId.toLowerCase())
    if (existing) return existing.id
    const { data, error } = await supabase
      .from('activities')
      .insert({ user_id: user.id, name: nameOrId, is_custom: true })
      .select().single()
    if (error) throw error
    dispatch({ type: 'ADD_ACTIVITY', payload: data })
    return data.id
  }

  async function startTimer(activityIdOrName, { tags = [], isPomodoro = false } = {}) {
    if (!user) return
    const activityId = await ensureActivity(activityIdOrName)
    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        user_id: user.id,
        activity_id: activityId,
        start_time: new Date().toISOString(),
        log_date: todayString(),
        tags,
        is_pomodoro: isPomodoro,
      })
      .select('*, activities(name, is_custom)')
      .single()
    if (error) throw error
    dispatch({ type: 'ADD_TIMER', payload: data })
    return data
  }

  async function stopTimer(logId, mood = null, notes = '', tags = []) {
    if (!user) return
    const timer = state.activeTimers.find(t => t.id === logId)
    if (!timer) return

    const endTime = new Date()
    const startTime = new Date(timer.start_time)
    const durationMinutes = Math.max(1, Math.floor((endTime - startTime) / 1000 / 60))

    const updates = {
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      mood,
      notes,
    }
    if (tags.length > 0) updates.tags = tags

    const { data, error } = await supabase
      .from('time_logs')
      .update(updates)
      .eq('id', logId)
      .select('*, activities(name, is_custom)')
      .single()
    if (error) throw error

    dispatch({ type: 'REMOVE_TIMER', payload: logId })
    dispatch({ type: 'ADD_LOG', payload: data })
    await onLogCompleted(data)
    return data
  }

  async function addManualLog({ activityIdOrName, date, durationMinutes, mood, notes, tags = [], isPomodoro = false }) {
    if (!user) return
    const activityId = await ensureActivity(activityIdOrName)
    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        user_id: user.id,
        activity_id: activityId,
        log_date: date,
        duration_minutes: durationMinutes,
        mood,
        notes,
        tags,
        is_pomodoro: isPomodoro,
      })
      .select('*, activities(name, is_custom)')
      .single()
    if (error) throw error
    dispatch({ type: 'ADD_LOG', payload: data })
    await onLogCompleted(data)
    return data
  }

  async function updateLog(id, updates) {
    if (!user) return
    const { data, error } = await supabase
      .from('time_logs').update(updates).eq('id', id)
      .select('*, activities(name, is_custom)').single()
    if (error) throw error
    dispatch({ type: 'UPDATE_LOG', payload: data })
    return data
  }

  async function deleteLog(id) {
    if (!user) return
    const { error } = await supabase.from('time_logs').delete().eq('id', id)
    if (error) throw error
    dispatch({ type: 'DELETE_LOG', payload: id })
    dispatch({ type: 'REMOVE_TIMER', payload: id })
  }

  async function addGoal({ activityIdOrName, type, targetMinutes, period }) {
    if (!user) return
    const activityId = await ensureActivity(activityIdOrName)
    const { data, error } = await supabase
      .from('goals')
      .insert({ user_id: user.id, activity_id: activityId, type, target_minutes: targetMinutes, period })
      .select('*, activities(name, is_custom)').single()
    if (error) throw error
    dispatch({ type: 'ADD_GOAL', payload: data })
    return data
  }

  async function updateGoal(id, updates) {
    if (!user) return
    const { data, error } = await supabase
      .from('goals').update(updates).eq('id', id)
      .select('*, activities(name, is_custom)').single()
    if (error) throw error
    dispatch({ type: 'UPDATE_GOAL', payload: data })
    return data
  }

  async function deleteGoal(id) {
    if (!user) return
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) throw error
    dispatch({ type: 'DELETE_GOAL', payload: id })
  }

  // ── Pomodoro ───────────────────────────────────────
  function startPomodoro(activityIdOrName, tags = []) {
    dispatch({
      type: 'SET_POMODORO',
      payload: {
        pomodoroState: 'work',
        pomodoroTimeLeft: POMODORO_WORK,
        pomodoroActivity: { activityIdOrName, tags },
      },
    })

    if (pomodoroRef.current) clearInterval(pomodoroRef.current)

    pomodoroRef.current = setInterval(() => {
      const timeLeft = pomodoroTimeRef.current - 1
      const currentState = pomodoroStateRef.current

      if (timeLeft <= 0) {
        if (currentState === 'work') {
          sendNotification('Pomodoro Tamamlandı! 🍅', '5 dakikalık mola zamanı.')
          dispatch({
            type: 'SET_POMODORO',
            payload: { pomodoroState: 'break', pomodoroTimeLeft: POMODORO_BREAK },
          })
        } else {
          sendNotification('Mola Bitti! ⏰', 'Yeni bir pomodoro başlatabilirsin.')
          clearInterval(pomodoroRef.current)
          pomodoroRef.current = null
          dispatch({
            type: 'SET_POMODORO',
            payload: { pomodoroState: 'idle', pomodoroTimeLeft: POMODORO_WORK, pomodoroActivity: null },
          })
        }
      } else {
        dispatch({ type: 'SET_POMODORO', payload: { pomodoroTimeLeft: timeLeft } })
      }
    }, 1000)
  }

  function stopPomodoro() {
    if (pomodoroRef.current) {
      clearInterval(pomodoroRef.current)
      pomodoroRef.current = null
    }
    dispatch({
      type: 'SET_POMODORO',
      payload: { pomodoroState: 'idle', pomodoroTimeLeft: POMODORO_WORK, pomodoroActivity: null },
    })
  }

  useEffect(() => {
    return () => {
      if (pomodoroRef.current) clearInterval(pomodoroRef.current)
    }
  }, [])

  // ── Export ─────────────────────────────────────────
  function exportData(fmt = 'json') {
    const data = state.logs.map(l => ({
      date: l.log_date,
      activity: l.activities?.name ?? '',
      duration_minutes: l.duration_minutes ?? 0,
      mood: l.mood,
      notes: l.notes ?? '',
      tags: (l.tags || []).join(', '),
      is_pomodoro: l.is_pomodoro ?? false,
      start_time: l.start_time ?? '',
      end_time: l.end_time ?? '',
    }))

    let content, mimeType, ext
    if (fmt === 'csv') {
      const headers = Object.keys(data[0] || {})
      const rows = data.map(r => headers.map(h => {
        const v = String(r[h] ?? '')
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
      }).join(','))
      content = [headers.join(','), ...rows].join('\n')
      mimeType = 'text/csv'
      ext = 'csv'
    } else {
      content = JSON.stringify(data, null, 2)
      mimeType = 'application/json'
      ext = 'json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lifetracker-export-${todayString()}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const setSelectedDate = (date) => dispatch({ type: 'SET_DATE', payload: date })
  const logsForDate = (date) => state.logs.filter(l => l.log_date === date)
  const todayLogs = logsForDate(state.selectedDate)
  const generalStreak = state.streaks.find(s => !s.activity_id)
  const dismissNewBadge = () => dispatch({ type: 'SET_NEW_BADGE', payload: null })

  return (
    <AppContext.Provider value={{
      ...state,
      todayLogs,
      logsForDate,
      generalStreak,
      startTimer,
      stopTimer,
      addManualLog,
      updateLog,
      deleteLog,
      addGoal,
      updateGoal,
      deleteGoal,
      setSelectedDate,
      startPomodoro,
      stopPomodoro,
      exportData,
      dismissNewBadge,
      refetch: { fetchLogs, fetchActivities, fetchGoals, fetchActiveTimers, fetchStreaks, fetchBadges, fetchUserBadges },
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
