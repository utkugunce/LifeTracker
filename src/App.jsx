import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useApp } from './context/AppContext'
import { DashboardPage } from './pages/DashboardPage'
import { TimerPage } from './pages/TimerPage'
import { GoalsPage } from './pages/GoalsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { BottomNav } from './components/layout/BottomNav'
import { AlertTriangle, WifiOff, X } from 'lucide-react'

function BadgeToast() {
  const { newBadge, dismissNewBadge } = useApp()
  if (!newBadge) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-2xl backdrop-blur-md">
        <span className="text-3xl shrink-0">{newBadge.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Rozet Kazandın! 🏆</p>
          <p className="text-sm font-bold text-white mt-0.5">{newBadge.name}</p>
          <p className="text-xs text-surface-400 mt-0.5 truncate">{newBadge.description}</p>
        </div>
        <button
          onClick={dismissNewBadge}
          className="text-surface-400 hover:text-surface-200 shrink-0 p-1"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => { setOffline(false); setDismissed(false) }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline || dismissed) return null

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/25 px-4 py-2.5 flex items-center gap-2.5">
      <WifiOff size={14} className="text-amber-400 shrink-0" />
      <p className="text-xs text-amber-200 flex-1">Çevrimdışısınız. Verileriniz senkronize edilemedi.</p>
      <button onClick={() => setDismissed(true)} className="text-amber-400/60 hover:text-amber-300 shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}

function AppShell() {
  const [tab, setTab] = useState('dashboard')
  const { activeTimers } = useApp()

  const pages = {
    dashboard: <DashboardPage />,
    timer: <TimerPage />,
    goals: <GoalsPage />,
    analytics: <AnalyticsPage />,
  }

  const titles = {
    dashboard: 'Bugün',
    timer: 'Takip',
    goals: 'Hedefler',
    analytics: 'Analiz',
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto">
      <div className="sticky top-0 z-30">
        <OfflineBanner />
        <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-700 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Life Tracker" className="w-8 h-8 object-contain" />
          <h1 className="font-semibold text-white text-base">{titles[tab]}</h1>
          {activeTimers.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
              {activeTimers.length}
            </span>
          )}
        </div>
        </header>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 scrollbar-hide">
        {pages[tab]}
      </main>

      <BottomNav active={tab} onChange={setTab} />
      <BadgeToast />
    </div>
  )
}

function ConfigErrorScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-900 px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Yapılandırma Eksik</h1>
        <p className="text-surface-400 text-sm leading-relaxed">
          Supabase ortam değişkenleri bulunamadı. Vercel Dashboard &rarr; Settings &rarr; Environment Variables bölümünden
          <code className="text-primary-400 mx-1 text-xs bg-surface-800 px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code> ve
          <code className="text-primary-400 mx-1 text-xs bg-surface-800 px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>
          değişkenlerini ekleyin ve tekrar deploy edin.
        </p>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-900">
      <div className="text-center">
        <img src="/logo.png" alt="Life Tracker" className="w-20 h-20 object-contain mx-auto mb-4 animate-pulse" />
        <p className="text-surface-400 text-sm">Yükleniyor...</p>
      </div>
    </div>
  )
}

function AuthErrorScreen({ message }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-900 px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-orange-500/15 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-orange-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Giriş Yapılamadı</h1>
        <p className="text-surface-400 text-sm leading-relaxed">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading, configError, authError } = useAuth()

  if (configError) return <ConfigErrorScreen />
  if (loading) return <LoadingScreen />
  if (authError) return <AuthErrorScreen message={authError} />
  if (!user) return <LoadingScreen />
  return <AppShell />
}
