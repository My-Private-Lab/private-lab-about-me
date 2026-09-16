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

`/utils/cron` is a self-contained cron helper: it explains an expression in
plain English, breaks it down field by field, lists the next runs in the
visitor's time zone, and lets you build a string from per-field inputs or
presets. The current expression lives in the `?expr=` query parameter, so a
link can be shared. Parsing, describing and scheduling live in
`src/lib/cron.ts` with no runtime dependencies.

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
  components/      # shared UI (ProjectCard)
  data/            # content for the Projects & Utils lists
  hooks/           # useTypedRole (terminal typing), usePageMeta (title/body class)
  lib/             # cron.ts — cron parser, describer and next-run scheduler
  pages/           # Home, Projects, Utils, Cron
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
