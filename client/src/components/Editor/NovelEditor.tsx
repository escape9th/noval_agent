import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from '../Theme/ThemeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NovelEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Word count helper
// ---------------------------------------------------------------------------
function countWords(text: string): number {
  if (!text.trim()) return 0;
  // Count Chinese characters individually, then count Latin words
  const chineseChars = text.match(/[一-鿿㐀-䶿]/g)?.length ?? 0;
  const latinWords =
    text
      .replace(/[一-鿿㐀-䶿]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0).length ?? 0;
  return chineseChars + latinWords;
}

// ---------------------------------------------------------------------------
// Placeholder extension (lightweight, no extra dep)
// ---------------------------------------------------------------------------
function placeholderPlugin(text: string) {
  return EditorView.theme({
    '.cm-content[contenteditable=true]:empty::before': {
      content: `"${text}"`,
      color: 'var(--theme-text-dim)',
      fontStyle: 'italic',
      pointerEvents: 'none',
    },
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function NovelEditor({
  content,
  onChange,
  placeholder = '开始写作...',
}: NovelEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [wordCount, setWordCount] = useState(() => countWords(content));
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { themeName } = useTheme();

  // Keep callback ref fresh
  onChangeRef.current = onChange;

  // ---- Create editor ----
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const isDark = themeName !== 'light';
    const extensions = [
      basicSetup,
      markdown(),
      placeholderPlugin(placeholder),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newDoc = update.state.doc.toString();
          setWordCount(countWords(newDoc));

          // Debounced onChange (1 second)
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            onChangeRef.current(newDoc);
          }, 1000);
        }
      }),
      EditorView.lineWrapping,
      // Theme
      ...(isDark ? [oneDark] : []),
      // Base dark/light styling
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '15px',
        },
        '.cm-scroller': {
          fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
          overflow: 'auto',
          padding: '1rem 0',
        },
        '.cm-content': {
          caretColor: 'var(--theme-accent)',
          padding: '0 2rem',
        },
        '&.cm-focused .cm-cursor': {
          borderLeftColor: 'var(--theme-accent)',
        },
        '.cm-gutters': {
          display: 'none',
        },
        '.cm-activeLine': {
          backgroundColor: 'transparent',
        },
        '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
          backgroundColor: isDark
            ? 'rgba(233, 69, 96, 0.15)'
            : 'rgba(225, 29, 72, 0.12)',
        },
      }),
    ];

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });

    viewRef.current = view;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      view.destroy();
      viewRef.current = null;
    };
    // Re-create only when theme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeName, placeholder]);

  // ---- Sync external content changes ----
  const prevContentRef = useRef(content);
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    // Only push if the change came from outside (not from typing)
    if (content !== prevContentRef.current) {
      prevContentRef.current = content;
      const currentDoc = view.state.doc.toString();
      if (currentDoc !== content) {
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: content },
        });
      }
    }
  }, [content]);

  // ---- Render ----
  return (
    <div className="flex h-full flex-col bg-[var(--theme-bg)]">
      {/* Editor */}
      <div ref={editorContainerRef} className="flex-1 overflow-hidden" />

      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-1.5">
        <span className="text-xs text-[var(--theme-text-dim)]">
          字数：{wordCount.toLocaleString()}
        </span>
        <span className="text-xs text-[var(--theme-text-dim)]">
          Markdown 编辑器 · 自动保存已启用
        </span>
      </div>
    </div>
  );
}
