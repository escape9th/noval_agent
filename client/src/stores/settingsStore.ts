import { create } from 'zustand';
import { settingsApi, Settings } from '../services/api';
import i18n from '../i18n';

const defaultSettings: Settings = {
  api_key: '',
  api_base_url: '',
  model: 'gpt-4',
  language: 'zh',
  theme: 'dark',
};

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  applyLocalTheme: (theme: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingsApi.get();
      set({ settings, isLoading: false });

      // Apply language (theme is handled by ThemeProvider)
      if (settings.language) {
        i18n.changeLanguage(settings.language);
        localStorage.setItem('language', settings.language);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings';
      set({ isLoading: false, error: message });
    }
  },

  updateSettings: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await settingsApi.update(data);
      set({ settings: updated, isLoading: false });

      // Apply language changes (theme handled by ThemeProvider)
      if (data.language !== undefined) {
        i18n.changeLanguage(updated.language);
        localStorage.setItem('language', updated.language);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  applyLocalTheme: (theme: string) => {
    set((state) => ({
      settings: { ...state.settings, theme },
    }));
  },
}));
