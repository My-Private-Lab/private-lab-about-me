import type { Lang } from '.';

export type PluralForms = Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many' | 'other', string>>;

/** Picks a plural form: `plural('ru', 5, { one: 'бит', few: 'бита', many: 'бит' })` → "бит". */
export function plural(lang: Lang, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(lang).select(count) as keyof PluralForms;
  return forms[rule] ?? forms.many ?? forms.other ?? '';
}
