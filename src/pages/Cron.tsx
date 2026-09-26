import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BackLink } from '../components/BackLink';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  FIELD_DEFS,
  describeCron,
  describeField,
  expandMacro,
  nextRuns,
  parseCron,
  splitFields,
} from '../lib/cron';
import { CopyButton } from '../components/CopyButton';

const DEFAULT_EXPRESSION = '*/5 9-17 * * MON-FRI';
const NEXT_RUNS_COUNT = 5;

const PRESETS: { label: string; expression: string }[] = [
  { label: 'Every minute', expression: '* * * * *' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { label: 'Hourly', expression: '0 * * * *' },
  { label: 'Daily at midnight', expression: '0 0 * * *' },
  { label: 'Weekdays at 09:00', expression: '0 9 * * MON-FRI' },
  { label: 'Every Monday', expression: '0 0 * * MON' },
  { label: '1st of the month', expression: '0 0 1 * *' },
  { label: 'Every quarter', expression: '0 0 1 */3 *' },
];

const SYNTAX: { symbol: string; meaning: string; example: string }[] = [
  { symbol: '*', meaning: 'any value', example: '* * * * * → every minute' },
  { symbol: ',', meaning: 'list of values', example: '0 9,18 * * * → at 09:00 and 18:00' },
  { symbol: '-', meaning: 'range of values', example: '0 9-17 * * * → hourly, 09:00–17:00' },
  { symbol: '/', meaning: 'step', example: '*/15 * * * * → every 15 minutes' },
  { symbol: 'names', meaning: 'JAN–DEC, SUN–SAT', example: '0 0 * * SUN → every Sunday' },
  { symbol: '@macros', meaning: '@hourly, @daily, @weekly, @monthly, @yearly', example: '@daily → 0 0 * * *' },
];

const runFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function Cron() {
  usePageMeta({ title: 'Cron Expression Tool — Igor Savin' });

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
        <BackLink to="/utils" label="Back to Utils" />
        Cron Expression Tool
      </h1>
      <p className="description">
        Paste a cron string to see what it means and when it runs next, or build one field by
        field. Everything happens in your browser — nothing is sent anywhere.
      </p>

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
          aria-label="Cron expression"
          aria-invalid={!result.ok}
          placeholder="* * * * *"
        />
        <CopyButton text={expression.trim()} label="Copy expression" />
      </div>

      <div className="cron-fields">
        {FIELD_DEFS.map((def, index) => (
          <label className="cron-field" key={def.key}>
            <span className="cron-field-label">{def.label}</span>
            <input
              className={`cron-field-input${errorField === def.key ? ' tool-invalid' : ''}`}
              value={tokens[index]}
              onChange={(event) => updateField(index, event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              enterKeyHint="done"
              aria-label={def.label}
            />
            <span className="cron-field-hint">
              {def.min}-{def.max}
            </span>
          </label>
        ))}
      </div>

      {result.ok ? (
        <>
          <p className="tool-summary">{describeCron(result.cron)}</p>
          {result.cron.macro && (
            <p className="tool-note">
              <code>{result.cron.macro}</code> expands to <code>{result.cron.expression}</code>
            </p>
          )}
          {result.cron.dayOr && (
            <p className="tool-note">
              Both day fields are restricted, so cron fires when <em>either</em> of them matches.
            </p>
          )}

          <h2 className="tool-heading">Field by field</h2>
          <ul className="tool-rows cron-breakdown">
            {FIELD_DEFS.map((def) => {
              const field = result.cron.fields[def.key];
              return (
                <li key={def.key}>
                  <code>{field.raw}</code>
                  <span className="cron-breakdown-label">{def.label}</span>
                  <span className="cron-breakdown-value">{describeField(field)}</span>
                </li>
              );
            })}
          </ul>

          <h2 className="tool-heading">
            Next runs <span className="tool-heading-aside">{localTimeZone}</span>
          </h2>
          {runs.length > 0 ? (
            <ol className="tool-rows cron-runs">
              {runs.map((run) => (
                <li key={run.toISOString()}>{runFormatter.format(run)}</li>
              ))}
            </ol>
          ) : (
            <p className="tool-note">
              This expression never fires — check the day-of-month and month combination.
            </p>
          )}
        </>
      ) : (
        <p className="tool-error" role="alert">
          {result.error.message}
        </p>
      )}

      <h2 className="tool-heading">Presets</h2>
      <div className="tool-chips">
        {PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.expression}
            className="tool-chip"
            onClick={() => update(preset.expression)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <h2 className="tool-heading">Syntax</h2>
      <dl className="cron-syntax">
        {SYNTAX.map((entry) => (
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
