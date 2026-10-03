'use client';

import React from 'react';
import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ variant = 'default' }: { variant?: 'default' | 'compact' | 'landing' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer border ${
        variant === 'landing'
          ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs backdrop-blur-xs'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-amber-400 border-slate-200 dark:border-slate-700 hover:border-amber-400 shadow-xs'
      }`}
      title={isDark ? 'Açık Temaya Geç / Light Mode' : 'Koyu Temaya Geç / Dark Mode'}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
