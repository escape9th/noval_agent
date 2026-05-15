import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import {
  Send,
  Loader2,
  BookOpen,
  Search,
  ChevronDown,
  Sparkles,
  PenTool,
  Bot,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: string;
  created_at: string;
}

export interface ChatStyle {
  id: number;
  name: string;
}

type ChatMode = 'plan' | 'write' | 'auto';
type QuickAction = 'evaluate' | 'check';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string, mode: ChatMode) => void;
  onQuickAction: (action: QuickAction) => void;
  isLoading: boolean;
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  styles: ChatStyle[];
  activeStyleId: number | null;
  onStyleChange: (styleId: number) => void;
}

// ---------------------------------------------------------------------------
// Mode config
// ---------------------------------------------------------------------------
const modeButtons: { value: ChatMode; label: string; icon: typeof Sparkles }[] =
  [
    { value: 'plan', label: '规划', icon: BookOpen },
    { value: 'write', label: '写作', icon: PenTool },
    { value: 'auto', label: '自动', icon: Sparkles },
  ];

// ---------------------------------------------------------------------------
// Simple markdown renderer (bold, italic, code, line breaks)
// ---------------------------------------------------------------------------
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ChatPanel({
  messages,
  onSend,
  onQuickAction,
  isLoading,
  currentMode,
  onModeChange,
  styles,
  activeStyleId,
  onStyleChange,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ---- Auto-scroll to bottom ----
  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // ---- Auto-resize textarea ----
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // ---- Send ----
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed, currentMode);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend, currentMode]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ---- Render ----
  return (
    <div className="flex h-full flex-col bg-[var(--theme-surface)]">
      {/* ---- Toolbar ---- */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--theme-border)] px-4 py-2">
        {/* Mode selector */}
        <div className="flex rounded-lg bg-[var(--theme-bg)] p-0.5">
          {modeButtons.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onModeChange(value)}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentMode === value
                  ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                  : 'text-[var(--theme-text-dim)] hover:text-[var(--theme-text)]'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Style selector */}
        {styles.length > 0 && (
          <div className="relative">
            <select
              value={activeStyleId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) onStyleChange(Number(val));
              }}
              className="appearance-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] py-1.5 pl-3 pr-8 text-xs text-[var(--theme-text)] outline-none focus:border-[var(--theme-accent)]"
            >
              <option value="">默认风格</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-dim)]"
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => onQuickAction('evaluate')}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-[var(--theme-border)] px-2.5 py-1.5 text-xs text-[var(--theme-text-dim)] transition-colors hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] disabled:opacity-50"
          >
            <BookOpen size={14} />
            评价本章
          </button>
          <button
            onClick={() => onQuickAction('check')}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-[var(--theme-border)] px-2.5 py-1.5 text-xs text-[var(--theme-text-dim)] transition-colors hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] disabled:opacity-50"
          >
            <Search size={14} />
            检查本章
          </button>
        </div>
      </div>

      {/* ---- Messages ---- */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full flex-col items-center justify-center text-[var(--theme-text-dim)]">
            <Bot size={48} className="mb-4 opacity-30" />
            <p className="text-sm">开始和 AI 助手对话吧</p>
            <p className="mt-1 text-xs opacity-60">
              输入你的想法，或使用上方快捷操作
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[var(--theme-userBubble)] text-white'
                    : 'bg-[var(--theme-assistantBubble)] text-[var(--theme-text)]'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div
                    className="prose-chat"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(msg.content),
                    }}
                  />
                )}

                {/* Timestamp + mode badge */}
                <div
                  className={`mt-1 flex items-center gap-2 text-[10px] ${
                    isUser ? 'justify-end text-white/50' : 'text-[var(--theme-text-dim)]'
                  }`}
                >
                  {msg.mode && (
                    <span className="rounded bg-[var(--theme-bg)]/50 px-1 py-0.5">
                      {msg.mode}
                    </span>
                  )}
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="mb-4 flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--theme-assistantBubble)] px-4 py-3 text-sm text-[var(--theme-text-dim)]">
              <Loader2 size={16} className="animate-spin" />
              <span>AI 思考中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ---- Input area ---- */}
      <div className="shrink-0 border-t border-[var(--theme-border)] bg-[var(--theme-surface)] p-3">
        <div className="flex items-end gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 focus-within:border-[var(--theme-accent)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Shift+Enter 换行)"
            rows={1}
            className="max-h-40 flex-1 resize-none bg-transparent text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent)] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="发送"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
