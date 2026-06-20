import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { todayString } from '../lib/utils'
import { PRESET_ACTIVITIES } from '../lib/constants'

const AppContext = createContext(null)

const initialState = {
  activities: [],
  logs: [],
  goals: [],
  activeTimers: [],
  selectedDate: todayString(),
  loading: false,
  error: null,
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
    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { user } = useAuth()

  const fetchActivities = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
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
      .from('goals')
      .select('*, activities(name, is_custom)')
      .eq('user_id', user.id)
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

  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_ACTIVITIES', payload: [] })
      dispatch({ type: 'SET_LOGS', payload: [] })
      dispatch({ type: 'SET_GOALS', payload: [] })
      dispatch({ type: 'SET_ACTIVE_TIMERS', payload: [] })
      return
    }
    fetchActivities()
    fetchLogs()
    fetchGoals()
    fetchActiveTimers()
  }, [user, fetchActivities, fetchLogs, fetchGoals, fetchActiveTimers])

  // Auto day-transition at midnight
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = midnight - now
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_DATE', payload: todayString() })
      fetchLogs()
      fetchActiveTimers()
    }, msUntilMidnight)
    return () => clearTimeout(timer)
  }, [fetchLogs, fetchActiveTimers])

  async function ensureActivity(nameOrId) {
    // If it's a UUID from existing activities, return it
    if (state.activities.find(a => a.id === nameOrId)) return nameOrId

    // Check if a custom activity with this name already exists
    const existing = state.activities.find(a => a.name.toLowerCase() === nameOrId.toLowerCase())
    if (existing) return existing.id

    // Create new custom activity
    const { data, error } = await supabase
      .from('activities')
      .insert({ user_id: user.id, name: nameOrId, is_custom: true })
      .select()
      .single()
    if (error) throw error
    dispatch({ type: 'ADD_ACTIVITY', payload: data })
    return data.id
  }

  async function startTimer(activityIdOrName) {
    if (!user) return
    const activityId = await ensureActivity(activityIdOrName)
    const { data, error } = await supabase
      .from('time_logs')
      .insert({
        user_id: user.id,
        activity_id: activityId,
        start_time: new Date().toISOString(),
        log_date: todayString(),
      })
      .select('*, activities(name, is_custom)')
      .single()
    if (error) throw error
    dispatch({ type: 'ADD_TIMER', payload: data })
    return data
  }

  async function stopTimer(logId, mood = null, notes = '') {
    if (!user) return
    const timer = state.activeTimers.find(t => t.id === logId)
    if (!timer) return

    const endTime = new Date()
    const startTime = new Date(timer.start_time)
    const durationMinutes = Math.max(1, Math.floor((endTime - startTime) / 1000 / 60))

    const { data, error } = await supabase
      .from('time_logs')
      .update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        mood,
        notes,
      })
      .eq('id', logId)
      .select('*, activities(name, is_custom)')
      .single()
    if (error) throw error

    dispatch({ type: 'REMOVE_TIMER', payload: logId })
    dispatch({ type: 'ADD_LOG', payload: data })
    return data
  }

  async function addManualLog({ activityIdOrName, date, durationMinutes, mood, notes }) {
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
      })
      .select('*, activities(name, is_custom)')
      .single()
    if (error) throw error
    dispatch({ type: 'ADD_LOG', payload: data })
    return data
  }

  async function updateLog(id, updates) {
    if (!user) return
    const { data, error } = await supabase
      .from('time_logs')
      .update(updates)
      .eq('id', id)
      .select('*, activities(name, is_custom)')
      .single()
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
      .select('*, activities(name, is_custom)')
      .single()
    if (error) throw error
    dispatch({ type: 'ADD_GOAL', payload: data })
    return data
  }

  async function updateGoal(id, updates) {
    if (!user) return
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select('*, activities(name, is_custom)')
      .single()
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

  const setSelectedDate = (date) => dispatch({ type: 'SET_DATE', payload: date })

  const logsForDate = (date) => state.logs.filter(l => l.log_date === date)
  const todayLogs = logsForDate(state.selectedDate)

  return (
    <AppContext.Provider value={{
      ...state,
      todayLogs,
      logsForDate,
      startTimer,
      stopTimer,
      addManualLog,
      updateLog,
      deleteLog,
      addGoal,
      updateGoal,
      deleteGoal,
      setSelectedDate,
      refetch: { fetchLogs, fetchActivities, fetchGoals, fetchActiveTimers },
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
