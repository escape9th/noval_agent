/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        novel: {
          bg:        'var(--theme-bg)',
          surface:   'var(--theme-surface)',
          panel:     'var(--theme-panel)',
          accent:    'var(--theme-accent)',
          muted:     'var(--theme-muted)',
          text:      'var(--theme-text)',
          'text-dim':'var(--theme-text-dim)',
        },
      },
      borderColor: {
        novel: 'var(--theme-border)',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      typography: {
        novel: {
          css: {
            '--tw-prose-body': 'var(--theme-text)',
            '--tw-prose-headings': 'var(--theme-accent)',
            '--tw-prose-links': 'var(--theme-muted)',
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
