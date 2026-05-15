import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Key, Globe, Cpu, Palette, Languages, Loader2,
  Plus, Trash2, Sparkles, FileText, AlertCircle, CheckCircle, Eye, EyeOff,
} from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'
import type { StyleProfile } from '@shared/types'

/* ---------- Theme preview cards ---------- */

const themes = [
  {
    key: 'dark' as const,
    label: '深色',
    desc: '经典暗色主题',
    colors: ['bg-[#1a1a2e]', 'bg-[#16213e]', 'bg-[#e94560]'],
  },
  {
    key: 'light' as const,
    label: '浅色',
    desc: '明亮护眼主题',
    colors: ['bg-[#f8f9fa]', 'bg-[#ffffff]', 'bg-[#4361ee]'],
  },
  {
    key: 'anime' as const,
    label: '暖色',
    desc: '温暖治愈的二次元风格',
    colors: ['bg-[#fdf6ec]', 'bg-[#a3d9a5]', 'bg-[#e88d67]'],
  },
]

/* ---------- Settings page ---------- */

const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { settings, fetchSettings, updateSettings } = useSettingsStore()
  useAuthStore()

  // Form state
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [model, setModel] = useState('gpt-4o')
  const [theme, setTheme] = useState<'dark' | 'light' | 'anime'>('dark')
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  const [showApiKey, setShowApiKey] = useState(false)

  // Styles
  const [styles, setStyles] = useState<StyleProfile[]>([])
  const [stylesLoading, setStylesLoading] = useState(true)
  const [newStyleName, setNewStyleName] = useState('')
  const [newStylePrompt, setNewStylePrompt] = useState('')
  const [showNewStyle, setShowNewStyle] = useState(false)

  // Extract
  const [extractText, setExtractText] = useState('')
  const [extractName, setExtractName] = useState('')
  const [extracting, setExtracting] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Test connection
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string; detail?: string } | null>(null)

  // Load settings
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    if (settings) {
      setApiKey(settings.api_key || '')
      setBaseUrl(settings.api_base_url || 'https://api.openai.com/v1')
      setModel(settings.model || 'gpt-4o')
      setTheme((settings.theme || 'dark') as 'dark' | 'light' | 'anime')
      setLanguage((settings.language || 'zh') as 'zh' | 'en')
    }
  }, [settings])

  // Load styles
  const loadStyles = useCallback(async () => {
    try {
      const data: any = await api.get('/styles')
      setStyles(Array.isArray(data) ? data : [])
    } catch {
      // silent
    } finally {
      setStylesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStyles()
  }, [loadStyles])

  // Save settings
  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await updateSettings({
        api_key: apiKey,
        api_base_url: baseUrl,
        model,
        theme,
        language,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // Test API connection
  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    setError('')
    try {
      // api.post auto-unwraps { success, data }, but test endpoint returns
      // { success: false, error } on failure (HTTP 200), which won't unwrap
      const res: any = await api.post('/settings/test', {
        api_key: apiKey,
        api_base_url: baseUrl,
        model,
      })
      // If unwrap happened, res is the inner data object
      if (res?.message) {
        setTestResult({
          ok: true,
          msg: `${res.message} — 模型: ${res.model}, 延迟: ${res.latency_ms}ms`,
          detail: `AI回复: "${res.reply}"`,
        })
      } else if (res?.success === false) {
        setTestResult({ ok: false, msg: res?.error || '连接失败' })
      } else {
        setTestResult({ ok: true, msg: '连接成功', detail: JSON.stringify(res) })
      }
    } catch (err: any) {
      setTestResult({ ok: false, msg: err?.message || '请求失败' })
    } finally {
      setTesting(false)
    }
  }

  // Create style
  const handleCreateStyle = async () => {
    if (!newStyleName.trim() || !newStylePrompt.trim()) return
    try {
      await api.post('/styles', {
        name: newStyleName.trim(),
        type: 'custom',
        style_prompt: newStylePrompt.trim(),
      })
      setNewStyleName('')
      setNewStylePrompt('')
      setShowNewStyle(false)
      loadStyles()
    } catch (err: any) {
      setError(err?.message || '创建失败')
    }
  }

  // Delete style
  const handleDeleteStyle = async (id: number) => {
    if (!confirm('确定要删除这个文风吗？')) return
    try {
      await api.delete(`/styles/${id}`)
      loadStyles()
    } catch (err: any) {
      setError(err?.message || '删除失败')
    }
  }

  // Extract style
  const handleExtract = async () => {
    if (!extractText.trim()) return
    setExtracting(true)
    setError('')
    try {
      await api.post('/styles/extract', {
        sample_text: extractText.trim(),
        name: extractName.trim() || undefined,
      })
      setExtractText('')
      setExtractName('')
      loadStyles()
    } catch (err: any) {
      setError(err?.message || '提取失败')
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="min-h-screen bg-novel-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-novel-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg text-novel-text-dim hover:text-novel-text hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-novel-text">设置</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Error / Success */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {saved && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
            <p className="text-sm text-green-400">设置已保存</p>
          </div>
        )}

        {/* ===== Section: API Settings ===== */}
        <section className="bg-novel-surface border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Cpu className="w-5 h-5 text-novel-accent" />
            <h2 className="text-base font-semibold text-novel-text">API 设置</h2>
          </div>

          <div className="space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-novel-text-dim mb-1.5">
                <Key className="w-3.5 h-3.5 inline mr-1" />
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-novel-bg border border-white/10 rounded-lg
                             text-novel-text placeholder-novel-text-dim/50 font-mono text-sm
                             focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-novel-text-dim hover:text-novel-text transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm font-medium text-novel-text-dim mb-1.5">
                <Globe className="w-3.5 h-3.5 inline mr-1" />
                Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-novel-bg border border-white/10 rounded-lg
                           text-novel-text placeholder-novel-text-dim/50 font-mono text-sm
                           focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
                placeholder="https://api.openai.com/v1"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-novel-text-dim mb-1.5">
                <Cpu className="w-3.5 h-3.5 inline mr-1" />
                模型名称
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2.5 bg-novel-bg border border-white/10 rounded-lg
                           text-novel-text placeholder-novel-text-dim/50 font-mono text-sm
                           focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
                placeholder="gpt-4o"
              />
            </div>

            {/* Test connection */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !apiKey.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-novel-muted/80 hover:bg-novel-muted
                           disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    测试连接
                  </>
                )}
              </button>
              {testResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  testResult.ok
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  <p>{testResult.msg}</p>
                  {testResult.detail && (
                    <p className="mt-1 text-xs opacity-70">{testResult.detail}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== Section: Theme ===== */}
        <section className="bg-novel-surface border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-5 h-5 text-novel-accent" />
            <h2 className="text-base font-semibold text-novel-text">主题</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left
                  ${theme === t.key
                    ? 'border-novel-accent bg-novel-accent/5'
                    : 'border-white/10 hover:border-white/20'
                  }`}
              >
                {/* Color preview */}
                <div className="flex gap-1.5 mb-3">
                  {t.colors.map((c, i) => (
                    <div key={i} className={`w-8 h-8 rounded-lg ${c} border border-white/10`} />
                  ))}
                </div>
                <p className="text-sm font-medium text-novel-text">{t.label}</p>
                <p className="text-xs text-novel-text-dim mt-0.5">{t.desc}</p>

                {/* Radio indicator */}
                <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 transition-colors
                  ${theme === t.key
                    ? 'border-novel-accent'
                    : 'border-white/20'
                  }`}
                >
                  {theme === t.key && (
                    <div className="absolute inset-1 rounded-full bg-novel-accent" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ===== Section: Language ===== */}
        <section className="bg-novel-surface border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Languages className="w-5 h-5 text-novel-accent" />
            <h2 className="text-base font-semibold text-novel-text">语言</h2>
          </div>

          <div className="flex gap-3">
            {[
              { key: 'zh' as const, label: '中文' },
              { key: 'en' as const, label: 'English' },
            ].map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLanguage(l.key)}
                className={`px-5 py-2.5 rounded-lg border transition-colors text-sm font-medium
                  ${language === l.key
                    ? 'bg-novel-accent/10 border-novel-accent/50 text-novel-accent'
                    : 'bg-novel-bg border-white/10 text-novel-text-dim hover:border-white/20'
                  }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>

        {/* ===== Section: Style Management ===== */}
        <section className="bg-novel-surface border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-novel-accent" />
              <h2 className="text-base font-semibold text-novel-text">文风管理</h2>
            </div>
            <button
              onClick={() => setShowNewStyle(!showNewStyle)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-novel-accent hover:bg-novel-accent/10
                         rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建文风
            </button>
          </div>

          {/* New style form */}
          {showNewStyle && (
            <div className="mb-5 p-4 bg-novel-bg/50 border border-white/5 rounded-lg space-y-3">
              <input
                value={newStyleName}
                onChange={(e) => setNewStyleName(e.target.value)}
                className="w-full px-3 py-2 bg-novel-bg border border-white/10 rounded-lg
                           text-novel-text text-sm placeholder-novel-text-dim/50
                           focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
                placeholder="文风名称"
              />
              <textarea
                value={newStylePrompt}
                onChange={(e) => setNewStylePrompt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-novel-bg border border-white/10 rounded-lg
                           text-novel-text text-sm placeholder-novel-text-dim/50 resize-none
                           focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
                placeholder="风格提示词 (style_prompt)，描述这种写作风格的特点..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewStyle(false)}
                  className="px-3 py-1.5 text-sm text-novel-text-dim hover:text-novel-text transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateStyle}
                  disabled={!newStyleName.trim() || !newStylePrompt.trim()}
                  className="px-4 py-1.5 bg-novel-accent hover:bg-novel-accent/90 disabled:opacity-50
                             text-white text-sm rounded-lg transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          )}

          {/* Style list */}
          {stylesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-novel-accent animate-spin" />
            </div>
          ) : styles.length === 0 ? (
            <p className="text-sm text-novel-text-dim text-center py-8">暂无文风，创建一个吧</p>
          ) : (
            <div className="space-y-2">
              {styles.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-3 p-3 bg-novel-bg/50 border border-white/5 rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-novel-text truncate">{s.name}</span>
                      <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-white/5 text-novel-text-dim">
                        {s.type === 'preset' ? '预设' : s.type === 'extracted' ? '提取' : '自定义'}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-novel-text-dim mt-1 line-clamp-2">{s.description}</p>
                    )}
                    <p className="text-xs text-novel-text-dim/60 mt-1 line-clamp-1 font-mono">
                      {s.style_prompt.slice(0, 80)}...
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteStyle(s.id)}
                    className="shrink-0 p-1.5 rounded text-novel-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== Section: Extract Style ===== */}
        <section className="bg-novel-surface border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-novel-accent" />
            <h2 className="text-base font-semibold text-novel-text">提取文风</h2>
          </div>
          <p className="text-sm text-novel-text-dim mb-4">
            粘贴一段文本样本，AI 将分析其写作风格并生成风格提示词
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-novel-text-dim mb-1.5">文风名称（可选）</label>
              <input
                value={extractName}
                onChange={(e) => setExtractName(e.target.value)}
                className="w-full px-4 py-2.5 bg-novel-bg border border-white/10 rounded-lg
                           text-novel-text text-sm placeholder-novel-text-dim/50
                           focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
                placeholder="例如：鲁迅风格、金庸风格..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-novel-text-dim mb-1.5">样本文字</label>
              <textarea
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                rows={8}
                className="w-full px-4 py-2.5 bg-novel-bg border border-white/10 rounded-lg
                           text-novel-text text-sm placeholder-novel-text-dim/50 resize-y
                           focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
                placeholder="粘贴一段具有代表性的文本..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleExtract}
                disabled={extracting || !extractText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-novel-muted hover:bg-novel-muted/90
                           disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {extracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提取中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    提取文风
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ===== Save button ===== */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-novel-accent hover:bg-novel-accent/90
                       disabled:opacity-50 text-white font-medium rounded-xl transition-colors
                       shadow-lg shadow-novel-accent/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存设置
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
