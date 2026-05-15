import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Settings, LogOut, BookOpen, FileText, Clock,
  X, Loader2, BookMarked, Feather,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Project } from '@shared/types'

/* ---------- helpers ---------- */

const formatDate = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} 小时前`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} 天前`
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const genreBadgeColor = (genre: string) => {
  const map: Record<string, string> = {
    '玄幻': 'bg-purple-500/20 text-purple-300',
    '仙侠': 'bg-blue-500/20 text-blue-300',
    '都市': 'bg-green-500/20 text-green-300',
    '言情': 'bg-pink-500/20 text-pink-300',
    '科幻': 'bg-cyan-500/20 text-cyan-300',
    '悬疑': 'bg-amber-500/20 text-amber-300',
    '历史': 'bg-orange-500/20 text-orange-300',
    '武侠': 'bg-red-500/20 text-red-300',
  }
  return map[genre] || 'bg-gray-500/20 text-gray-300'
}

/* ---------- Create-project modal ---------- */

interface CreateModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { title: string; description: string; genre: string }) => Promise<void>
}

const GENRE_OPTIONS = ['玄幻', '仙侠', '都市', '言情', '科幻', '悬疑', '历史', '武侠', '奇幻', '其他']

const CreateProjectModal: React.FC<CreateModalProps> = ({ open, onClose, onSubmit }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!title.trim()) { setError('请输入小说标题'); return }
    setError('')
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), genre })
      setTitle('')
      setDescription('')
      setGenre('')
      onClose()
    } catch (err: any) {
      setError(err?.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-novel-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-novel-text-dim hover:text-novel-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-novel-text mb-1">新建小说</h3>
        <p className="text-sm text-novel-text-dim mb-5">创建一个全新的小说项目</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-novel-text-dim mb-1">标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-novel-bg border border-white/10 rounded-lg
                         text-novel-text placeholder-novel-text-dim/50
                         focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
              placeholder="你的小说叫什么名字？"
              autoFocus
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-novel-text-dim mb-1">类型</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(genre === g ? '' : g)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors
                    ${genre === g
                      ? 'bg-novel-accent/20 border-novel-accent/50 text-novel-accent'
                      : 'bg-novel-bg border-white/10 text-novel-text-dim hover:border-white/20'
                    }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-novel-text-dim mb-1">简介</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-novel-bg border border-white/10 rounded-lg
                         text-novel-text placeholder-novel-text-dim/50 resize-none
                         focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
              placeholder="简要描述你的小说故事..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-novel-text-dim hover:text-novel-text transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="px-5 py-2 bg-novel-accent hover:bg-novel-accent/90 disabled:opacity-50
                       text-white text-sm font-medium rounded-lg transition-colors
                       flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            创建
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Project Card ---------- */

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-novel-surface border border-white/5 rounded-xl p-5
                 hover:border-novel-accent/30 hover:shadow-lg hover:shadow-novel-accent/5
                 transition-all duration-200 w-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookMarked className="w-5 h-5 text-novel-accent shrink-0" />
          <h3 className="text-novel-text font-semibold truncate group-hover:text-novel-accent transition-colors">
            {project.title}
          </h3>
        </div>
        {project.genre && (
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${genreBadgeColor(project.genre)}`}>
            {project.genre}
          </span>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-novel-text-dim line-clamp-2 mb-3 leading-relaxed">
          {project.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-novel-text-dim/70">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {project.outline ? '已设定大纲' : '无大纲'}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(project.updated_at)}
        </span>
      </div>
    </button>
  )
}

/* ---------- Empty state ---------- */

const EmptyState: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div className="flex flex-col items-center justify-center py-24 px-4">
    <div className="w-20 h-20 rounded-2xl bg-novel-accent/10 flex items-center justify-center mb-6">
      <Feather className="w-10 h-10 text-novel-accent/60" />
    </div>
    <h3 className="text-xl font-semibold text-novel-text mb-2">开始你的创作</h3>
    <p className="text-novel-text-dim text-sm mb-6 text-center max-w-sm">
      还没有任何小说项目，点击下方按钮创建你的第一部作品
    </p>
    <button
      onClick={onCreate}
      className="flex items-center gap-2 px-6 py-3 bg-novel-accent hover:bg-novel-accent/90
                 text-white font-medium rounded-xl transition-colors shadow-lg shadow-novel-accent/20"
    >
      <Plus className="w-5 h-5" />
      新建小说
    </button>
  </div>
)

/* ---------- Dashboard ---------- */

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { projects, fetchProjects, createProject } = useProjectStore()

  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        await fetchProjects()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fetchProjects])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-novel-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-novel-surface/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: title */}
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-novel-accent" />
            <h1 className="text-lg font-bold text-novel-text font-serif">小说写作辅助器</h1>
          </div>

          {/* Right: user info + actions */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-novel-text-dim hidden sm:inline">
              {user?.username}
            </span>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg text-novel-text-dim hover:text-novel-text hover:bg-white/5 transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-novel-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-novel-accent animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <>
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-novel-text">我的小说</h2>
                <p className="text-sm text-novel-text-dim mt-0.5">共 {projects.length} 部作品</p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-novel-accent hover:bg-novel-accent/90
                           text-white font-medium rounded-xl transition-colors shadow-lg shadow-novel-accent/20"
              >
                <Plus className="w-5 h-5" />
                新建小说
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => navigate(`/project/${p.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create modal */}
      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async (data) => {
          await createProject(data)
        }}
      />
    </div>
  )
}

export default Dashboard
