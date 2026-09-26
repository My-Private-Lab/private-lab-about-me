import { useCallback, useEffect, useState } from 'react';

/** 'auto' follows the OS setting; 'light' / 'dark' pin the theme. */
export type ThemeMode = 'auto' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

// Keep in sync with the pre-paint script in index.html.
const STORAGE_KEY = 'theme';
const THEME_COLORS: Record<Theme, string> = { dark: '#0d1117', light: '#f6f8fa' };

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function readMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable — fall back to the OS setting */
  }
  return 'auto';
}

function writeMode(mode: ThemeMode): void {
  try {
    if (mode === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable — the choice lasts until reload */
  }
}

/** Current theme plus a setter; applies it to <html data-theme> and the browser chrome colour. */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(readMode);
  const [systemDark, setSystemDark] = useState(() => systemQuery().matches);

  useEffect(() => {
    const query = systemQuery();
    const update = () => setSystemDark(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const theme: Theme = mode === 'auto' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }, [theme]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    writeMode(next);
  }, []);

  return { mode, theme, setMode };
}
