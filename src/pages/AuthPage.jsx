import { useState } from 'react'
import { Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMessage('Hesabınız oluşturuldu! E-postanızı doğrulayın.')
      }
    } catch (err) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 bg-surface-900">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-primary-500/20 border border-primary-500/30 rounded-2xl items-center justify-center mb-4">
            <Clock size={32} className="text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Life Tracker</h1>
          <p className="text-surface-400 text-sm mt-1">Günlük aktivitelerini takip et</p>
        </div>

        {/* Card */}
        <div className="bg-surface-800 border border-surface-700 rounded-2xl p-6">
          <div className="flex bg-surface-700 rounded-xl p-1 mb-5">
            {[['signin', 'Giriş Yap'], ['signup', 'Kayıt Ol']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setMessage('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'bg-surface-600 text-white shadow' : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Lütfen bekleyin...' : mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
