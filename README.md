# private-lab-about-me

Personal landing page for **Igor Savin** — Software Engineer & Tech Lead.
Live at [isavin.dev](https://isavin.dev).

Rewritten from a static HTML/CSS/JS site to **React 18 + Vite + TypeScript**,
keeping the original look & feel pixel-for-pixel.

## Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vite.dev/)
- [React Router 6](https://reactrouter.com/) (client-side routing)
- TypeScript

## Pages

| Route         | Page                 | Legacy URL      |
| ------------- | -------------------- | --------------- |
| `/`           | Home                 | `index.html`    |
| `/projects`   | Pet-projects         | `projects.html` |
| `/utils`      | Utils                | `utils.html`    |
| `/utils/cron` | Cron Expression Tool | —               |
| `/utils/jwt`  | JWT Decoder          | —               |
| `/utils/snowflake` | Snowflake ID Decoder | —          |

`/utils/cron` is a self-contained cron helper: it explains an expression in
plain English, breaks it down field by field, lists the next runs in the
visitor's time zone, and lets you build a string from per-field inputs or
presets. The current expression lives in the `?expr=` query parameter, so a
link can be shared. Parsing, describing and scheduling live in
`src/lib/cron.ts` with no runtime dependencies.

`/utils/jwt` decodes a JSON Web Token — header, payload, registered claims
with local dates and expiry state — and verifies HS256/384/512 signatures via
the Web Crypto API. The token is deliberately kept out of the URL, since it is
a credential. Decoding and verification live in `src/lib/jwt.ts`. (Previously
a separate app at `jwt-decoder.isavin.dev`.)

`/utils/snowflake` splits a Snowflake ID (as produced by
`diva-lib-snowflake-id-generator`) into timestamp, node id and counter, shows
the ID in binary coloured by part, and lets you adjust the node/counter bit
widths. The ID lives in `?id=`; the bit layout and the last five saved IDs are
kept in `localStorage`. Decoding lives in `src/lib/snowflake.ts`. (Previously a
separate app at `snowflake-decoder.isavin.dev`.)

Tool pages share one set of building blocks: the `tool-*` classes in
`src/index.css` (inputs, buttons, chips, headings, callouts, rows, code
blocks) and components such as `CopyButton` and `BackLink`. New utils should
reuse them rather than add their own look.

Every page has a theme switch in the top-right corner: system / light / dark.
The default follows the OS; an explicit choice is kept in `localStorage`
(`theme`). An inline script in `index.html` applies the theme before first
paint, and `src/hooks/useTheme.ts` keeps it in sync afterwards. Colours are
tokens on `:root` in `src/index.css`, overridden under
`:root[data-theme='light']` — new styles should use the tokens, not raw
colours.

Next to it is a language switch: English / Russian. The default follows the
browser (the first of `navigator.languages` that is `en` or `ru`, else English);
an explicit choice is kept in `localStorage` (`lang`). UI strings live in
`src/i18n/en.ts` and `src/i18n/ru.ts` (same shape, enforced by the `Messages`
type); components read them with `useLang()`. Established tech terms (JWT, cron,
Snowflake ID, payload, claims…) and the roles in the home-page ticker stay in
English in both languages. Cron descriptions in Russian live in
`src/lib/cron-ru.ts`; the libs return error codes rather than English text, so
each language words them itself.

The old `*.html` URLs redirect to their clean equivalents, so existing links
keep working.

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
npm run lint     # type-check only
```

## Project structure

```
public/            # static assets copied as-is (avatar, favicon, CNAME, 404.html)
src/
  components/      # shared UI (ProjectCard, BackLink, CopyButton, ThemeToggle, LangToggle)
  data/            # content for the Projects & Utils lists
  i18n/            # useLang (en / ru), UI strings per language
  hooks/           # useTypedRole (terminal typing), usePageMeta (title/body class),
                   # useTheme (system / light / dark)
  lib/             # cron.ts (cron parser & scheduler), cron-ru.ts (Russian wording), jwt.ts (JWT decode & HMAC verify),
                   # snowflake.ts (Snowflake ID decode)
  pages/           # Home, Projects, Utils, Cron, Jwt, Snowflake
  icons.tsx        # inline SVG icons
  index.css        # design tokens + all styling (ported 1:1)
  App.tsx          # routes
  main.tsx         # entry point
```

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds the
site and publishes `dist/` to GitHub Pages. The custom domain is set via
`public/CNAME`, and `public/404.html` provides a single-page-app fallback so
deep links (e.g. `/projects`) resolve correctly on GitHub Pages.
