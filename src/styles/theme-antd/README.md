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
and `src/contexts/ThemeProvider.tsx`, two npm scripts and the
`@rc-component/pagination` dependency in `package.json` (+ lock file), one
`paths` line in `tsconfig.json`, and 18 keys in `components.table.json`
(en + zh-CN).

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

## Pagination component replacement

**What.** `components/DataTablePagination.tsx` replaces
`src/components/table/DataTablePagination.tsx` (rendered once, by
`DataTable.tsx`, so every table). It shows the full AntD pagination: total
count (共 N 条), page list with ••• jumpers (« / » on hover), prev/next, page
size select (10 / 25 / 50 / 100 / 1000, plus the current size if it is not in
the list) and the quick jumper (前往 X 页). Upstream only has
« ‹ X of Y › », which CSS cannot turn into a page list.

**How it is swapped in.** One line in `tsconfig.json` (`compilerOptions.paths`,
the only upstream file touched besides `package.json` and the lock file):

```json
"@components/table/DataTablePagination": ["./src/styles/theme-antd/components/DataTablePagination.tsx"],
```

An exact key wins over `@components/*` in tsc, Next (Turbopack), Storybook
(`tsconfigAliases()` in `.storybook/main.ts` sorts exact keys first) and
vitest (`tsconfigPaths`). The wrapper imports the original through
`@/components/table/DataTablePagination`, which the alias does not match.

**Dependency.** `@rc-component/pagination` (exact version, MIT, deps: `clsx`,
`@rc-component/util`). Not `antd`. Its CSS is not imported; `pagination.css`
styles it with the `--ant-*` tokens. The size select is the dashboard's own
`SelectDropdown`.

**Runtime fallback.** The theme class is fixed at build time, but the user can
still switch to dark (or system) at runtime. The wrapper watches `<html>` and
renders the AntD pagination only while `.theme-antd` is set without `.dark`,
the same condition as every theme CSS rule. Otherwise it renders the upstream
component with the same props, so the dark theme and the
`NEXT_PUBLIC_DEFAULT_THEME=light|dark` builds stay identical to upstream.

**Behaviour changes in AntD light.**

- Every paginated table gets a page size select and a quick jumper. Upstream
  had a rows-per-page button in 8 toolbars only.
- The pagination is shown from the first row on, including single-page tables
  (AntD default). Upstream hid it below 2 pages.
- The toolbar `DataTableRowsPerPage` button is hidden by CSS
  (`button[data-testid="rows-per-page"]`, `pagination.css`), so there is only
  one size select.
- Server-paginated tables: upstream `DataTable` drops the first
  `onPaginationChange` in manual mode (`isInitialRender`), so the first page
  click does nothing there (the dark theme still behaves like that). The
  wrapper spends that first call on a no-op once `totalRecords` is known.
- `manualPagination` without `totalRecords` (RouteTable, DNSRecordsTable,
  ReverseProxyTargetsTable: embedded tables that show every row) renders
  nothing, as upstream does.

**Disable or revert.** Delete the `tsconfig.json` line: upstream pagination
everywhere. The CSS rule hiding the toolbar button must go too (last rule in
`pagination.css`), or toolbars lose their rows-per-page button. Optionally
`npm uninstall @rc-component/pagination` and remove `components/` and
`pagination.css`.

**When upstream changes `DataTablePagination`.**
`npm run theme:check-selectors` fails when the upstream props interface or
export line changes. The wrapper's `@replaces … sha256:` comment holds the
hash. `tsc` fails via `components/DataTablePagination.contract.ts` when the
props type changes. Then:

1. Read the upstream diff. Does a new prop or behaviour need a counterpart in
   the AntD branch? (The upstream branch forwards all props anyway.)
2. Update the wrapper, the expected type in the contract file and the hash
   (the check-selectors error prints the new one).
3. Run `npx vitest run src/styles/theme-antd/components`, and look at the
   stories under "Theme AntD/DataTablePagination" in both themes.

If upstream renames or moves the file, the alias silently points at nothing
new: check-selectors reports the replaced file as gone.

## Full-page loader animation

What: the five-bar loader (`FullScreenLoading` → `LoadingIcon`, shown at app
start, during OIDC sign-in and while config loads) is animated with a CSS
`@keyframes` (`theme-antd-loader-bar`, end of `overrides.css`) instead of
relying on upstream's SMIL `<animate>` elements.

Why: Chromium starts an HTML document's SMIL timeline only at the window
`load` event. The static export loads ~20 async chunks first, so on a slow
link the server-rendered loader stood frozen for seconds, and each later
remount restarted at t=0 with the outer bars waiting for `begin=0.25s/0.5s`.
It looked frozen. The CSS animation runs from first paint. It uses the same
motion as upstream (`scaleY` about the bar centre, 120 → 40 → 140 → 120 over
1s, same phase offsets). `height`/`y` are pinned with `!important` so that
SMIL, once it starts, does not scale the bars a second time. The colour is
still `fill-netbird` (AntD primary through `tokens.css`). Dark and upstream
light are untouched.

How to disable: delete the "Full-page loader" block at the end of
`overrides.css`; the upstream SMIL animation then applies unchanged. If
upstream rewrites `LoadingIcon` (no `<rect><animate>` children) the `:has()`
selector stops matching and the upstream loader shows as is; check-selectors
flags the `@depends` tokens.

## Checks

- `npm run theme:check-selectors`: every `@depends` token still exists in its
  file and every `[class~=…]` selector still matches a class under `src/`.
  The specificity policy holds. Replaced components still match the upstream
  signature (`@replaces`).
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
