import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BackLink } from '../components/BackLink';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  FIELD_DEFS,
  describeCron,
  describeCronError,
  describeField,
  expandMacro,
  nextRuns,
  parseCron,
  splitFields,
} from '../lib/cron';
import { describeCronErrorRu, describeCronRu, describeFieldRu } from '../lib/cron-ru';
import { CopyButton } from '../components/CopyButton';
import { useLang, type Lang } from '../i18n';
import type { Messages } from '../i18n/en';

const DEFAULT_EXPRESSION = '*/5 9-17 * * MON-FRI';
const NEXT_RUNS_COUNT = 5;

const PRESETS: { key: keyof Messages['cron']['presets']; expression: string }[] = [
  { key: 'everyMinute', expression: '* * * * *' },
  { key: 'every5Minutes', expression: '*/5 * * * *' },
  { key: 'hourly', expression: '0 * * * *' },
  { key: 'dailyMidnight', expression: '0 0 * * *' },
  { key: 'weekdays9', expression: '0 9 * * MON-FRI' },
  { key: 'everyMonday', expression: '0 0 * * MON' },
  { key: 'firstOfMonth', expression: '0 0 1 * *' },
  { key: 'everyQuarter', expression: '0 0 1 */3 *' },
];

/** Descriptions and error messages in the page language. */
const CRON_TEXT = {
  en: { describeCron, describeField, describeError: describeCronError },
  ru: { describeCron: describeCronRu, describeField: describeFieldRu, describeError: describeCronErrorRu },
} satisfies Record<Lang, unknown>;

function runFormatter(lang: Lang) {
  return new Intl.DateTimeFormat(lang, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function Cron() {
  const { lang, t } = useLang();
  usePageMeta({ title: t.pageTitle(t.cron.title) });
  const text = CRON_TEXT[lang];
  const formatRun = useMemo(() => runFormatter(lang), [lang]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [expression, setExpression] = useState(
    () => searchParams.get('expr') ?? DEFAULT_EXPRESSION,
  );

  const result = useMemo(() => parseCron(expression), [expression]);

  // Recomputed on every edit so "next runs" always start from the current time.
  const runs = useMemo(
    () => (result.ok ? nextRuns(result.cron, new Date(), NEXT_RUNS_COUNT) : []),
    [result],
  );

  /** The five raw field tokens driving the per-field inputs. */
  const tokens = useMemo(() => {
    const expanded = expandMacro(expression);
    const parts = splitFields(expanded ?? expression);
    return FIELD_DEFS.map((_, index) => parts[index] ?? '');
  }, [expression]);

  function update(next: string) {
    setExpression(next);
    setSearchParams(next.trim() === '' ? {} : { expr: next.trim() }, { replace: true });
  }

  function updateField(index: number, value: string) {
    const next = [...tokens];
    next[index] = value.trim() === '' ? '*' : value.trim();
    update(next.join(' '));
  }

  const errorField = result.ok ? undefined : result.error.field;

  return (
    <main className="card card-projects card-tool">
      <h1>
        <BackLink to="/utils" label={t.backToUtils} />
        {t.cron.title}
      </h1>
      <p className="description">{t.cron.description}</p>

      <div className="tool-input-row">
        <input
          className={`tool-input cron-input${result.ok ? '' : ' tool-invalid'}`}
          value={expression}
          onChange={(event) => update(event.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          enterKeyHint="done"
          aria-label={t.cron.inputLabel}
          aria-invalid={!result.ok}
          placeholder="* * * * *"
        />
        <CopyButton text={expression.trim()} label={t.cron.copyExpression} />
      </div>

      <div className="cron-fields">
        {FIELD_DEFS.map((def, index) => (
          <label className="cron-field" key={def.key}>
            <span className="cron-field-label">{t.cron.fields[def.key]}</span>
            <input
              className={`cron-field-input${errorField === def.key ? ' tool-invalid' : ''}`}
              value={tokens[index]}
              onChange={(event) => updateField(index, event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              enterKeyHint="done"
              aria-label={t.cron.fields[def.key]}
            />
            <span className="cron-field-hint">
              {def.min}-{def.max}
            </span>
          </label>
        ))}
      </div>

      {result.ok ? (
        <>
          <p className="tool-summary">{text.describeCron(result.cron)}</p>
          {result.cron.macro && (
            <p className="tool-note">
              <code>{result.cron.macro}</code> {t.cron.expandsTo} <code>{result.cron.expression}</code>
            </p>
          )}
          {result.cron.dayOr && (
            <p className="tool-note">
              {t.cron.dayOr.before} <em>{t.cron.dayOr.either}</em> {t.cron.dayOr.after}
            </p>
          )}

          <h2 className="tool-heading">{t.cron.fieldByField}</h2>
          <ul className="tool-rows cron-breakdown">
            {FIELD_DEFS.map((def) => {
              const field = result.cron.fields[def.key];
              return (
                <li key={def.key}>
                  <code>{field.raw}</code>
                  <span className="cron-breakdown-label">{t.cron.fields[def.key]}</span>
                  <span className="cron-breakdown-value">{text.describeField(field)}</span>
                </li>
              );
            })}
          </ul>

          <h2 className="tool-heading">
            {t.cron.nextRuns} <span className="tool-heading-aside">{localTimeZone}</span>
          </h2>
          {runs.length > 0 ? (
            <ol className="tool-rows cron-runs">
              {runs.map((run) => (
                <li key={run.toISOString()}>{formatRun.format(run)}</li>
              ))}
            </ol>
          ) : (
            <p className="tool-note">{t.cron.neverFires}</p>
          )}
        </>
      ) : (
        <p className="tool-error" role="alert">
          {text.describeError(result.error)}
        </p>
      )}

      <h2 className="tool-heading">{t.cron.presetsHeading}</h2>
      <div className="tool-chips">
        {PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.expression}
            className="tool-chip"
            onClick={() => update(preset.expression)}
          >
            {t.cron.presets[preset.key]}
          </button>
        ))}
      </div>

      <h2 className="tool-heading">{t.cron.syntaxHeading}</h2>
      <dl className="cron-syntax">
        {Object.values(t.cron.syntax).map((entry) => (
          <div className="cron-syntax-row" key={entry.symbol}>
            <dt>
              <code>{entry.symbol}</code>
            </dt>
            <dd>
              {entry.meaning}
              <span className="cron-syntax-example">{entry.example}</span>
            </dd>
          </div>
        ))}
      </dl>

    </main>
  );
}
