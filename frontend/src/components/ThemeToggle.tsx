'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={`p-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 ${className}`}
      >
        <Moon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      title={`Toggle Tema (Saat ini: ${theme})`}
      className={`p-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-2 ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600" />
      )}
      <span className="text-xs font-medium sr-only sm:not-sr-only">
        {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
      </span>
    </button>
  );
}

export default ThemeToggle;
