import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useApp } from './context/AppContext'
import { DashboardPage } from './pages/DashboardPage'
import { TimerPage } from './pages/TimerPage'
import { GoalsPage } from './pages/GoalsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { BottomNav } from './components/layout/BottomNav'
import { AlertTriangle } from 'lucide-react'

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
      <header className="sticky top-0 z-30 bg-surface-900/95 backdrop-blur-md border-b border-surface-700 px-4 py-2.5 flex items-center justify-between">
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

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 scrollbar-hide">
        {pages[tab]}
      </main>

      <BottomNav active={tab} onChange={setTab} />
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
