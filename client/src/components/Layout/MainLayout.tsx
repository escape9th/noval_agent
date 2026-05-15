import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface MainLayoutProps {
  /** Override the default top-bar; pass null to hide it entirely. */
  topBar?: ReactNode;
  /** Called when the settings gear is clicked. */
  onOpenSettings?: () => void;
}

export default function MainLayout({ topBar, onOpenSettings }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSettingsOpen] = useState(false);

  const isRoot = location.pathname === '/' || location.pathname === '/project';

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  function handleSettingsClick() {
    if (onOpenSettings) {
      onOpenSettings();
    }
    setSettingsOpen((v) => !v);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--theme-bg)] text-[var(--theme-text)]">
      {/* ---- Top bar ---- */}
      {topBar !== null && (
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface)] px-4">
          {!isRoot && (
            <button
              onClick={handleBack}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--theme-text-dim)] transition-colors hover:bg-[var(--theme-panel)] hover:text-[var(--theme-text)]"
              aria-label="返回"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {topBar ?? <span className="flex-1 text-sm font-medium">小说助手</span>}

          <button
            onClick={handleSettingsClick}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--theme-text-dim)] transition-colors hover:bg-[var(--theme-panel)] hover:text-[var(--theme-text)]"
            aria-label="设置"
          >
            <Settings size={18} />
          </button>
        </header>
      )}

      {/* ---- Page content ---- */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
