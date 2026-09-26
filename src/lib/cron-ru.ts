/**
 * Russian wording for cron expressions: the same structure as the English
 * describers in `cron.ts`, with Russian grammar (cases and plural forms).
 */

import {
  describeAllowed,
  fieldDef,
  isContiguous,
  pad,
  stepOfWholeField,
  type CronError,
  type CronFieldKey,
  type FieldPart,
  type ParsedCron,
  type ParsedField,
} from './cron';

const MONTHS_NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_PREP = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];

const DAYS_NOM = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const DAYS_GEN = ['воскресенья', 'понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы'];
const DAYS_ACC = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
/** Dative plural, for recurring days: "по понедельникам". */
const DAYS_DAT = ['воскресеньям', 'понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам'];

export const FIELD_LABELS_RU: Record<CronFieldKey, string> = {
  minute: 'Минута',
  hour: 'Час',
  dayOfMonth: 'День месяца',
  month: 'Месяц',
  dayOfWeek: 'День недели',
};

interface Unit {
  /** Forms after a number: 1 минуту, 2 минуты, 5 минут. */
  one: string;
  few: string;
  many: string;
  /** "каждую" / "каждый" — agrees with the noun's gender. */
  each: string;
  /** Nominative used as a prefix in the breakdown: "минута 5", "минуты 0 и 30". */
  nomOne: string;
  nomMany: string;
}

const UNITS: Record<CronFieldKey, Unit> = {
  minute: { one: 'минуту', few: 'минуты', many: 'минут', each: 'каждую', nomOne: 'минута', nomMany: 'минуты' },
  hour: { one: 'час', few: 'часа', many: 'часов', each: 'каждый', nomOne: 'час', nomMany: 'часы' },
  dayOfMonth: { one: 'день', few: 'дня', many: 'дней', each: 'каждый', nomOne: 'день', nomMany: 'дни' },
  month: { one: 'месяц', few: 'месяца', many: 'месяцев', each: 'каждый', nomOne: 'месяц', nomMany: 'месяцы' },
  dayOfWeek: {
    one: 'день недели',
    few: 'дня недели',
    many: 'дней недели',
    each: 'каждый',
    nomOne: 'день недели',
    nomMany: 'дни недели',
  },
};

const pluralRules = new Intl.PluralRules('ru');

/** "каждую минуту", "каждые 5 минут", "каждый 21 час". */
function every(step: number, key: CronFieldKey): string {
  const unit = UNITS[key];
  if (step === 1) return `${unit.each} ${unit.one}`;
  const rule = pluralRules.select(step);
  const noun = rule === 'one' ? unit.one : rule === 'few' ? unit.few : unit.many;
  return `${rule === 'one' ? unit.each : 'каждые'} ${step} ${noun}`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} и ${items[items.length - 1]}`;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Value names in the case a phrase needs; numbers stay numbers. */
function name(key: CronFieldKey, value: number, form: 'nom' | 'gen' | 'acc' | 'prep' | 'dat'): string {
  if (key === 'month') {
    return (form === 'gen' ? MONTHS_GEN : form === 'prep' ? MONTHS_PREP : MONTHS_NOM)[value - 1];
  }
  if (key === 'dayOfWeek') {
    const names = { nom: DAYS_NOM, gen: DAYS_GEN, acc: DAYS_ACC, prep: DAYS_ACC, dat: DAYS_DAT };
    return names[form][value];
  }
  return String(value);
}

/** One comma-separated part of a field; `single` picks the case of lone values. */
function describePart(key: CronFieldKey, part: FieldPart, single: 'nom' | 'prep' | 'dat'): string {
  if (part.kind === 'single') return name(key, part.value, single);
  if (part.kind === 'all') return every(part.step, key);

  const range = `с ${name(key, part.from, 'gen')} по ${name(key, part.to, 'acc')}`;
  return part.step > 1 ? `${every(part.step, key)} ${range}` : range;
}

/** Describes a field on its own, e.g. "каждые 5 минут" or "январь и июль". */
export function describeFieldRu(field: ParsedField): string {
  const { def, parts, values } = field;

  if (field.isWildcard) return every(1, def.key);

  const wholeStep = stepOfWholeField(field);
  if (wholeStep !== undefined) return every(wholeStep, def.key);

  const list = joinList(parts.map((part) => describePart(def.key, part, 'nom')));

  // Month and weekday values are names already, and step phrases carry their own noun.
  const named = def.key === 'month' || def.key === 'dayOfWeek';
  const stepped = parts.some((part) => part.kind === 'all' || (part.kind === 'range' && part.step > 1));
  if (named || stepped) return list;

  const unit = UNITS[def.key];
  return `${values.length === 1 ? unit.nomOne : unit.nomMany} ${list}`;
}

/** "по понедельникам и средам", "с января по март", "в январе и июле". */
function describeDays(field: ParsedField): string {
  const single = field.def.key === 'dayOfWeek' ? 'dat' : 'prep';
  const list = joinList(field.parts.map((part) => describePart(field.def.key, part, single)));
  if (field.parts[0].kind !== 'single') return list;
  return `${single === 'dat' ? 'по' : 'в'} ${list}`;
}

function describeHourWindow(hour: ParsedField): string {
  if (hour.isWildcard) return '';

  const step = stepOfWholeField(hour);
  if (step !== undefined) return every(step, 'hour');

  if (hour.values.length > 1 && isContiguous(hour.values)) {
    const first = hour.values[0];
    const last = hour.values[hour.values.length - 1];
    return `с ${pad(first)}:00 до ${pad(last)}:59`;
  }

  return `в часы ${joinList(hour.values.map((value) => `${pad(value)}:00`))}`;
}

/** "на 5-й минуте" / "на минутах 0 и 30". */
function atMinutes(values: number[]): string {
  return values.length === 1 ? `на ${values[0]}-й минуте` : `на минутах ${joinList(values.map(String))}`;
}

function describeTime(cron: ParsedCron): string {
  const minute = cron.fields.minute;
  const hour = cron.fields.hour;
  const minuteStep = stepOfWholeField(minute);
  const window = describeHourWindow(hour);
  const withWindow = (text: string) => capitalize(hour.isWildcard ? text : `${text} ${window}`);

  if (minute.isWildcard) return withWindow(every(1, 'minute'));
  if (minuteStep !== undefined) return withWindow(every(minuteStep, 'minute'));

  if (hour.isWildcard) return capitalize(`${atMinutes(minute.values)} каждого часа`);

  // Few enough combinations to spell the clock times out in full.
  if (minute.values.length * hour.values.length <= 8) {
    const times = hour.values.flatMap((h) => minute.values.map((m) => `${pad(h)}:${pad(m)}`));
    return `В ${joinList(times.sort())}`;
  }

  return capitalize(`${atMinutes(minute.values)}, ${window}`);
}

/** Turns a parsed expression into one readable Russian sentence. */
export function describeCronRu(cron: ParsedCron): string {
  const { dayOfMonth, month, dayOfWeek } = cron.fields;
  const clauses = [describeTime(cron)];

  const dayClauses: string[] = [];
  if (!dayOfMonth.isWildcard) {
    const step = stepOfWholeField(dayOfMonth);
    if (step !== undefined) {
      dayClauses.push(`${every(step, 'dayOfMonth')} месяца`);
    } else if (dayOfMonth.values.length === 1 && dayOfMonth.parts[0].kind === 'single') {
      dayClauses.push(`${dayOfMonth.values[0]}-го числа`);
    } else {
      dayClauses.push(`в дни месяца ${joinList(dayOfMonth.parts.map((part) => describePart('dayOfMonth', part, 'nom')))}`);
    }
  }
  if (!dayOfWeek.isWildcard) {
    dayClauses.push(describeDays(dayOfWeek));
  }

  if (dayClauses.length > 0) {
    // Both day fields restricted → cron matches either of them.
    clauses.push(dayClauses.join(' или '));
  } else if (!cron.fields.hour.isWildcard) {
    // Only worth saying for crons that fire at specific times of day.
    clauses.push('каждый день');
  }

  if (!month.isWildcard) {
    const step = stepOfWholeField(month);
    clauses.push(step !== undefined ? every(step, 'month') : describeDays(month));
  }

  return `${clauses.join(', ')}.`;
}

/** The parse error as a Russian sentence. */
export function describeCronErrorRu(error: CronError): string {
  if (error.code === 'empty') return 'Введите cron-выражение, чтобы начать.';
  if (error.code === 'fieldCount') {
    return (
      `Нужно 5 полей (минута, час, день месяца, месяц, день недели), а указано ${error.count}. ` +
      'Поля секунд и года (как в Quartz) не поддерживаются.'
    );
  }

  const label = FIELD_LABELS_RU[error.field];
  const allowed = describeAllowed(fieldDef(error.field), 'или');
  switch (error.code) {
    case 'fieldEmpty':
      return `${label}: поле пустое.`;
    case 'multipleSteps':
      return `${label}: в «${error.token}» больше одного шага (/).`;
    case 'badStep':
      return `${label}: шаг в «${error.token}» должен быть числом ≥ 1.`;
    case 'outOfRange':
      return `${label}: «${error.token}» вне допустимого диапазона ${allowed}.`;
    case 'badRange':
      return `${label}: «${error.token}» — некорректный диапазон.`;
    case 'badValue':
      return `${label}: «${error.token}» здесь не подходит — ожидается ${allowed}.`;
  }
}
