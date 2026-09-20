import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
}

export const lightColors: ThemeColors = {
  background: '#f8fafc', // slate-50
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9', // slate-100
  card: '#ffffff',
  border: '#e2e8f0', // slate-200
  text: '#0f172a', // slate-900
  textSecondary: '#475569', // slate-600
  textMuted: '#94a3b8', // slate-400
  primary: '#0284c7', // sky-600
  primaryLight: '#e0f2fe', // sky-100
  success: '#10b981', // emerald-500
  successLight: '#d1fae5', // emerald-100
  warning: '#f59e0b', // amber-500
  warningLight: '#fef3c7', // amber-100
  danger: '#ef4444', // rose-500
  dangerLight: '#fee2e2', // rose-100
};

export const darkColors: ThemeColors = {
  background: '#090d16', // deeper dark slate
  surface: '#0f172a', // slate-900
  surfaceSecondary: '#1e293b', // slate-800
  card: '#0f172a',
  border: '#1e293b', // slate-800
  text: '#f8fafc', // slate-50
  textSecondary: '#cbd5e1', // slate-300
  textMuted: '#64748b', // slate-500
  primary: '#38bdf8', // sky-400
  primaryLight: '#082f49', // sky-950
  success: '#34d399', // emerald-400
  successLight: '#064e3b', // emerald-950
  warning: '#fbbf24', // amber-400
  warningLight: '#451a03', // amber-950
  danger: '#f87171', // rose-400
  dangerLight: '#4c0519', // rose-950
};

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark', // default modern dark like SafnexBD
  colors: darkColors,
  isDark: true,

  toggleTheme: async () => {
    const nextMode = get().mode === 'dark' ? 'light' : 'dark';
    const colors = nextMode === 'dark' ? darkColors : lightColors;
    set({ mode: nextMode, colors, isDark: nextMode === 'dark' });
    try {
      await AsyncStorage.setItem('safnexbd_mobile_theme', nextMode);
    } catch {}
  },

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem('safnexbd_mobile_theme');
      if (stored === 'light' || stored === 'dark') {
        set({
          mode: stored,
          colors: stored === 'dark' ? darkColors : lightColors,
          isDark: stored === 'dark',
        });
      }
    } catch {}
  },
}));
