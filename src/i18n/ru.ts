import type { Messages } from './en';

export const ru: Messages = {
  siteName: 'Igor Savin',
  pageTitle: (page: string) => `${page} — Igor Savin`,

  language: 'Язык',
  languageNames: { en: 'English', ru: 'Русский' },
  theme: 'Тема',
  themeModes: { auto: 'Как в системе', light: 'Светлая тема', dark: 'Тёмная тема' },

  copy: 'Копировать',
  copied: 'Скопировано',
  clear: 'Очистить',
  backToHome: 'На главную',
  backToUtils: 'К утилитам',
  logoAlt: (title: string) => `Логотип ${title}`,

  home: {
    title: 'Igor Savin — Software Engineer & Tech Lead',
    avatarAlt: 'Портрет Игоря Савина',
    description: 'Опыт в IT с 2009 года. Продолжение следует …',
    socialLinks: 'Соцсети',
    email: 'Почта',
    sections: 'Разделы сайта',
  },

  utils: {
    title: 'Утилиты',
    description: 'Полезные утилиты для личного и командного использования',
  },

  projects: {
    title: 'Пет-проекты',
    description:
      'В свободное время я с друзьями делаю сторонние проекты — чтобы разобраться в новых технологиях и решить интересные задачи. Вот над чем я работаю:',
  },

  cron: {
    title: 'Cron-выражения',
    description:
      'Вставьте cron-строку, чтобы узнать, что она означает и когда сработает, или соберите её по полям. Всё работает в браузере — никуда ничего не отправляется.',
    inputLabel: 'Cron-выражение',
    copyExpression: 'Скопировать выражение',
    fields: {
      minute: 'Минута',
      hour: 'Час',
      dayOfMonth: 'День месяца',
      month: 'Месяц',
      dayOfWeek: 'День недели',
    },
    expandsTo: 'раскрывается в',
    dayOr: {
      before: 'Заданы оба поля дней, поэтому cron срабатывает, когда совпадает',
      either: 'любое',
      after: 'из них.',
    },
    fieldByField: 'По полям',
    nextRuns: 'Ближайшие запуски',
    neverFires: 'Это выражение никогда не сработает — проверьте сочетание дня месяца и месяца.',
    presetsHeading: 'Шаблоны',
    presets: {
      everyMinute: 'Каждую минуту',
      every5Minutes: 'Каждые 5 минут',
      hourly: 'Каждый час',
      dailyMidnight: 'Каждый день в полночь',
      weekdays9: 'По будням в 09:00',
      everyMonday: 'Каждый понедельник',
      firstOfMonth: '1-го числа месяца',
      everyQuarter: 'Раз в квартал',
    },
    syntaxHeading: 'Синтаксис',
    syntax: {
      any: { symbol: '*', meaning: 'любое значение', example: '* * * * * → каждую минуту' },
      list: { symbol: ',', meaning: 'список значений', example: '0 9,18 * * * → в 09:00 и 18:00' },
      range: { symbol: '-', meaning: 'диапазон значений', example: '0 9-17 * * * → каждый час, 09:00–17:00' },
      step: { symbol: '/', meaning: 'шаг', example: '*/15 * * * * → каждые 15 минут' },
      names: { symbol: 'names', meaning: 'JAN–DEC, SUN–SAT', example: '0 0 * * SUN → каждое воскресенье' },
      macros: {
        symbol: '@macros',
        meaning: '@hourly, @daily, @weekly, @monthly, @yearly',
        example: '@daily → 0 0 * * *',
      },
    },
  },

  jwt: {
    title: 'Декодер JWT',
    description:
      'Вставьте JSON Web Token, чтобы увидеть его header, payload и claims и проверить HMAC-подпись. Всё работает в браузере — никуда ничего не отправляется.',
    inputLabel: 'Закодированный токен',
    sampleToken: 'Пример токена',
    expiry: {
      valid: 'Не истёк',
      expired: 'Истёк',
      'not-yet-valid': 'Ещё не действует',
      unknown: 'Без срока',
    },
    becomesValid: (when: string) => `Начнёт действовать ${when}`,
    expiredWhen: (when: string) => `Истёк ${when}`,
    expires: (when: string) => `Истекает ${when}`,
    noExp: 'В токене нет claim exp',
    parts: { header: 'Header', payload: 'Payload', signature: 'Signature' },
    copyPart: (part: string) => `Скопировать ${part.toLowerCase()}`,
    empty: '(пусто)',
    registeredClaims: 'Зарегистрированные claims',
    claims: {
      iss: 'Издатель',
      sub: 'Субъект',
      aud: 'Аудитория',
      exp: 'Истекает',
      nbf: 'Действует с',
      iat: 'Выпущен',
      jti: 'ID токена',
    },
    errors: {
      empty: 'Вставьте токен, чтобы декодировать его',
      parts: (count: number) => `В JWT 3 части через точку, а в этом токене — ${count}`,
      base64: (part: string) => `${part} — некорректный base64url`,
      notObject: (part: string) => `${part} — не JSON-объект`,
      notJson: (part: string) => `${part} — некорректный JSON`,
      unknown: 'Не удалось декодировать токен',
    },
    unsupportedAlg: {
      before: 'Для проверки',
      middle: 'нужен публичный ключ, это пока не поддерживается — здесь можно проверить только HMAC-подписи',
      after: '.',
    },
    secretLabel: 'HMAC-секрет',
    secretPlaceholder: (alg: string) => `Секрет ${alg}`,
    verify: 'Проверить',
    verified: 'Подпись верна ✓',
    mismatch: 'Подпись не совпадает с этим секретом',
    malformed: 'Токен повреждён',
    verifyFailed: 'Не удалось проверить подпись',
  },

  snowflake: {
    title: 'Декодер Snowflake ID',
    description:
      'Разбирает Snowflake ID на timestamp, node и counter. Настройте раскладку битов под свой генератор. Всё работает в браузере.',
    placeholder: 'Snowflake ID, например 4038663563538082816',
    save: 'Сохранить',
    saveToHistory: 'Сохранить в историю',
    sampleId: 'Пример ID',
    invalid: 'Некорректный ID — введите целое число не больше 9223372036854775807 (Long.MAX_VALUE).',
    components: 'Составные части',
    timestampHint: (range: string) => `секунды · переполнится через ~${range}`,
    perSecond: 'в секунду',
    layoutNote: {
      before: 'Всего 64 бита: знаковый бит всегда',
      after: ', timestamp получает то, что осталось после node и counter.',
    },
    formula: 'Формула генерации',
    copyFormula: 'Скопировать формулу',
    history: 'История',
    lastN: (count: number) => `последние ${count}`,
    clearAll: 'Очистить всё',
    decode: (id: string) => `Декодировать ${id}`,
    remove: (id: string) => `Удалить ${id} из истории`,
    bits: { one: 'бит', few: 'бита', many: 'бит' },
    fewerBits: (label: string) => `Меньше битов для ${label}`,
    moreBits: (label: string) => `Больше битов для ${label}`,
  },

  data: {
    tennis: {
      title: 'Теннисная платформа',
      description: 'Упрощает подсчёт очков на теннисных турнирах для профессиональных судей',
    },
    shelfly: {
      description:
        'Отмечайте прогресс чтения, собирайте полку своих книг и не теряйте мотивацию дочитывать начатое',
    },
    cobee: {
      description: 'Приложение, которое объединяет малый бизнес и его клиентов в одном удобном месте',
    },
    jwt: {
      title: 'Декодер JWT',
      description: 'Декодирует и проверяет JSON Web Token прямо в браузере — ничего не покидает страницу',
    },
    cron: {
      title: 'Cron-выражения',
      description:
        'Объясняет любую cron-строку простыми словами, показывает ближайшие запуски и помогает собрать свою по полям',
    },
    snowflake: {
      title: 'Декодер Snowflake ID',
      description: 'Разбирает Snowflake ID на timestamp, node и counter — с настраиваемой раскладкой битов',
    },
  },
};
