import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Settings, ChevronRight, GripVertical,
  Trash2, Loader2, Send, BookOpen, PanelLeftClose, PanelLeftOpen,
  MessageSquare, Sparkles, FileText, CheckCircle,
  AlertCircle, MoreVertical, Pencil,
} from 'lucide-react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import api, { streamRequest } from '@/services/api'
import type { Chapter, ChatMessage, AgentMode, StyleProfile } from '@shared/types'

/* ===================================================================
   Helper utilities
   =================================================================== */

const statusLabel = (s: Chapter['status']) => {
  const map = { draft: '草稿', revised: '已修改', final: '定稿' }
  return map[s] || s
}

const statusColor = (s: Chapter['status']) => {
  const map = {
    draft: 'bg-yellow-500/20 text-yellow-300',
    revised: 'bg-blue-500/20 text-blue-300',
    final: 'bg-green-500/20 text-green-300',
  }
  return map[s] || 'bg-gray-500/20 text-gray-300'
}

/* ===================================================================
   Chapter sidebar (left panel)
   =================================================================== */

interface ChapterSidebarProps {
  chapters: Chapter[]
  currentId: number | null
  onSelect: (id: number) => void
  onAdd: () => void
  onDelete: (id: number) => void
  onRename: (id: number, title: string) => void
  onReorder: (orders: { id: number; sort_order: number }[]) => void
  collapsed: boolean
  onToggle: () => void
  projectTitle: string
}

const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  chapters, currentId, onSelect, onAdd, onDelete, onRename, onReorder,
  collapsed, onToggle, projectTitle,
}) => {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [contextMenu, setContextMenu] = useState<number | null>(null)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId !== null && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editingId])

  const handleDragStart = (idx: number) => setDragIdx(idx)

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const reordered = [...chapters]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    setDragIdx(idx)
    onReorder(reordered.map((c, i) => ({ id: c.id, sort_order: i + 1 })))
  }

  const startRename = (ch: Chapter) => {
    setEditingId(ch.id)
    setEditTitle(ch.title)
    setContextMenu(null)
  }

  const commitRename = () => {
    if (editingId !== null && editTitle.trim()) {
      onRename(editingId, editTitle.trim())
    }
    setEditingId(null)
  }

  if (collapsed) {
    return (
      <div className="w-12 bg-novel-surface border-r border-white/5 flex flex-col items-center py-3 gap-3 shrink-0">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-novel-text-dim hover:text-novel-text hover:bg-white/5 transition-colors"
          title="展开侧边栏"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <button
          onClick={onAdd}
          className="p-2 rounded-lg text-novel-accent hover:bg-novel-accent/10 transition-colors"
          title="添加章节"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-novel-text-dim [writing-mode:vertical-rl] truncate max-h-40">
          {projectTitle}
        </span>
      </div>
    )
  }

  return (
    <div className="w-64 bg-novel-surface border-r border-white/5 flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-novel-accent shrink-0" />
          <span className="text-sm font-medium text-novel-text truncate">{projectTitle}</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded text-novel-text-dim hover:text-novel-text hover:bg-white/5 transition-colors"
          title="折叠侧边栏"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto py-1">
        {chapters.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FileText className="w-8 h-8 text-novel-text-dim/30 mx-auto mb-2" />
            <p className="text-xs text-novel-text-dim">暂无章节</p>
          </div>
        ) : (
          chapters.map((ch, idx) => (
            <div
              key={ch.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={() => setDragIdx(null)}
              onClick={() => onSelect(ch.id)}
              className={`group relative flex items-center gap-1.5 px-2 py-1.5 mx-1 rounded-lg cursor-pointer transition-colors
                ${currentId === ch.id
                  ? 'bg-novel-accent/10 text-novel-text'
                  : 'text-novel-text-dim hover:bg-white/5 hover:text-novel-text'
                }
                ${dragIdx === idx ? 'opacity-50' : ''}
              `}
            >
              <GripVertical className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 shrink-0 cursor-grab" />

              {editingId === ch.id ? (
                <input
                  ref={editRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 min-w-0 bg-novel-bg border border-white/10 rounded px-1.5 py-0.5
                             text-xs text-novel-text focus:outline-none focus:ring-1 focus:ring-novel-accent/50"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 min-w-0 text-xs truncate">{ch.title}</span>
              )}

              {/* Status dot */}
              <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${ch.status === 'final' ? 'bg-green-400' : ch.status === 'revised' ? 'bg-blue-400' : 'bg-yellow-400'}`} />

              {/* Context menu trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setContextMenu(contextMenu === ch.id ? null : ch.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-opacity shrink-0"
              >
                <MoreVertical className="w-3 h-3" />
              </button>

              {/* Context menu */}
              {contextMenu === ch.id && (
                <div className="absolute right-0 top-full z-20 mt-1 bg-novel-surface border border-white/10 rounded-lg shadow-xl py-1 min-w-[100px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); startRename(ch) }}
                    className="w-full px-3 py-1.5 text-xs text-novel-text-dim hover:text-novel-text hover:bg-white/5 text-left flex items-center gap-2"
                  >
                    <Pencil className="w-3 h-3" /> 重命名
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(ch.id); setContextMenu(null) }}
                    className="w-full px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 text-left flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" /> 删除
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom: Add chapter */}
      <div className="p-2 border-t border-white/5 shrink-0">
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                     text-xs text-novel-accent hover:bg-novel-accent/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          添加章节
        </button>
      </div>
    </div>
  )
}

/* ===================================================================
   CodeMirror editor (center panel)
   =================================================================== */

interface EditorPanelProps {
  chapter: Chapter | null
  onContentChange: (content: string) => void
  saving: boolean
}

const EditorPanel: React.FC<EditorPanelProps> = ({ chapter, onContentChange, saving }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const callbackRef = useRef(onContentChange)
  callbackRef.current = onContentChange

  useEffect(() => {
    if (!containerRef.current) return

    // Destroy previous editor
    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }

    if (!chapter) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        callbackRef.current(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: chapter.content || '',
      extensions: [
        basicSetup,
        markdown(),
        oneDark,
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif' },
          '.cm-content': { padding: '1rem 0' },
          '.cm-gutters': { background: '#16213e', borderRight: '1px solid rgba(255,255,255,0.05)' },
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [chapter?.id]) // Re-create editor when chapter changes

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center bg-novel-bg">
        <div className="text-center">
          <FileText className="w-12 h-12 text-novel-text-dim/20 mx-auto mb-3" />
          <p className="text-novel-text-dim text-sm">选择一个章节开始编辑</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-novel-bg">
      {/* Chapter header bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-white/5 bg-novel-surface/50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-novel-text truncate">{chapter.title}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColor(chapter.status)}`}>
            {statusLabel(chapter.status)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-novel-text-dim shrink-0">
          {saving ? (
            <span className="flex items-center gap-1 text-novel-accent">
              <Loader2 className="w-3 h-3 animate-spin" /> 保存中
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" /> 已保存
            </span>
          )}
          <span>{chapter.word_count} 字</span>
        </div>
      </div>

      {/* Editor */}
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  )
}

/* ===================================================================
   AI Chat panel (right sidebar)
   =================================================================== */

interface ChatPanelProps {
  messages: ChatMessage[]
  onSend: (msg: string, mode: AgentMode, styleId?: number) => void
  loading: boolean
  styles: StyleProfile[]
  collapsed: boolean
  onToggle: () => void
  onSaveStyle: (content: string) => void
  scrollResetKey: number
}

const modeLabels: Record<AgentMode, string> = {
  plan: '规划',
  write: '写作',
  auto: '自动',
}

const modeDescriptions: Record<AgentMode, string> = {
  plan: '规划大纲、角色、世界观',
  write: '撰写、续写、改写内容',
  auto: 'AI 自动判断最佳模式',
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages, onSend, loading, styles, collapsed, onToggle, onSaveStyle, scrollResetKey,
}) => {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<AgentMode>('auto')
  const [styleId, setStyleId] = useState<number | undefined>(undefined)
  const listRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)

  // Track if user scrolled up manually
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
      userScrolledRef.current = !atBottom
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  // Reset scroll tracking when a new message is sent
  useEffect(() => {
    userScrolledRef.current = false
  }, [scrollResetKey])

  // Auto-scroll to bottom only if user hasn't scrolled up
  useEffect(() => {
    if (listRef.current && !userScrolledRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    onSend(text, mode, styleId)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (collapsed) {
    return (
      <div className="w-12 bg-novel-surface border-l border-white/5 flex flex-col items-center py-3 gap-3 shrink-0">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-novel-text-dim hover:text-novel-text hover:bg-white/5 transition-colors"
          title="展开AI面板"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-[350px] bg-novel-surface border-l border-white/5 flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-novel-accent" />
          <span className="text-sm font-medium text-novel-text">AI 助手</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded text-novel-text-dim hover:text-novel-text hover:bg-white/5 transition-colors"
          title="折叠"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-10 h-10 text-novel-text-dim/20 mx-auto mb-3" />
            <p className="text-sm text-novel-text-dim">发送消息与 AI 互动</p>
            <p className="text-xs text-novel-text-dim/60 mt-1">支持规划、写作、自动模式</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-novel-accent/20 text-novel-text rounded-br-md'
                  : 'bg-white/5 text-novel-text-dim rounded-bl-md'
                }`}
            >
              {msg.content}
              {msg.role === 'assistant' && msg.content && !msg.content.startsWith('出错了') && (
                <div className="mt-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={() => onSaveStyle(msg.content)}
                    className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-novel-text-dim hover:text-novel-text transition-colors"
                    title="保存为文风"
                  >
                    保存为文风
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-novel-text-dim">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-novel-accent" />
                思考中...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="border-t border-white/5 p-3 space-y-2 shrink-0">
        {/* Mode selector */}
        <div className="flex items-center gap-1.5">
          {(['plan', 'write', 'auto'] as AgentMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${mode === m
                  ? 'bg-novel-accent/20 text-novel-accent border border-novel-accent/30'
                  : 'bg-novel-bg border border-white/10 text-novel-text-dim hover:border-white/20'
                }`}
              title={modeDescriptions[m]}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>

        {/* Style selector + quick actions */}
        <div className="flex items-center gap-2">
          <select
            value={styleId ?? ''}
            onChange={(e) => setStyleId(e.target.value ? Number(e.target.value) : undefined)}
            className="flex-1 min-w-0 px-2 py-1.5 bg-novel-bg border border-white/10 rounded-lg
                       text-xs text-novel-text-dim
                       focus:outline-none focus:ring-1 focus:ring-novel-accent/50 transition-colors"
          >
            <option value="">默认风格</option>
            {styles.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button
            onClick={() => { if (input.trim() || messages.length) onSend('评价当前章节', 'auto', styleId) }}
            className="px-2.5 py-1.5 bg-novel-bg border border-white/10 rounded-lg
                       text-xs text-novel-text-dim hover:text-novel-text hover:border-white/20 transition-colors shrink-0"
            title="评价当前章节"
          >
            评价
          </button>

          <button
            onClick={() => { if (input.trim() || messages.length) onSend('检查当前章节的问题', 'auto', styleId) }}
            className="px-2.5 py-1.5 bg-novel-bg border border-white/10 rounded-lg
                       text-xs text-novel-text-dim hover:text-novel-text hover:border-white/20 transition-colors shrink-0"
            title="检查当前章节"
          >
            检查
          </button>
        </div>

        {/* Input */}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="flex-1 min-w-0 px-3 py-2 bg-novel-bg border border-white/10 rounded-lg
                       text-sm text-novel-text placeholder-novel-text-dim/50 resize-none
                       focus:outline-none focus:ring-2 focus:ring-novel-accent/50 transition-colors"
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-novel-accent hover:bg-novel-accent/90 disabled:opacity-40
                       text-white rounded-lg transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ===================================================================
   Main ProjectView page
   =================================================================== */

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    currentProject, chapters, currentChapter,
    fetchProjects, fetchChapters, fetchChapter,
    createChapter, updateChapter, deleteChapter, reorderChapters,
    setCurrentProject,
  } = useProjectStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [styles, setStyles] = useState<StyleProfile[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContentRef = useRef<string>('')
  const currentChapterIdRef = useRef<number | null>(null)

  const projectId = Number(id)

  // Show toast
  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Load project data
  useEffect(() => {
    if (!projectId || isNaN(projectId)) {
      navigate('/', { replace: true })
      return
    }

    const load = async () => {
      try {
        await fetchProjects()
        const proj = useProjectStore.getState().projects.find((p) => p.id === projectId)
        if (!proj) {
          showToast('error', '项目不存在')
          navigate('/', { replace: true })
          return
        }
        setCurrentProject(proj)
        await fetchChapters(projectId)

        // Load styles
        try {
          const stylesData: any = await api.get('/styles')
          setStyles(Array.isArray(stylesData) ? stylesData : [])
        } catch { /* silent */ }

        // Load chat history
        try {
          const historyData: any = await api.get(`/ai/history/${projectId}?limit=50`)
          setChatMessages(Array.isArray(historyData) ? historyData : [])
        } catch { /* silent */ }
      } catch (err: any) {
        showToast('error', err?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [projectId, fetchProjects, fetchChapters, setCurrentProject, navigate, showToast])

  // Select first chapter if none selected
  useEffect(() => {
    if (!currentChapter && chapters.length > 0) {
      fetchChapter(chapters[0].id)
    }
  }, [chapters, currentChapter, fetchChapter])

  // Track current chapter id for auto-save
  useEffect(() => {
    currentChapterIdRef.current = currentChapter?.id ?? null
    latestContentRef.current = currentChapter?.content || ''
  }, [currentChapter])

  // Auto-save with debounce
  const scheduleSave = useCallback((content: string) => {
    latestContentRef.current = content
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const chId = currentChapterIdRef.current
      if (!chId) return
      setSaving(true)
      try {
        await updateChapter(chId, { content: latestContentRef.current })
      } catch (err: any) {
        showToast('error', '自动保存失败')
      } finally {
        setSaving(false)
      }
    }, 1500)
  }, [updateChapter, showToast])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // Chapter operations
  const handleAddChapter = async () => {
    const num = chapters.length + 1
    try {
      await createChapter({
        project_id: projectId,
        title: `第${num}章`,
        content: '',
        chapter_outline: '',
      })
      showToast('success', '章节已添加')
    } catch (err: any) {
      showToast('error', err?.message || '添加失败')
    }
  }

  const handleDeleteChapter = async (chId: number) => {
    if (!confirm('确定删除此章节？')) return
    try {
      await deleteChapter(chId)
      showToast('success', '章节已删除')
    } catch (err: any) {
      showToast('error', err?.message || '删除失败')
    }
  }

  const handleRenameChapter = async (chId: number, title: string) => {
    try {
      await updateChapter(chId, { title })
    } catch (err: any) {
      showToast('error', err?.message || '重命名失败')
    }
  }

  const handleReorder = async (orders: { id: number; sort_order: number }[]) => {
    try {
      await reorderChapters(projectId, orders)
    } catch (err: any) {
      showToast('error', err?.message || '重排序失败')
    }
  }

  // Save content as a new style
  const handleSaveStyle = useCallback(async (content: string) => {
    const name = prompt('为这个文风起个名字:')
    if (!name?.trim()) return
    try {
      await api.post('/styles', {
        name: name.trim(),
        type: 'custom',
        description: '从AI对话中保存的文风',
        style_prompt: content.trim(),
      })
      // Reload styles
      const stylesData: any = await api.get('/styles')
      setStyles(Array.isArray(stylesData) ? stylesData : [])
      showToast('success', `文风「${name.trim()}」已保存`)
    } catch (err: any) {
      showToast('error', err?.message || '保存失败')
    }
  }, [showToast])

  // Chat
  const [scrollResetKey, setScrollResetKey] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const handleSendChat = async (message: string, mode: AgentMode, styleId?: number) => {
    // Abort any previous in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setChatLoading(true)
    // Reset scroll tracking so new content auto-scrolls
    setScrollResetKey(k => k + 1)

    // Optimistic: add user message
    const userMsg: ChatMessage = {
      id: Date.now(),
      user_id: 0,
      project_id: projectId,
      chapter_id: currentChapter?.id ?? null,
      role: 'user',
      content: message,
      mode,
      created_at: new Date().toISOString(),
    }
    setChatMessages((prev) => [...prev, userMsg])

    // Placeholder for streaming assistant message
    const assistantId = Date.now() + 1
    const assistantMsg: ChatMessage = {
      id: assistantId,
      user_id: 0,
      project_id: projectId,
      chapter_id: currentChapter?.id ?? null,
      role: 'assistant',
      content: '',
      mode,
      created_at: new Date().toISOString(),
    }
    setChatMessages((prev) => [...prev, assistantMsg])

    let accumulated = ''
    let finalAction: any = null

    // Safety timeout: 5 minutes
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 5 * 60 * 1000)

    try {
      await streamRequest(
        '/ai/chat',
        {
          project_id: projectId,
          chapter_id: currentChapter?.id,
          message,
          mode,
          style_id: styleId,
        },
        // onChunk: update the assistant message in real-time
        (chunk) => {
          accumulated += chunk
          setChatMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m)
          )
        },
        // onDone: finalize
        (result) => {
          if (result) {
            if (result.message) accumulated = result.message
            finalAction = result.action
          }
          setChatMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: accumulated || '（空回复）' } : m)
          )
        },
        // onError
        (err) => {
          setChatMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: `出错了: ${err.message}` } : m)
          )
        },
        controller.signal,
      )

      // Handle actions after streaming completes
      if (finalAction) {
        if (finalAction.type === 'edit_chapter' && finalAction.target_id && finalAction.content) {
          await updateChapter(finalAction.target_id, { content: finalAction.content })
          if (finalAction.target_id === currentChapter?.id) {
            await fetchChapter(finalAction.target_id)
          }
          showToast('success', 'AI 已更新章节内容')
        } else if (finalAction.type === 'create_chapter' && finalAction.title) {
          await createChapter({
            project_id: projectId,
            title: finalAction.title,
            content: finalAction.content || '',
            chapter_outline: '',
          })
          showToast('success', `AI 已创建新章节: ${finalAction.title}`)
        }
      }
    } catch (err: any) {
      setChatMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: `出错了: ${err?.message || '请求失败'}` } : m)
      )
    } finally {
      clearTimeout(timeoutId)
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-novel-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-novel-accent animate-spin" />
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="h-screen bg-novel-bg flex items-center justify-center">
        <p className="text-novel-text-dim">项目未找到</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-novel-bg overflow-hidden">
      {/* Top bar */}
      <header className="h-10 px-3 flex items-center justify-between bg-novel-surface/80 border-b border-white/5 shrink-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded text-novel-text-dim hover:text-novel-text hover:bg-white/5 transition-colors"
            title="返回"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-novel-text font-serif">小说写作辅助器</span>
          <span className="text-novel-text-dim/30 mx-1">/</span>
          <span className="text-sm text-novel-text-dim truncate max-w-48">{currentProject.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-novel-text-dim hidden sm:inline">{user?.username}</span>
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 rounded text-novel-text-dim hover:text-novel-text hover:bg-white/5 transition-colors"
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        <ChapterSidebar
          chapters={chapters}
          currentId={currentChapter?.id ?? null}
          onSelect={(chId) => fetchChapter(chId)}
          onAdd={handleAddChapter}
          onDelete={handleDeleteChapter}
          onRename={handleRenameChapter}
          onReorder={handleReorder}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          projectTitle={currentProject.title}
        />

        <EditorPanel
          chapter={currentChapter}
          onContentChange={scheduleSave}
          saving={saving}
        />

        <ChatPanel
          messages={chatMessages}
          onSend={handleSendChat}
          loading={chatLoading}
          styles={styles}
          collapsed={chatCollapsed}
          onToggle={() => setChatCollapsed(!chatCollapsed)}
          onSaveStyle={handleSaveStyle}
          scrollResetKey={scrollResetKey}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium
              ${toast.type === 'success'
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'
              }`}
          >
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />
            }
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectView
