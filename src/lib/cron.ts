/**
 * A dependency-free parser, describer and scheduler for standard 5-field cron
 * expressions (Vixie/crontab flavour):
 *
 *   ┌───── minute (0-59)
 *   │ ┌─── hour (0-23)
 *   │ │ ┌─ day of month (1-31)
 *   │ │ │ ┌─ month (1-12 or JAN-DEC)
 *   │ │ │ │ ┌─ day of week (0-7 or SUN-SAT, 0 and 7 are Sunday)
 *   * * * * *
 *
 * Supported syntax per field: `*`, `?` (same as `*`), single values, lists
 * (`a,b`), ranges (`a-b`, wrapping like `FRI-MON`) and steps (a `/n` suffix on
 * any of those). The usual `@hourly`-style macros are expanded before parsing.
 */

export type CronFieldKey = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

export interface FieldDef {
  key: CronFieldKey;
  /** Human label used in the UI and in error messages. */
  label: string;
  /** Noun used in descriptions, e.g. "every <unit>". */
  unit: string;
  unitPlural: string;
  min: number;
  max: number;
  /** Textual aliases (JAN, MON, …) accepted in place of numbers. */
  aliases?: Record<string, number>;
  /** Renders a single value for descriptions (e.g. 1 → "January"). */
  name: (value: number) => string;
}

/** Part of a field as it was written — kept so descriptions can stay faithful. */
export type FieldPart =
  | { kind: 'all'; step: number }
  | { kind: 'single'; value: number }
  | { kind: 'range'; from: number; to: number; step: number };

export interface ParsedField {
  def: FieldDef;
  raw: string;
  /** Every value the field matches, sorted ascending. */
  values: number[];
  /** True when the field was `*` or `?` (no restriction at all). */
  isWildcard: boolean;
  parts: FieldPart[];
}

export interface ParsedCron {
  /** The expression that was parsed (macros already expanded). */
  expression: string;
  /** The original input, when a macro was used. */
  macro?: string;
  fields: Record<CronFieldKey, ParsedField>;
  /**
   * Standard cron quirk: when both day-of-month and day-of-week are
   * restricted, a day matches if *either* of them matches.
   */
  dayOr: boolean;
}

export interface CronError {
  message: string;
  /** Which field the error belongs to, when it can be attributed to one. */
  field?: CronFieldKey;
}

export type CronParseResult = { ok: true; cron: ParsedCron } | { ok: false; error: CronError };

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTH_ALIASES: Record<string, number> = Object.fromEntries(
  MONTH_NAMES.map((name, index) => [name.slice(0, 3).toUpperCase(), index + 1]),
);

const DAY_ALIASES: Record<string, number> = Object.fromEntries(
  DAY_NAMES.map((name, index) => [name.slice(0, 3).toUpperCase(), index]),
);

export const FIELD_DEFS: FieldDef[] = [
  { key: 'minute', label: 'Minute', unit: 'minute', unitPlural: 'minutes', min: 0, max: 59, name: (v) => String(v) },
  { key: 'hour', label: 'Hour', unit: 'hour', unitPlural: 'hours', min: 0, max: 23, name: (v) => String(v) },
  {
    key: 'dayOfMonth',
    label: 'Day of month',
    unit: 'day',
    unitPlural: 'days',
    min: 1,
    max: 31,
    name: (v) => String(v),
  },
  {
    key: 'month',
    label: 'Month',
    unit: 'month',
    unitPlural: 'months',
    min: 1,
    max: 12,
    aliases: MONTH_ALIASES,
    name: (v) => MONTH_NAMES[v - 1],
  },
  {
    key: 'dayOfWeek',
    label: 'Day of week',
    unit: 'day of the week',
    unitPlural: 'days of the week',
    min: 0,
    max: 6,
    aliases: DAY_ALIASES,
    name: (v) => DAY_NAMES[v],
  },
];

/** Shorthands accepted in place of a full expression. */
export const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

/* ===========================================================
   Parsing
   =========================================================== */

/** Expands `@daily` & friends; returns the input unchanged otherwise. */
export function expandMacro(expression: string): string | undefined {
  return MACROS[expression.trim().toLowerCase()];
}

function parseValue(token: string, def: FieldDef): number | undefined {
  const alias = def.aliases?.[token.toUpperCase()];
  if (alias !== undefined) return alias;

  if (!/^\d+$/.test(token)) return undefined;

  const value = Number(token);
  // Both 0 and 7 mean Sunday in the day-of-week field.
  if (def.key === 'dayOfWeek' && value === 7) return 0;

  return value >= def.min && value <= def.max ? value : undefined;
}

function expandRange(from: number, to: number, step: number, def: FieldDef): number[] {
  const values: number[] = [];

  // `FRI-MON` (and `11-2` for months) wraps around the end of the field.
  const span = from <= to ? to - from : def.max - def.min + 1 - (from - to);
  for (let offset = 0; offset <= span; offset += step) {
    values.push(def.min + ((from - def.min + offset) % (def.max - def.min + 1)));
  }

  return values;
}

function parseField(raw: string, def: FieldDef): ParsedField | CronError {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { field: def.key, message: `${def.label} is empty.` };
  }

  const values = new Set<number>();
  const parts: FieldPart[] = [];

  for (const item of trimmed.split(',')) {
    const [base, stepToken, ...rest] = item.split('/');

    if (rest.length > 0) {
      return { field: def.key, message: `${def.label}: "${item}" has more than one step (/).` };
    }

    let step = 1;
    if (stepToken !== undefined) {
      if (!/^\d+$/.test(stepToken) || Number(stepToken) < 1) {
        return { field: def.key, message: `${def.label}: step in "${item}" must be a number ≥ 1.` };
      }
      step = Number(stepToken);
    }

    if (base === '*' || base === '?') {
      for (let v = def.min; v <= def.max; v += step) values.add(v);
      parts.push({ kind: 'all', step });
      continue;
    }

    const rangeMatch = base.split('-');
    if (rangeMatch.length === 2) {
      const from = parseValue(rangeMatch[0], def);
      const to = parseValue(rangeMatch[1], def);

      if (from === undefined || to === undefined) {
        return {
          field: def.key,
          message: `${def.label}: "${base}" is out of the allowed range ${describeAllowed(def)}.`,
        };
      }

      for (const v of expandRange(from, to, step, def)) values.add(v);
      parts.push({ kind: 'range', from, to, step });
      continue;
    }

    if (rangeMatch.length > 2) {
      return { field: def.key, message: `${def.label}: "${base}" is not a valid range.` };
    }

    const single = parseValue(base, def);
    if (single === undefined) {
      return {
        field: def.key,
        message: `${def.label}: "${base}" is not valid here — expected ${describeAllowed(def)}.`,
      };
    }

    if (step > 1) {
      // `5/10` is shorthand for `5-<max>/10`.
      for (const v of expandRange(single, def.max, step, def)) values.add(v);
      parts.push({ kind: 'range', from: single, to: def.max, step });
    } else {
      values.add(single);
      parts.push({ kind: 'single', value: single });
    }
  }

  const isWildcard =
    parts.length === 1 && parts[0].kind === 'all' && parts[0].step === 1;

  return {
    def,
    raw: trimmed,
    values: [...values].sort((a, b) => a - b),
    isWildcard,
    parts,
  };
}

function describeAllowed(def: FieldDef): string {
  const aliases = def.aliases ? ` or ${Object.keys(def.aliases).slice(0, 3).join('/')}…` : '';
  return `${def.min}-${def.max}${aliases}`;
}

function isCronError(value: ParsedField | CronError): value is CronError {
  return 'message' in value;
}

/** Splits an expression into its fields, collapsing repeated whitespace. */
export function splitFields(expression: string): string[] {
  const trimmed = expression.trim();
  return trimmed === '' ? [] : trimmed.split(/\s+/);
}

export function parseCron(expression: string): CronParseResult {
  const macroExpansion = expandMacro(expression);
  const source = macroExpansion ?? expression;
  const tokens = splitFields(source);

  if (tokens.length === 0) {
    return { ok: false, error: { message: 'Enter a cron expression to get started.' } };
  }

  if (tokens.length !== FIELD_DEFS.length) {
    return {
      ok: false,
      error: {
        message:
          `Expected 5 fields (minute hour day-of-month month day-of-week), got ${tokens.length}. ` +
          'Seconds and year fields (Quartz style) are not supported.',
      },
    };
  }

  const fields = {} as Record<CronFieldKey, ParsedField>;

  for (const [index, def] of FIELD_DEFS.entries()) {
    const parsed = parseField(tokens[index], def);
    if (isCronError(parsed)) return { ok: false, error: parsed };
    fields[def.key] = parsed;
  }

  return {
    ok: true,
    cron: {
      expression: tokens.join(' '),
      macro: macroExpansion ? expression.trim().toLowerCase() : undefined,
      fields,
      dayOr: !fields.dayOfMonth.isWildcard && !fields.dayOfWeek.isWildcard,
    },
  };
}

/* ===========================================================
   Descriptions
   =========================================================== */

const pad = (value: number) => String(value).padStart(2, '0');

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Step applied to the whole field with a wildcard base, as in every-15-minutes. */
function stepOfWholeField(field: ParsedField): number | undefined {
  const [part] = field.parts;
  if (field.parts.length === 1 && part.kind === 'all' && part.step > 1) return part.step;
  return undefined;
}

function isContiguous(values: number[]): boolean {
  return values.every((value, index) => index === 0 || value === values[index - 1] + 1);
}

/** Describes a field on its own, e.g. "every 5 minutes" or "January and July". */
export function describeField(field: ParsedField): string {
  const { def, parts, values } = field;

  if (field.isWildcard) return `every ${def.unit}`;

  const wholeStep = stepOfWholeField(field);
  if (wholeStep !== undefined) return `every ${wholeStep} ${def.unitPlural}`;

  const phrases = parts.map((part) => {
    if (part.kind === 'single') return def.name(part.value);
    if (part.kind === 'all') return `every ${def.unit}`;

    const range = `${def.name(part.from)} through ${def.name(part.to)}`;
    return part.step > 1 ? `every ${part.step} from ${range}` : range;
  });

  // Month and weekday values are names already — they read fine without a noun.
  if (def.key === 'month' || def.key === 'dayOfWeek') return joinList(phrases);

  return `${values.length === 1 ? def.unit : def.unitPlural} ${joinList(phrases)}`;
}

function describeHourWindow(hour: ParsedField): string {
  if (hour.isWildcard) return '';

  const step = stepOfWholeField(hour);
  if (step !== undefined) return `every ${step} hours`;

  if (hour.values.length > 1 && isContiguous(hour.values)) {
    const first = hour.values[0];
    const last = hour.values[hour.values.length - 1];
    return `between ${pad(first)}:00 and ${pad(last)}:59`;
  }

  const hours = hour.values.map((value) => `${pad(value)}:00`);
  return `during ${joinList(hours)}`;
}

function describeTime(cron: ParsedCron): string {
  const minute = cron.fields.minute;
  const hour = cron.fields.hour;
  const minuteStep = stepOfWholeField(minute);
  const window = describeHourWindow(hour);

  if (minute.isWildcard) {
    return hour.isWildcard ? 'Every minute' : `Every minute ${window}`;
  }

  if (minuteStep !== undefined) {
    return hour.isWildcard ? `Every ${minuteStep} minutes` : `Every ${minuteStep} minutes ${window}`;
  }

  if (hour.isWildcard) {
    const minutes = joinList(minute.values.map(String));
    return minute.values.length === 1
      ? `At minute ${minutes} of every hour`
      : `At minutes ${minutes} of every hour`;
  }

  // Few enough combinations to spell the clock times out in full.
  if (minute.values.length * hour.values.length <= 8) {
    const times = hour.values.flatMap((h) => minute.values.map((m) => `${pad(h)}:${pad(m)}`));
    return `At ${joinList(times.sort())}`;
  }

  const minutes = joinList(minute.values.map(String));
  return `At ${minute.values.length === 1 ? 'minute' : 'minutes'} ${minutes}, ${window}`;
}

/** Turns a parsed expression into one readable English sentence. */
export function describeCron(cron: ParsedCron): string {
  const { dayOfMonth, month, dayOfWeek } = cron.fields;
  const clauses = [describeTime(cron)];

  const dayClauses: string[] = [];
  if (!dayOfMonth.isWildcard) {
    const step = stepOfWholeField(dayOfMonth);
    dayClauses.push(
      step !== undefined
        ? `every ${step} days of the month`
        : `on ${describeField(dayOfMonth)} of the month`,
    );
  }
  if (!dayOfWeek.isWildcard) {
    dayClauses.push(`on ${describeField(dayOfWeek)}`);
  }

  if (dayClauses.length > 0) {
    // Both day fields restricted → cron matches either of them.
    clauses.push(dayClauses.join(' or '));
  } else if (!cron.fields.hour.isWildcard) {
    // Only worth saying for crons that fire at specific times of day.
    clauses.push('every day');
  }

  if (!month.isWildcard) {
    const step = stepOfWholeField(month);
    clauses.push(step !== undefined ? `every ${step} months` : `in ${describeField(month)}`);
  }

  return `${clauses.join(', ')}.`;
}

/* ===========================================================
   Upcoming runs
   =========================================================== */

/** How far ahead `nextRuns` is willing to look before giving up. */
const SEARCH_YEARS = 5;

function matchesDay(cron: ParsedCron, date: Date): boolean {
  const { dayOfMonth, dayOfWeek } = cron.fields;
  const domMatch = dayOfMonth.values.includes(date.getDate());
  const dowMatch = dayOfWeek.values.includes(date.getDay());

  return cron.dayOr ? domMatch || dowMatch : domMatch && dowMatch;
}

/**
 * The next `count` times the expression fires after `from`, in local time.
 * Returns fewer entries (possibly none) for expressions that can never match,
 * such as `0 0 30 2 *` — February never has a 30th.
 */
export function nextRuns(cron: ParsedCron, from: Date, count: number): Date[] {
  const runs: Date[] = [];

  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const limit = new Date(cursor);
  limit.setFullYear(limit.getFullYear() + SEARCH_YEARS);

  while (runs.length < count && cursor.getTime() < limit.getTime()) {
    if (!cron.fields.month.values.includes(cursor.getMonth() + 1)) {
      cursor.setMonth(cursor.getMonth() + 1, 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    if (!matchesDay(cron, cursor)) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    if (!cron.fields.hour.values.includes(cursor.getHours())) {
      cursor.setHours(cursor.getHours() + 1, 0, 0, 0);
      continue;
    }

    if (!cron.fields.minute.values.includes(cursor.getMinutes())) {
      cursor.setMinutes(cursor.getMinutes() + 1);
      continue;
    }

    runs.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return runs;
}
