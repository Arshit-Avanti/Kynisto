'use client';

import React, { useEffect, useState } from 'react';

export type Theme = 'oled' | 'light';

interface ThemeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '', size = 'md' }) => {
  const [theme, setTheme] = useState<Theme>('oled');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('kynisto_theme') as Theme | null;
    if (savedTheme && (savedTheme === 'oled' || savedTheme === 'light')) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check prefers-color-scheme or default to oled
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      const defaultTheme: Theme = prefersLight ? 'light' : 'oled';
      setTheme(defaultTheme);
      applyTheme(defaultTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', newTheme);
    body.setAttribute('data-theme', newTheme);

    if (newTheme === 'light') {
      root.classList.remove('mode-dark');
      root.classList.add('mode-light');
      body.classList.remove('mode-dark');
      body.classList.add('mode-light');
    } else {
      root.classList.remove('mode-light');
      root.classList.add('mode-dark');
      body.classList.remove('mode-light');
      body.classList.add('mode-dark');
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'oled' ? 'light' : 'oled';
    setTheme(nextTheme);
    localStorage.setItem('kynisto_theme', nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <div
        className={`inline-block rounded-full bg-slate-900/50 animate-pulse ${className}`}
        style={{ width: size === 'sm' ? '60px' : size === 'lg' ? '88px' : '74px', height: size === 'sm' ? '32px' : size === 'lg' ? '44px' : '38px' }}
      />
    );
  }

  const isOled = theme === 'oled';

  const dimensions = {
    sm: { width: '64px', height: '32px', pillWidth: '24px', pillOffset: '36px', iconSize: 'w-3.5 h-3.5' },
    md: { width: '74px', height: '38px', pillWidth: '28px', pillOffset: '42px', iconSize: 'w-4 h-4' },
    lg: { width: '88px', height: '44px', pillWidth: '34px', pillOffset: '50px', iconSize: 'w-5 h-5' },
  }[size];

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isOled ? 'Luxe Light' : 'Pitch Black OLED'} mode`}
      title={`Current theme: ${isOled ? 'Pitch Black OLED (Emerald & Gold)' : 'Luxe Light Mode (Indigo & Teal)'}. Click to toggle.`}
      className={`theme-switcher-btn relative inline-flex items-center justify-between p-1 rounded-full cursor-pointer transition-all duration-300 border backdrop-blur-md select-none group ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        background: isOled ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: isOled ? 'rgba(34, 197, 94, 0.35)' : 'rgba(79, 70, 229, 0.35)',
        boxShadow: isOled
          ? '0 0 20px rgba(34, 197, 94, 0.25), inset 0 2px 4px rgba(0,0,0,0.9)'
          : '0 0 20px rgba(79, 70, 229, 0.25), inset 0 2px 4px rgba(255,255,255,0.9)',
      }}
    >
      {/* OLED / Dark Icon */}
      <span className="flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110" style={{ width: dimensions.pillWidth }}>
        <svg
          className={`${dimensions.iconSize} transition-colors duration-300 ${isOled ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'text-slate-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </span>

      {/* Luxe Light / Sun Icon */}
      <span className="flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110" style={{ width: dimensions.pillWidth }}>
        <svg
          className={`${dimensions.iconSize} transition-colors duration-300 ${!isOled ? 'text-indigo-600 drop-shadow-[0_0_8px_rgba(79,70,229,0.8)]' : 'text-amber-500/70'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </span>

      {/* Sliding Glow Pill */}
      <span
        className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out z-0 pointer-events-none"
        style={{
          width: dimensions.pillWidth,
          left: isOled ? '4px' : dimensions.pillOffset,
          background: isOled
            ? 'linear-gradient(135deg, #22C55E 0%, #F59E0B 100%)'
            : 'linear-gradient(135deg, #4F46E5 0%, #14B8A6 100%)',
          boxShadow: isOled
            ? '0 0 12px rgba(34, 197, 94, 0.6)'
            : '0 0 12px rgba(79, 70, 229, 0.6)',
        }}
      />
    </button>
  );
};

export default ThemeSwitcher;
