# Ant Design theme (feature/theme-antd)

An Ant Design style light theme layered on top of the upstream dashboard
without editing components, so upstream merges stay conflict free.

## How it is switched on

`NEXT_PUBLIC_DEFAULT_THEME` (build time, see `defaultTheme.ts`):

| value            | `<html>` class     | result                                  |
| ---------------- | ------------------ | --------------------------------------- |
| `antd` (default) | `light theme-antd` | AntD look; the toggle can still go dark |
| `light`          | `light`            | upstream light theme                    |
| `dark`           | `dark`             | upstream default                        |

Every rule is scoped to `:root.theme-antd:not(.dark)`, so the dark theme and the
upstream light theme render exactly as upstream.

## Files

| file               | role                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `tokens.css`       | AntD v5 tokens (`--ant-*`), the only place with literal colours                                         |
| `withAntdTheme.ts` | wraps `tailwind.config.ts`: `netbird` / `nb-gray` / radius / shadow become `var(--x, <upstream value>)` |
| `base.css`         | element defaults, specificity below any utility                                                         |
| `overrides.css`    | component fixes keyed on upstream class names, each with `@depends`                                     |
| `vendors.css`      | third-party widgets: React Flow, sonner, Radix portals, timescape, xterm                                |
| `density.css`      | AntD "middle" density: 32px controls, 12px/16px table cells                                             |
| `defaultTheme.ts`  | env switch, `<html>` props, ThemeProvider default                                                       |

Upstream touch points (the only conflict hotspots): one import + `export default
withAntdTheme(config)` in `tailwind.config.ts`, the first line of
`src/app/globals.css`, one import + one line each in `src/layouts/AppLayout.tsx`
and `src/contexts/ThemeProvider.tsx`, two npm scripts in `package.json`.

## Specificity policy

Three tiers, lowest to highest. `npm run theme:check-selectors` enforces the
last two points.

| tier              | selector shape                                         | beats                                         |
| ----------------- | ------------------------------------------------------ | --------------------------------------------- |
| base (`base.css`) | `html:where(.theme-antd:not(.dark)) <element>` (0,0,1) | Preflight only; any utility wins              |
| overrides         | `:root.theme-antd:not(.dark) <selector>` (≥ 0,3,0)     | single utilities and `dark:` variants         |
| `!important`      | as above                                               | inline `style={…}` and upstream `!` utilities |

- Keep selectors at most 3 compound selectors deep after the scope prefix.
  Key on one component's classes (`[class~="x" i]`), not on DOM structure.
- Use `!important` only to beat an inline style or an upstream `!utility`, and
  say which in a comment right before the rule (`!important: inline style`).
- Write utility classes as attribute selectors with the `i` flag
  (`[class~="text-white" i]`), never as `.text-white`. Tailwind's `@apply` in
  `globals.css` (e.g. `.timescape input:focus { @apply text-white }`) copies
  every rule whose selector it can parse as that class into the `@apply`
  site. Storybook (postcss-import inlines this file) and Next (css-loader
  does not) then disagree. The `i` flag keeps Tailwind from recognising the
  selector.
- No native `@layer`. Tailwind v3 emits utilities unlayered, and unlayered
  CSS beats every cascade layer whatever the specificity, so a layered
  override would lose to all utilities. Wrapping Tailwind itself in layers
  would mean editing `globals.css` and reordering against unlayered vendor
  CSS (xyflow, sonner), which risks dark-theme drift. Revisit with Tailwind v4,
  which layers its output natively. Until then, order comes from `index.css`
  (tokens, base, overrides, vendors, density); later files win
  equal-specificity ties.

## Checks

- `npm run theme:check-selectors` — every `@depends` token still exists in its
  file and every `[class~=…]` selector still matches a class under `src/`.
- `npm run theme:visual-guard -- --base <ref> --theme dark` — all stories,
  dark, must be pixel-identical to the upstream base.
- `npm run theme:visual-guard -- --base <ref> --theme light` — AntD theme vs
  the last approved theme commit; review every change.
- CI: `.github/workflows/theme-antd-guard.yml` runs all three.

## Merging upstream

`scripts/theme/sync-upstream.sh` does it in a throw-away worktree first:

```sh
scripts/theme/sync-upstream.sh            # dry run: fetch origin/main, replay i18n-zh-cn
                                          # and feature/theme-antd, check-selectors,
                                          # build, dark visual guard. No branch moves.
scripts/theme/sync-upstream.sh --quick    # dry run, rebase + check-selectors only
scripts/theme/sync-upstream.sh --apply    # rebase feature/theme-antd onto i18n-zh-cn
scripts/theme/sync-upstream.sh --apply --rebase-i18n   # also rebase i18n-zh-cn onto upstream
```

It never pushes and touches `i18n-zh-cn` only with `--rebase-i18n`. After
`--apply`, review the AntD theme itself:
`npm run theme:visual-guard -- --base ORIG_HEAD --theme light`.
