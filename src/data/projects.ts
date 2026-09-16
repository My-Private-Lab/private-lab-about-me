export interface ProjectItem {
  title: string;
  /** Optional logo shown to the left of the content. */
  logo?: string;
  href: string;
  /** Visible link text (usually the bare domain). */
  linkLabel: string;
  /** Set for pages of this site — rendered as a client-side route, not an external link. */
  internal?: boolean;
  description: string;
}

// Pet-projects — built in free time to explore tech and solve fun problems.
export const petProjects: ProjectItem[] = [
  {
    title: 'Tennis platform',
    logo: '/logo-courtcount.png',
    href: 'https://courtcount.ru',
    linkLabel: 'courtcount.ru',
    description: 'Simplifying tennis tournament scoring for professional referees',
  },
  {
    title: 'Shelfly',
    logo: '/logo-shelfly.svg',
    href: 'https://shelfly.ru',
    linkLabel: 'shelfly.ru',
    description:
      'Track your reading progress, keep a shelf of your books, and stay motivated to finish what you start',
  },
  {
    title: 'Cobee',
    logo: '/logo-cobee.svg',
    href: 'https://cobee.ru',
    linkLabel: 'cobee.ru',
    description:
      'An app that brings small businesses and their customers together in one convenient place',
  },
];

// Utils — small tools for personal and team use.
export const utils: ProjectItem[] = [
  {
    title: 'JWT Decoder',
    href: 'https://jwt-decoder.isavin.dev/',
    linkLabel: 'jwt-decoder.isavin.dev',
    description:
      'Decode & verify JSON Web Tokens right in your browser — nothing leaves the page',
  },
  {
    title: 'Cron Expression Tool',
    href: '/utils/cron',
    linkLabel: 'isavin.dev/utils/cron',
    internal: true,
    description:
      'Explain any cron string in plain English, see its next runs, and build your own field by field',
  },
  {
    title: 'Snowflake ID Decoder',
    href: 'https://snowflake-decoder.isavin.dev/',
    linkLabel: 'snowflake-decoder.isavin.dev',
    description: 'Decode snowflake ID like a PRO',
  },
];
