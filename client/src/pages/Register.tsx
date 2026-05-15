import React, { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const Register: React.FC = () => {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const validate = (): string | null => {
    if (!username.trim()) return '请输入用户名'
    if (username.trim().length < 3) return '用户名至少3个字符'
    if (!password) return '请输入密码'
    if (password.length < 6) return '密码至少6位'
    if (password !== confirmPassword) return '两次输入的密码不一致'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await register(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const passwordMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  return (
    <div className="min-h-screen bg-novel-bg flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-novel-muted/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-novel-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-novel-text font-serif">
            小说写作辅助器
          </h1>
          <p className="mt-2 text-novel-text-dim text-sm">
            创建账号，开始您的创作之旅
          </p>
        </div>

        {/* Card */}
        <div className="bg-novel-surface border border-white/5 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-novel-muted/20 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-novel-muted" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-novel-text text-center mb-6">
            注册
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
                placeholder="请输入用户名（至少3个字符）"
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
                  placeholder="请输入密码（至少6位）"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-novel-text-dim mb-1.5">
                确认密码
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 pr-16 bg-novel-bg border rounded-lg
                             text-novel-text placeholder-novel-text-dim/50
                             focus:outline-none focus:ring-2 transition-colors
                             ${passwordMismatch
                               ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                               : passwordMatch
                                 ? 'border-green-500/50 focus:ring-green-500/50 focus:border-green-500/50'
                                 : 'border-white/10 focus:ring-novel-accent/50 focus:border-novel-accent/50'
                             }`}
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {passwordMatch && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-novel-text-dim hover:text-novel-text transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {passwordMismatch && (
                <p className="mt-1 text-xs text-red-400">两次输入的密码不一致</p>
              )}
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
                  注册中...
                </span>
              ) : (
                '注册'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-novel-text-dim">
            已有账号？{' '}
            <Link
              to="/login"
              className="text-novel-accent hover:text-novel-accent/80 font-medium transition-colors"
            >
              去登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
