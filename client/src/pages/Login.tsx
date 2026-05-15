import React, { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-novel-bg flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-novel-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-novel-muted/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-novel-text font-serif">
            小说写作辅助器
          </h1>
          <p className="mt-2 text-novel-text-dim text-sm">
            AI 驱动的智能写作平台
          </p>
        </div>

        {/* Card */}
        <div className="bg-novel-surface border border-white/5 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-novel-accent/10 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-novel-accent" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-novel-text text-center mb-6">
            登录
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-novel-text-dim mb-1.5">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-novel-bg border border-white/10 rounded-lg
                           text-novel-text placeholder-novel-text-dim/50
                           focus:outline-none focus:ring-2 focus:ring-novel-accent/50 focus:border-novel-accent/50
                           transition-colors"
                placeholder="请输入用户名"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-novel-text-dim mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-novel-bg border border-white/10 rounded-lg
                             text-novel-text placeholder-novel-text-dim/50
                             focus:outline-none focus:ring-2 focus:ring-novel-accent/50 focus:border-novel-accent/50
                             transition-colors"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-novel-text-dim hover:text-novel-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-novel-accent hover:bg-novel-accent/90 disabled:opacity-50
                         text-white font-medium rounded-lg transition-colors
                         focus:outline-none focus:ring-2 focus:ring-novel-accent/50 focus:ring-offset-2 focus:ring-offset-novel-surface"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-novel-text-dim">
            没有账号？{' '}
            <Link
              to="/register"
              className="text-novel-accent hover:text-novel-accent/80 font-medium transition-colors"
            >
              去注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
