import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { themes } from '../../themes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SettingsValues {
  apiKey: string;
  baseUrl: string;
  model: string;
  theme: string;
  language: string;
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  values: SettingsValues;
  onChange: (values: Partial<SettingsValues>) => void;
}

// ---------------------------------------------------------------------------
// Language options
// ---------------------------------------------------------------------------
const languageOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SettingsPanel({
  open,
  onClose,
  values,
  onChange,
}: SettingsPanelProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [localValues, setLocalValues] = useState<SettingsValues>(values);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync incoming values
  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid closing immediately on the same click that opened
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose]);

  const update = (patch: Partial<SettingsValues>) => {
    const next = { ...localValues, ...patch };
    setLocalValues(next);
    onChange(patch);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm">
      <div
        ref={panelRef}
        className="flex h-full w-full max-w-md flex-col overflow-hidden bg-[var(--theme-surface)] shadow-2xl animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--theme-text)]">
            设置
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--theme-text-dim)] transition-colors hover:bg-[var(--theme-panel)] hover:text-[var(--theme-text)]"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* ---- API 配置 ---- */}
          <section className="mb-8">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">
              API 配置
            </h3>

            {/* API Key */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm text-[var(--theme-text)]">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={localValues.apiKey}
                  onChange={(e) => update({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2 pr-10 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] outline-none transition-colors focus:border-[var(--theme-accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-text-dim)] hover:text-[var(--theme-text)]"
                  aria-label={showApiKey ? '隐藏密钥' : '显示密钥'}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Base URL */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm text-[var(--theme-text)]">
                Base URL
              </label>
              <input
                type="text"
                value={localValues.baseUrl}
                onChange={(e) => update({ baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] outline-none transition-colors focus:border-[var(--theme-accent)]"
              />
            </div>

            {/* Model */}
            <div>
              <label className="mb-1.5 block text-sm text-[var(--theme-text)]">
                模型
              </label>
              <input
                type="text"
                value={localValues.model}
                onChange={(e) => update({ model: e.target.value })}
                placeholder="gpt-4o"
                className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] outline-none transition-colors focus:border-[var(--theme-accent)]"
              />
            </div>
          </section>

          {/* ---- 外观 ---- */}
          <section className="mb-8">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">
              外观
            </h3>

            {/* Theme quick switch */}
            <div className="mb-4">
              <label className="mb-2 block text-sm text-[var(--theme-text)]">
                主题
              </label>
              <div className="flex gap-2">
                {themes.map((t) => {
                  const isActive = localValues.theme === t.name;
                  return (
                    <button
                      key={t.name}
                      onClick={() => update({ theme: t.name })}
                      className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs transition-all ${
                        isActive
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                          : 'border-[var(--theme-border)] hover:border-[var(--theme-text-dim)]'
                      }`}
                    >
                      {/* Color preview dot */}
                      <span
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: t.colors.accent }}
                      />
                      <span
                        className={
                          isActive
                            ? 'text-[var(--theme-accent)]'
                            : 'text-[var(--theme-text-dim)]'
                        }
                      >
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="mb-2 block text-sm text-[var(--theme-text)]">
                语言
              </label>
              <div className="flex gap-2">
                {languageOptions.map((lang) => {
                  const isActive = localValues.language === lang.value;
                  return (
                    <button
                      key={lang.value}
                      onClick={() => update({ language: lang.value })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]'
                          : 'border-[var(--theme-border)] text-[var(--theme-text-dim)] hover:border-[var(--theme-text-dim)]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--theme-border)] px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-[var(--theme-accent)] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
