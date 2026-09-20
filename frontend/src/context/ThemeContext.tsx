'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');

  const applyTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('safnexbd_theme', newTheme);
    } catch (_) {}

    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    }
  }, []);

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('safnexbd_theme') || localStorage.getItem('safnexbd_theme')) as Theme | null;
      if (saved === 'dark' || saved === 'light') {
        applyTheme(saved);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
      } else {
        applyTheme('light');
      }
    } catch (_) {
      applyTheme('light');
    }
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const isCurrentlyDark =
      typeof document !== 'undefined'
        ? document.documentElement.classList.contains('dark')
        : theme === 'dark';
    applyTheme(isCurrentlyDark ? 'light' : 'dark');
  }, [applyTheme, theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
