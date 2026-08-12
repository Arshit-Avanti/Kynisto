'use client';

import React, { useEffect, useState } from 'react';

export type DarkThemeMode = 'cyberpunk' | 'royal' | 'obsidian' | 'light';

interface ThemeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '', size = 'md' }) => {
  const [theme, setTheme] = useState<DarkThemeMode>('cyberpunk');
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('kynisto_theme') as DarkThemeMode | null;
    if (savedTheme && ['cyberpunk', 'royal', 'obsidian', 'light'].includes(savedTheme)) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      setTheme('cyberpunk');
      applyTheme('cyberpunk');
    }
  }, []);

  const applyTheme = (newTheme: DarkThemeMode) => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', newTheme);
    body.setAttribute('data-theme', newTheme);

    // Remove existing theme classes
    root.classList.remove('mode-light', 'mode-dark', 'light-theme', 'dark-theme', 'dark', 'theme-cyberpunk', 'theme-royal', 'theme-obsidian');
    body.classList.remove('mode-light', 'mode-dark', 'light-theme', 'dark-theme', 'dark', 'theme-cyberpunk', 'theme-royal', 'theme-obsidian');

    if (newTheme === 'light') {
      root.classList.add('mode-light', 'light-theme');
      body.classList.add('mode-light', 'light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('mode-dark', 'dark-theme', 'dark', `theme-${newTheme}`);
      body.classList.add('mode-dark', 'dark-theme', 'dark', `theme-${newTheme}`);
      localStorage.setItem('theme', 'dark');
    }
  };

  const selectTheme = (newTheme: DarkThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('kynisto_theme', newTheme);
    applyTheme(newTheme);
    setOpen(false);
  };

  if (!mounted) {
    return <div className={`w-28 h-9 rounded-full bg-slate-900/50 animate-pulse ${className}`} />;
  }

  const themesList: Array<{ id: DarkThemeMode; label: string; icon: string; accentColor: string }> = [
    { id: 'cyberpunk', label: 'Cyberpunk Neon', icon: '⚡', accentColor: '#00F0FF' },
    { id: 'royal', label: 'Royal Sapphire', icon: '👑', accentColor: '#3B82F6' },
    { id: 'obsidian', label: 'Obsidian OLED', icon: '🌑', accentColor: '#E2E8F0' },
    { id: 'light', label: 'Luxe Light', icon: '☀️', accentColor: '#F59E0B' },
  ];

  const currentThemeObj = themesList.find((t) => t.id === theme) ?? themesList[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} className={className}>
      <button
        onClick={() => setOpen(!open)}
        type="button"
        aria-label="Select theme mode"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(10, 15, 30, 0.85)',
          border: `1px solid ${currentThemeObj.accentColor}44`,
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: `0 0 16px ${currentThemeObj.accentColor}33`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '14px' }}>{currentThemeObj.icon}</span>
        <span>{currentThemeObj.label}</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>⌄</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 9999,
            minWidth: '190px',
            padding: '6px',
            borderRadius: '16px',
            background: 'rgba(10, 15, 30, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {themesList.map((item) => (
            <button
              key={item.id}
              onClick={() => selectTheme(item.id)}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: theme === item.id ? `${item.accentColor}22` : 'transparent',
                border: theme === item.id ? `1px solid ${item.accentColor}66` : '1px solid transparent',
                color: theme === item.id ? item.accentColor : '#CBD5E1',
                fontSize: '13px',
                fontWeight: theme === item.id ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {theme === item.id && <span style={{ fontSize: '12px', fontWeight: 800 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
