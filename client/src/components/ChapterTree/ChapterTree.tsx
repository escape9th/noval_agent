import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent,
} from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Chapter {
  id: number;
  title: string;
  word_count: number;
  status: 'draft' | 'revised' | 'final';
  sort_order: number;
}

interface ChapterTreeProps {
  chapters: Chapter[];
  currentChapterId: number | null;
  onSelect: (chapterId: number) => void;
  onAdd: () => void;
  onDelete: (chapterId: number) => void;
  onRename: (chapterId: number, newTitle: string) => void;
  onMarkFinal?: (chapterId: number) => void;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
const statusConfig: Record<
  Chapter['status'],
  { label: string; color: string; bg: string }
> = {
  draft: {
    label: '草稿',
    color: 'text-gray-400',
    bg: 'bg-gray-500/20',
  },
  revised: {
    label: '已修改',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
  },
  final: {
    label: '定稿',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
  },
};

// ---------------------------------------------------------------------------
// Context menu
// ---------------------------------------------------------------------------
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  chapterId: number | null;
}

const initialContextMenu: ContextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  chapterId: null,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ChapterTree({
  chapters,
  currentChapterId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  onMarkFinal,
}: ChapterTreeProps) {
  // ---- Inline rename state ----
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ---- Context menu state ----
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState>(initialContextMenu);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu.visible) return;
    const close = () => setCtxMenu(initialContextMenu);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, [ctxMenu.visible]);

  // ---- Handlers ----
  const handleDoubleClick = useCallback(
    (chapter: Chapter, e: MouseEvent) => {
      e.stopPropagation();
      setEditingId(chapter.id);
      setEditValue(chapter.title);
    },
    [],
  );

  const commitRename = useCallback(() => {
    if (editingId !== null && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  }, [editingId, editValue, onRename]);

  const handleContextMenu = useCallback(
    (chapter: Chapter, e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCtxMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        chapterId: chapter.id,
      });
    },
    [],
  );

  const handleCtxRename = useCallback(() => {
    if (ctxMenu.chapterId !== null) {
      const ch = chapters.find((c) => c.id === ctxMenu.chapterId);
      if (ch) {
        setEditingId(ch.id);
        setEditValue(ch.title);
      }
    }
    setCtxMenu(initialContextMenu);
  }, [ctxMenu.chapterId, chapters]);

  const handleCtxDelete = useCallback(() => {
    if (ctxMenu.chapterId !== null) {
      onDelete(ctxMenu.chapterId);
    }
    setCtxMenu(initialContextMenu);
  }, [ctxMenu.chapterId, onDelete]);

  const handleCtxMarkFinal = useCallback(() => {
    if (ctxMenu.chapterId !== null && onMarkFinal) {
      onMarkFinal(ctxMenu.chapterId);
    }
    setCtxMenu(initialContextMenu);
  }, [ctxMenu.chapterId, onMarkFinal]);

  // ---- Sort chapters ----
  const sorted = [...chapters].sort((a, b) => a.sort_order - b.sort_order);

  // ---- Render ----
  return (
    <div className="flex h-full flex-col bg-[var(--theme-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--theme-text)]">
          章节列表
        </h2>
        <span className="text-xs text-[var(--theme-text-dim)]">
          {chapters.length} 章
        </span>
      </div>

      {/* Chapter list */}
      <ul className="flex-1 overflow-y-auto py-1" role="listbox" aria-label="章节列表">
        {sorted.map((chapter) => {
          const isActive = chapter.id === currentChapterId;
          const isEditing = chapter.id === editingId;
          const sc = statusConfig[chapter.status];

          return (
            <li
              key={chapter.id}
              role="option"
              aria-selected={isActive}
              className={`group relative mx-2 mb-1 flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]'
                  : 'text-[var(--theme-text)] hover:bg-[var(--theme-panel)]'
              }`}
              onClick={() => !isEditing && onSelect(chapter.id)}
              onDoubleClick={(e) => handleDoubleClick(chapter, e)}
              onContextMenu={(e) => handleContextMenu(chapter, e)}
            >
              {/* Status dot */}
              <span
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${sc.bg}`}
                title={sc.label}
              >
                <span className={`block h-2 w-2 rounded-full ${sc.color.replace('text-', 'bg-')}`} />
              </span>

              {/* Title / edit input */}
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditValue('');
                    }
                  }}
                  className="flex-1 rounded border border-[var(--theme-accent)] bg-[var(--theme-input)] px-1 py-0.5 text-sm text-[var(--theme-text)] outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 truncate">{chapter.title}</span>
              )}

              {/* Word count badge */}
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  isActive
                    ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                    : 'bg-[var(--theme-panel)] text-[var(--theme-text-dim)]'
                }`}
              >
                {chapter.word_count.toLocaleString()} 字
              </span>

              {/* Hover context hint */}
              <button
                className="hidden shrink-0 rounded p-0.5 text-[var(--theme-text-dim)] hover:text-[var(--theme-text)] group-hover:block"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(chapter, e as unknown as MouseEvent);
                }}
                aria-label="更多操作"
              >
                <MoreVertical size={14} />
              </button>
            </li>
          );
        })}

        {sorted.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-[var(--theme-text-dim)]">
            暂无章节，点击下方按钮添加
          </li>
        )}
      </ul>

      {/* Add chapter button */}
      <div className="border-t border-[var(--theme-border)] p-3">
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--theme-border)] py-2 text-sm text-[var(--theme-text-dim)] transition-colors hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)]"
        >
          <Plus size={16} />
          添加章节
        </button>
      </div>

      {/* ---- Context menu ---- */}
      {ctxMenu.visible && (
        <div
          className="fixed z-50 min-w-[160px] rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] py-1 shadow-xl"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-panel)]"
            onClick={handleCtxRename}
          >
            <Pencil size={14} />
            重命名
          </button>
          {onMarkFinal && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--theme-text)] hover:bg-[var(--theme-panel)]"
              onClick={handleCtxMarkFinal}
            >
              <CheckCircle2 size={14} />
              标记为定稿
            </button>
          )}
          <div className="my-1 border-t border-[var(--theme-border)]" />
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            onClick={handleCtxDelete}
          >
            <Trash2 size={14} />
            删除章节
          </button>
        </div>
      )}
    </div>
  );
}
