import { useTheme, type ThemeMode } from '../hooks/useTheme';
import { useLang } from '../i18n';
import { AutoThemeIcon, MoonIcon, SunIcon } from '../icons';

const MODES: { mode: ThemeMode; icon: () => JSX.Element }[] = [
  { mode: 'auto', icon: AutoThemeIcon },
  { mode: 'light', icon: SunIcon },
  { mode: 'dark', icon: MoonIcon },
];

/** Theme switch (system / light / dark), top-right corner of every page. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const { t } = useLang();

  return (
    <div className="toggle" role="radiogroup" aria-label={t.theme}>
      {MODES.map(({ mode: value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={t.themeModes[value]}
          title={t.themeModes[value]}
          onClick={() => setMode(value)}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
