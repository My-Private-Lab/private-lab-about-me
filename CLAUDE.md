# CLAUDE.md

Personal site of Igor Savin (isavin.dev): React 18 + Vite + TypeScript, styles in
`src/index.css`, pages in `src/pages/`. See `README.md` for routes and commands.

## Working rules

- **Communicate in Russian.**
- **Merge straight into `master`** once a change is finished and verified — no
  separate approval or pull request needed.
  - Commit on the working branch, then push the same commit to `master`
    (fast-forward: `git push origin HEAD:master`).
  - If `master` has new commits, bring them in first and re-verify.
  - Never force-push `master` or rewrite its history.
- **Verify before merging:**
  - `npm run build` passes (it also type-checks).
  - The change is checked in a real browser (Playwright/Chromium) at desktop
    width and on a phone (iPhone emulation): screenshots, no horizontal scroll,
    the home page fits the screen without scrolling.
- **Visual changes: agree on a mockup first.** For new UI elements, show 2–3
  variants as screenshots of the real page and wait for a choice before
  implementing.

## Mobile conventions (keep them when changing the UI)

- Form fields are 16px on touch devices (`pointer: coarse`), so iOS doesn't zoom
  on focus. Never disable pinch-zoom (`maximum-scale`, `user-scalable=no`).
- Tap targets are at least 44×44px on touch devices. Grow them with padding
  plus a matching negative margin so the layout doesn't shift.
- `:hover` effects live only inside `@media (hover: hover) and (pointer: fine)`.
  Keyboard focus is shown with `:focus-visible`; touch feedback with `:active`.
- Respect safe areas (`--gutter` + `env(safe-area-inset-*)`), `100dvh`, and
  `prefers-reduced-motion`.
- Fonts are self-hosted via `@fontsource-variable` — don't add Google Fonts or
  other third-party requests.
- Navigation back: the inline arrow in the page heading (`BackLink`), not links
  at the bottom of the page.
