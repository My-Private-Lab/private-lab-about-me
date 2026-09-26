import type { Messages } from '../i18n/en';

export interface ProjectItem {
  /** Key of the item's title/description in the `data` section of the UI strings. */
  id: keyof Messages['data'];
  /** Brand name — used when the strings don't translate the title. */
  title?: string;
  /** Optional logo shown to the left of the content. */
  logo?: string;
  href: string;
  /** Visible link text (usually the bare domain). */
  linkLabel: string;
  /** Set for pages of this site — rendered as a client-side route, not an external link. */
  internal?: boolean;
}

// Pet-projects — built in free time to explore tech and solve fun problems.
export const petProjects: ProjectItem[] = [
  {
    id: 'tennis',
    logo: '/logo-courtcount.png',
    href: 'https://courtcount.ru',
    linkLabel: 'courtcount.ru',
  },
  {
    id: 'shelfly',
    title: 'Shelfly',
    logo: '/logo-shelfly.svg',
    href: 'https://shelfly.ru',
    linkLabel: 'shelfly.ru',
  },
  {
    id: 'cobee',
    title: 'Cobee',
    logo: '/logo-cobee.svg',
    href: 'https://cobee.ru',
    linkLabel: 'cobee.ru',
  },
];

// Utils — small tools for personal and team use.
export const utils: ProjectItem[] = [
  {
    id: 'jwt',
    href: '/utils/jwt',
    linkLabel: 'isavin.dev/utils/jwt',
    internal: true,
  },
  {
    id: 'cron',
    href: '/utils/cron',
    linkLabel: 'isavin.dev/utils/cron',
    internal: true,
  },
  {
    id: 'snowflake',
    href: '/utils/snowflake',
    linkLabel: 'isavin.dev/utils/snowflake',
    internal: true,
  },
];
