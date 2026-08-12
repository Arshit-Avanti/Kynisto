"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Check initial theme from document class or localStorage
    const isDark = document.documentElement.classList.contains("dark-theme") || document.documentElement.classList.contains("dark") || document.documentElement.classList.contains("mode-dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    const root = document.documentElement;
    const body = document.body;

    if (newTheme === "dark") {
      root.classList.remove("light-theme", "mode-light");
      body.classList.remove("light-theme", "mode-light");
      root.classList.add("dark", "dark-theme", "mode-dark");
      body.classList.add("dark", "dark-theme", "mode-dark");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("kynisto_theme", "cyberpunk");
    } else {
      root.classList.remove("dark", "dark-theme", "mode-dark", "theme-cyberpunk", "theme-royal", "theme-obsidian");
      body.classList.remove("dark", "dark-theme", "mode-dark", "theme-cyberpunk", "theme-royal", "theme-obsidian");
      root.classList.add("light-theme", "mode-light");
      body.classList.add("light-theme", "mode-light");
      localStorage.setItem("theme", "light");
      localStorage.setItem("kynisto_theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-110 active:scale-90"
      aria-label="Toggle Theme"
      style={{
        border: "1px solid var(--glass-border)",
        background: "var(--glass-surface)",
        color: "var(--text-primary)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        animation: "springUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards"
      }}
    >
      {theme === "light" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}
