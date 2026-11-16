'use client';

import { useEffect, useState } from 'react';
import { Menu, Moon, Search, Sun } from 'lucide-react';
import { callOss } from '@/lib/oss-scripts';

export default function TopBar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const sync = () => {
      const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      setTheme(t);
    };
    const raf = requestAnimationFrame(sync);
    window.addEventListener('oss-theme-change', sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('oss-theme-change', sync);
    };
  }, []);

  return (
    <header id="top-bar">
      <button
        id="menu-btn"
        className="icon-btn"
        type="button"
        onClick={() => callOss('toggleSide')}
        aria-label="Buka menu navigasi"
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      <div className="tb-spacer" aria-hidden="true" />

      <div className="tb-badges">
        <span className="tb-badge" id="tb-cases">N=0</span>
      </div>

      <button
        className="icon-btn"
        type="button"
        onClick={() => window.__ossToggleTheme?.()}
        title={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
        aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      >
        {theme === 'dark' ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
      </button>

      <button
        className="icon-btn tb-cmd"
        type="button"
        onClick={() => callOss('openCmd')}
        title="Cari analisis dan perintah"
        aria-label="Cari analisis dan perintah"
      >
        <Search size={17} strokeWidth={2} />
      </button>
    </header>
  );
}
