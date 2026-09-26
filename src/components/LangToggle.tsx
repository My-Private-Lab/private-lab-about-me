import { LANGS, useLang } from '../i18n';

/** Language switch (EN / RU), shown next to the theme switch. */
export function LangToggle() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="toggle lang-toggle" role="radiogroup" aria-label={t.language}>
      {LANGS.map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={lang === value}
          aria-label={t.languageNames[value]}
          title={t.languageNames[value]}
          lang={value}
          onClick={() => setLang(value)}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
