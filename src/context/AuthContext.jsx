import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

const AUTO_EMAIL = import.meta.env.VITE_AUTO_EMAIL || ''
const AUTO_PASSWORD = import.meta.env.VITE_AUTO_PASSWORD || ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(!supabaseConfigured)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }

    async function autoAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          setLoading(false)
          return
        }

        if (!AUTO_EMAIL || !AUTO_PASSWORD) {
          setAuthError('VITE_AUTO_EMAIL ve VITE_AUTO_PASSWORD ortam değişkenleri eksik.')
          setLoading(false)
          return
        }

        // Try sign in first
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: AUTO_EMAIL,
          password: AUTO_PASSWORD,
        })

        if (data?.session?.user) {
          setUser(data.session.user)
          setLoading(false)
          return
        }

        // Sign in failed → try sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: AUTO_EMAIL,
          password: AUTO_PASSWORD,
          options: { data: { auto_created: true } },
        })

        if (signUpData?.session?.user) {
          setUser(signUpData.session.user)
        } else if (signUpData?.user && !signUpData?.session) {
          setAuthError('E-posta doğrulaması gerekiyor. Supabase → Authentication → Providers → Email → "Confirm email" seçeneğini kapatın ve tekrar deneyin.')
        } else {
          setAuthError(signUpError?.message || signInError?.message || 'Giriş yapılamadı.')
        }
      } catch (err) {
        setAuthError(err.message || 'Beklenmeyen bir hata oluştu.')
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
    <AuthContext.Provider value={{ user, loading, configError, authError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
