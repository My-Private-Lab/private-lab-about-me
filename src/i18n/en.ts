// UI strings. `ru.ts` mirrors this shape (the `Messages` type keeps them in sync).
// Established tech terms (JWT, cron, Snowflake ID, claims, payload…) and the
// roles in the home-page ticker stay in English in both languages.

import type { PluralForms } from './plural';

export const en = {
  siteName: 'Igor Savin',
  pageTitle: (page: string) => `${page} — Igor Savin`,

  language: 'Language',
  languageNames: { en: 'English', ru: 'Русский' },
  theme: 'Theme',
  themeModes: { auto: 'System theme', light: 'Light theme', dark: 'Dark theme' },

  copy: 'Copy',
  copied: 'Copied',
  clear: 'Clear',
  backToHome: 'Back to Home',
  backToUtils: 'Back to Utils',
  logoAlt: (title: string) => `${title} logo`,

  home: {
    title: 'Igor Savin — Software Engineer & Tech Lead',
    avatarAlt: 'Portrait of Igor Savin',
    description: 'Experience in IT since 2009. To be continued …',
    socialLinks: 'Social links',
    email: 'Email',
    sections: 'Site sections',
  },

  utils: {
    title: 'Utils',
    description: 'Useful utils designed for personal and team use',
  },

  projects: {
    title: 'Pet-projects',
    description:
      "In my free time, I enjoy working on side projects with my friends to explore new technologies and solve interesting problems. Here are a couple of projects I've been working on:",
  },

  cron: {
    title: 'Cron Expression Tool',
    description:
      'Paste a cron string to see what it means and when it runs next, or build one field by field. Everything happens in your browser — nothing is sent anywhere.',
    inputLabel: 'Cron expression',
    copyExpression: 'Copy expression',
    fields: {
      minute: 'Minute',
      hour: 'Hour',
      dayOfMonth: 'Day of month',
      month: 'Month',
      dayOfWeek: 'Day of week',
    },
    expandsTo: 'expands to',
    // Rendered as: before <em>either</em> after.
    dayOr: {
      before: 'Both day fields are restricted, so cron fires when',
      either: 'either',
      after: 'of them matches.',
    },
    fieldByField: 'Field by field',
    nextRuns: 'Next runs',
    neverFires: 'This expression never fires — check the day-of-month and month combination.',
    presetsHeading: 'Presets',
    presets: {
      everyMinute: 'Every minute',
      every5Minutes: 'Every 5 minutes',
      hourly: 'Hourly',
      dailyMidnight: 'Daily at midnight',
      weekdays9: 'Weekdays at 09:00',
      everyMonday: 'Every Monday',
      firstOfMonth: '1st of the month',
      everyQuarter: 'Every quarter',
    },
    syntaxHeading: 'Syntax',
    syntax: {
      any: { symbol: '*', meaning: 'any value', example: '* * * * * → every minute' },
      list: { symbol: ',', meaning: 'list of values', example: '0 9,18 * * * → at 09:00 and 18:00' },
      range: { symbol: '-', meaning: 'range of values', example: '0 9-17 * * * → hourly, 09:00–17:00' },
      step: { symbol: '/', meaning: 'step', example: '*/15 * * * * → every 15 minutes' },
      names: { symbol: 'names', meaning: 'JAN–DEC, SUN–SAT', example: '0 0 * * SUN → every Sunday' },
      macros: {
        symbol: '@macros',
        meaning: '@hourly, @daily, @weekly, @monthly, @yearly',
        example: '@daily → 0 0 * * *',
      },
    },
  },

  jwt: {
    title: 'JWT Decoder',
    description:
      'Paste a JSON Web Token to see its header, payload and claims, and verify an HMAC signature. Everything happens in your browser — nothing is sent anywhere.',
    inputLabel: 'Encoded token',
    sampleToken: 'Sample token',
    expiry: {
      valid: 'Not expired',
      expired: 'Expired',
      'not-yet-valid': 'Not yet valid',
      unknown: 'No expiry',
    },
    becomesValid: (when: string) => `Becomes valid ${when}`,
    expiredWhen: (when: string) => `Expired ${when}`,
    expires: (when: string) => `Expires ${when}`,
    noExp: 'The token has no exp claim',
    parts: { header: 'Header', payload: 'Payload', signature: 'Signature' },
    copyPart: (part: string) => `Copy ${part.toLowerCase()}`,
    empty: '(empty)',
    registeredClaims: 'Registered claims',
    claims: {
      iss: 'Issuer',
      sub: 'Subject',
      aud: 'Audience',
      exp: 'Expiration time',
      nbf: 'Not before',
      iat: 'Issued at',
      jti: 'JWT ID',
    },
    errors: {
      empty: 'Paste a token to decode',
      parts: (count: number) => `A JWT has 3 dot-separated parts, this one has ${count}`,
      base64: (part: string) => `${part} is not valid base64url`,
      notObject: (part: string) => `${part} is not a JSON object`,
      notJson: (part: string) => `${part} is not valid JSON`,
      unknown: 'Failed to decode the token',
    },
    // Rendered as: before <code>alg</code> middle (<code>HS256</code>, …)after.
    unsupportedAlg: {
      before: 'Verifying',
      middle: 'needs a public key and isn’t supported yet — only HMAC signatures',
      after: ' can be checked here.',
    },
    secretLabel: 'HMAC secret',
    secretPlaceholder: (alg: string) => `${alg} secret`,
    verify: 'Verify',
    verified: 'Signature verified ✓',
    mismatch: 'Signature doesn’t match this secret',
    malformed: 'Token is malformed',
    verifyFailed: 'Verification failed',
  },

  snowflake: {
    title: 'Snowflake ID Decoder',
    description:
      'Split a Snowflake ID into its timestamp, node and counter. Adjust the bit layout to match your generator. Everything happens in your browser.',
    placeholder: 'Snowflake ID, e.g. 4038663563538082816',
    save: 'Save',
    saveToHistory: 'Save to history',
    sampleId: 'Sample ID',
    invalid: 'Not a valid ID — enter a whole number up to 9223372036854775807 (Long.MAX_VALUE).',
    components: 'Components',
    timestampHint: (range: string) => `seconds · wraps after ~${range}`,
    perSecond: 'per second',
    // Rendered as: before <code>0</code>after.
    layoutNote: {
      before: '64 bits in total: the sign bit is always',
      after: ', the timestamp gets what the node and counter leave.',
    },
    formula: 'Generation formula',
    copyFormula: 'Copy formula',
    history: 'History',
    lastN: (count: number) => `last ${count}`,
    clearAll: 'Clear all',
    decode: (id: string) => `Decode ${id}`,
    remove: (id: string) => `Remove ${id} from history`,
    bits: { one: 'bit', other: 'bits' } as PluralForms,
    fewerBits: (label: string) => `Fewer ${label} bits`,
    moreBits: (label: string) => `More ${label} bits`,
  },

  data: {
    tennis: {
      title: 'Tennis platform',
      description: 'Simplifying tennis tournament scoring for professional referees',
    },
    shelfly: {
      description:
        'Track your reading progress, keep a shelf of your books, and stay motivated to finish what you start',
    },
    cobee: {
      description:
        'An app that brings small businesses and their customers together in one convenient place',
    },
    jwt: {
      title: 'JWT Decoder',
      description: 'Decode & verify JSON Web Tokens right in your browser — nothing leaves the page',
    },
    cron: {
      title: 'Cron Expression Tool',
      description:
        'Explain any cron string in plain English, see its next runs, and build your own field by field',
    },
    snowflake: {
      title: 'Snowflake ID Decoder',
      description:
        'Split a Snowflake ID into timestamp, node and counter — with an adjustable bit layout',
    },
  },
};

export type Messages = typeof en;
