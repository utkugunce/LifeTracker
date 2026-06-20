import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

const AUTO_EMAIL = import.meta.env.VITE_AUTO_EMAIL || ''
const AUTO_PASSWORD = import.meta.env.VITE_AUTO_PASSWORD || ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(!supabaseConfigured)

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }

    async function autoAuth() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        setLoading(false)
        return
      }

      if (!AUTO_EMAIL || !AUTO_PASSWORD) {
        setLoading(false)
        return
      }

      const { data } = await supabase.auth.signInWithPassword({
        email: AUTO_EMAIL,
        password: AUTO_PASSWORD,
      })

      if (data?.user) {
        setUser(data.user)
      } else {
        const { data: signUpData } = await supabase.auth.signUp({
          email: AUTO_EMAIL,
          password: AUTO_PASSWORD,
        })
        if (signUpData?.user) setUser(signUpData.user)
      }

      setLoading(false)
    }

    autoAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, configError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
