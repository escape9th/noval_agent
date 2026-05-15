import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { getThemeByName, type ThemeConfig } from '../../themes';
import { useSettingsStore } from '../../stores/settingsStore';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface ThemeContextValue {
  theme: ThemeConfig;
  themeName: string;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: getThemeByName('dark'),
  themeName: 'dark',
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// ---------------------------------------------------------------------------
// Resolve "system" to an actual theme name
// ---------------------------------------------------------------------------
function resolveThemeName(raw: string): string {
  if (raw === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const settingsTheme = useSettingsStore((s) => s.settings.theme);
  const themeName = useMemo(() => resolveThemeName(settingsTheme), [settingsTheme]);
  const theme = useMemo(() => getThemeByName(themeName), [themeName]);

  // Apply class + CSS variables to <html>
  useEffect(() => {
    const root = document.documentElement;

    // Remove old theme classes
    root.classList.remove('theme-dark', 'theme-light', 'theme-anime', 'dark');
    root.classList.add(theme.className);

    // Tailwind darkMode: 'class' — keep "dark" for dark-based themes
    if (theme.name === 'dark') {
      root.classList.add('dark');
    }

    // Inject CSS variables
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Meta theme-color for mobile browsers
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme.colors.bg);
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themeName }),
    [theme, themeName],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
