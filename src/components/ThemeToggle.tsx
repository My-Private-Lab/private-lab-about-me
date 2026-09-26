import { useTheme, type ThemeMode } from '../hooks/useTheme';
import { AutoThemeIcon, MoonIcon, SunIcon } from '../icons';

const MODES: { mode: ThemeMode; label: string; icon: () => JSX.Element }[] = [
  { mode: 'auto', label: 'System theme', icon: AutoThemeIcon },
  { mode: 'light', label: 'Light theme', icon: SunIcon },
  { mode: 'dark', label: 'Dark theme', icon: MoonIcon },
];

/** Theme switch (system / light / dark) pinned to the top-right corner of every page. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Theme">
      {MODES.map(({ mode: value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={label}
          title={label}
          onClick={() => setMode(value)}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
