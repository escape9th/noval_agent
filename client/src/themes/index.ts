export interface ThemeColors {
  bg: string;
  surface: string;
  panel: string;
  accent: string;
  muted: string;
  text: string;
  textDim: string;
  border: string;
  input: string;
  inputFocus: string;
  success: string;
  warning: string;
  error: string;
  userBubble: string;
  assistantBubble: string;
}

export interface ThemeConfig {
  name: string;
  label: string;
  className: string;
  colors: ThemeColors;
  cssVariables: Record<string, string>;
}

export const darkTheme: ThemeConfig = {
  name: 'dark',
  label: '深色',
  className: 'theme-dark',
  colors: {
    bg: '#1a1a2e',
    surface: '#16213e',
    panel: '#0f3460',
    accent: '#e94560',
    muted: '#533483',
    text: '#eaeaea',
    textDim: '#8892b0',
    border: '#233554',
    input: '#0d1b2a',
    inputFocus: '#1b2838',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    userBubble: '#2563eb',
    assistantBubble: '#1e293b',
  },
  cssVariables: {
    '--theme-bg': '#1a1a2e',
    '--theme-surface': '#16213e',
    '--theme-panel': '#0f3460',
    '--theme-accent': '#e94560',
    '--theme-muted': '#533483',
    '--theme-text': '#eaeaea',
    '--theme-text-dim': '#8892b0',
    '--theme-border': '#233554',
  },
};

export const lightTheme: ThemeConfig = {
  name: 'light',
  label: '浅色',
  className: 'theme-light',
  colors: {
    bg: '#f8fafc',
    surface: '#ffffff',
    panel: '#f1f5f9',
    accent: '#e11d48',
    muted: '#94a3b8',
    text: '#0f172a',
    textDim: '#64748b',
    border: '#e2e8f0',
    input: '#ffffff',
    inputFocus: '#f8fafc',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    userBubble: '#3b82f6',
    assistantBubble: '#f1f5f9',
  },
  cssVariables: {
    '--theme-bg': '#f8fafc',
    '--theme-surface': '#ffffff',
    '--theme-panel': '#f1f5f9',
    '--theme-accent': '#e11d48',
    '--theme-muted': '#94a3b8',
    '--theme-text': '#0f172a',
    '--theme-text-dim': '#64748b',
    '--theme-border': '#e2e8f0',
  },
};

export const animeTheme: ThemeConfig = {
  name: 'anime',
  label: '暖色',
  className: 'theme-anime',
  colors: {
    bg: '#fdf6ec',
    surface: '#fffcf5',
    panel: '#fef3e2',
    accent: '#e88d67',
    muted: '#b8d4a3',
    text: '#4a3728',
    textDim: '#8b7a6b',
    border: '#e6d5c3',
    input: '#fff9f0',
    inputFocus: '#fff3e0',
    success: '#7fb069',
    warning: '#f0b429',
    error: '#e07a5f',
    userBubble: '#a3d9a5',
    assistantBubble: '#fef0e1',
  },
  cssVariables: {
    '--theme-bg': '#fdf6ec',
    '--theme-surface': '#fffcf5',
    '--theme-panel': '#fef3e2',
    '--theme-accent': '#e88d67',
    '--theme-muted': '#b8d4a3',
    '--theme-text': '#4a3728',
    '--theme-text-dim': '#8b7a6b',
    '--theme-border': '#e6d5c3',
    '--anime-pink': '#f2a7b3',
    '--anime-green': '#7fb069',
    '--anime-mint': '#a8d8c8',
    '--anime-orange': '#e88d67',
    '--anime-cream': '#fdf6ec',
    '--anime-sakura': '#f8c3d0',
    '--anime-forest': '#5a8f5a',
    '--anime-glow': '0 0 15px rgba(232, 141, 103, 0.25)',
    '--anime-gradient': 'linear-gradient(135deg, #a3d9a5 0%, #f2a7b3 40%, #e88d67 100%)',
    '--anime-campfire': 'linear-gradient(180deg, #fdf6ec 0%, #f8e8d0 50%, #e88d67 150%)',
  },
};

export const themes: ThemeConfig[] = [darkTheme, lightTheme, animeTheme];

export function getThemeByName(name: string): ThemeConfig {
  return themes.find((t) => t.name === name) ?? darkTheme;
}
