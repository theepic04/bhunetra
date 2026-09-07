import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabelsOnMobile?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabelsOnMobile = false
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      id="theme-mode-toggle"
      className={`inline-flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-100/90 text-xs font-semibold shadow-2xs transition-colors ${className}`}
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        id="theme-btn-light"
        onClick={() => setTheme('light')}
        className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="Switch to Light Theme"
        aria-pressed={theme === 'light'}
      >
        <span className="text-xs leading-none">☀️</span>
        <span className={showLabelsOnMobile ? 'inline' : 'hidden sm:inline font-bold'}>Light</span>
      </button>

      <button
        type="button"
        id="theme-btn-dark"
        onClick={() => setTheme('dark')}
        className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-slate-800 text-slate-100 font-bold shadow-xs border border-slate-700'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="Switch to Dark Theme"
        aria-pressed={theme === 'dark'}
      >
        <span className="text-xs leading-none">🌙</span>
        <span className={showLabelsOnMobile ? 'inline' : 'hidden sm:inline font-bold'}>Dark</span>
      </button>
    </div>
  );
};
