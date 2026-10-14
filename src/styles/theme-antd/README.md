# Ant Design theme (feature/theme-antd)

An Ant Design style light theme layered on top of the upstream dashboard
without editing components, so upstream merges stay conflict free.

## How it is switched on

`NEXT_PUBLIC_DEFAULT_THEME` (build time, see `defaultTheme.ts`):

| value            | `<html>` class      | result                                  |
| ---------------- | ------------------- | --------------------------------------- |
| `antd` (default) | `light theme-antd`  | AntD look; the toggle can still go dark |
| `light`          | `light`             | upstream light theme                    |
| `dark`           | `dark`              | upstream default                        |

Every rule is scoped to `:root.theme-antd:not(.dark)`, so the dark theme and the
upstream light theme render exactly as upstream.

## Files

| file                 | role                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| `tokens.css`         | AntD v5 tokens (`--ant-*`), the only place with literal colours            |
| `withAntdTheme.ts`   | wraps `tailwind.config.ts`: `netbird` / `nb-gray` / radius / shadow become `var(--x, <upstream value>)` |
| `base.css`           | element defaults, specificity below any utility                             |
| `overrides.css`      | component fixes keyed on upstream class names, each with `@depends`         |
| `vendors.css`        | React Flow etc.                                                             |
| `defaultTheme.ts`    | env switch, `<html>` props, ThemeProvider default                           |

Upstream touch points (the only conflict hotspots): one import + `export default
withAntdTheme(config)` in `tailwind.config.ts`, the first line of
`src/app/globals.css`, one import + one line each in `src/layouts/AppLayout.tsx`
and `src/contexts/ThemeProvider.tsx`, two npm scripts in `package.json`.

## Checks

- `npm run theme:check-selectors` — every `@depends` token still exists in its
  file and every `[class~=…]` selector still matches a class under `src/`.
- `npm run theme:visual-guard -- --base <ref> --theme dark` — all stories,
  dark, must be pixel-identical to the upstream base.
- `npm run theme:visual-guard -- --base <ref> --theme light` — AntD theme vs
  the last approved theme commit; review every change.
- CI: `.github/workflows/theme-antd-guard.yml` runs all three.

## Merging upstream

```sh
git fetch origin
git rebase <upstream-branch>          # e.g. i18n-zh-cn
npm ci && npm run build
npm run theme:check-selectors          # renamed classes -> fix overrides.css
npm run theme:visual-guard -- --base <upstream-branch> --theme dark
npm run theme:visual-guard -- --base ORIG_HEAD --theme light
```
