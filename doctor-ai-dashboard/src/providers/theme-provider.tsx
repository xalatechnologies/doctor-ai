'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeMode, theme } from '@/styles/theme';

interface ThemeContextType {
  mode: ThemeMode;
  theme: Theme[ThemeMode];
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    // Check if user has a theme preference in localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme) {
      setMode(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme', newMode);
    document.documentElement.classList.toggle('dark');
  };

  const value = {
    mode,
    theme: theme[mode],
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 