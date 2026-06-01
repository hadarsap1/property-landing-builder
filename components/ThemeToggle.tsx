'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pb-theme');
    const isDark = saved ? saved === 'dark' : false;
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('pb-theme', next ? 'dark' : 'light');
  }

  if (dark === null) return <div className="w-8 h-8" />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-base ${className}`}
      style={{
        background: 'var(--pb-surface2)',
        border: '1px solid var(--pb-border)',
        color: 'var(--pb-text2)',
      }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
