# Theme (`src/theme`): Ant Design look, layout modes, adapters

An Ant Design style light theme layered on top of the upstream dashboard
without editing components, so upstream merges stay conflict free.

## How it is switched on

`NEXT_PUBLIC_DEFAULT_THEME` (build time, see `defaultTheme.ts`):

| value            | `<html>` class     | result                                  |
| ---------------- | ------------------ | --------------------------------------- |
| `antd` (default) | `light theme-antd` | AntD look; the toggle can still go dark |
| `light`          | `light`            | upstream light theme                    |
| `dark`           | `dark`             | upstream default                        |

Colour rules are scoped to `:root.theme-antd:not(.dark)`; the responsive layer,
the layout-mode tokens and the shell / adapters (P1 on) apply to both colour
modes of an AntD build. Builds without `theme-antd` render exactly as upstream.
Since P0 of the UI architecture (`docs/plans/2026-10-17-enterprise-ui-architecture.md`)
the dark theme is **no longer** promised to be pixel-identical to upstream; see
"Merging upstream".

## Files

```
src/theme/
  tokens/   breakpoints.ts, tokens.base.css, tokens.density.css, tokens.light.css
  css/      index.css, base.css, overrides.css, vendors.css, density.css, pagination.css, responsive.css
  adapters/ components swapped in through tsconfig `paths`: DataTablePagination, Table (+ .contract.ts, stories, tests)
  hooks/    useLayoutMode.tsx (useLayoutMode, useIsPhone, LayoutModeSync)
  shell/    AppShell, DashboardLayout, Header, PageContainer, Sider, NavDrawer,
            PageHeaderBar, BottomBar, pageHeader (the slot), siderContext
  templates/ page templates (P2+)
  defaultTheme.ts, withAntdTheme.ts, README.md
```

| file                        | role                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `tokens/breakpoints.ts`     | the layout-mode contract: `BREAKPOINTS` (768, 1280), `MEDIA` queries, `layoutModeFor()`; its test fails on any other width in the theme CSS |
| `tokens/tokens.base.css`    | any colour mode: font stacks (CJK, mono), size scale, spacing, motion, z-index                          |
| `tokens/tokens.density.css` | control / table / page density per layout mode (`--ctl-h` 32px desktop, 40px phone, …)                  |
| `tokens/tokens.light.css`   | AntD v5 colour tokens (`--ant-*`), component tokens (sider, header, table, tag), Tailwind palette variables; the only place with literal colours |
| `withAntdTheme.ts`          | wraps `tailwind.config.ts`: `netbird` / `nb-gray` / radius / shadow become `var(--x, <upstream value>)` |
| `css/base.css`              | element defaults, specificity below any utility; tabular numerals in tables                             |
| `css/overrides.css`         | component fixes keyed on upstream class names, each with `@depends` (shrinks as adapters take over)     |
| `css/vendors.css`           | third-party widgets: React Flow, sonner, Radix portals, timescape, xterm                                |
| `css/density.css`           | AntD "middle" density keyed on upstream classes: 32px controls, 12px/16px table cells (P1: adapters)    |
| `css/responsive.css`        | phones / tablets (and R1 at every width), see "手机端适配" below                                        |
| `adapters/`                 | component replacements via `tsconfig.json` paths: `DataTablePagination`, `Table`, `SidebarItem`         |
| `shell/`                    | the app shell (section below): replaces `DashboardLayout`, `Header` and `PageContainer` via paths       |
| `hooks/useLayoutMode.tsx`   | `useLayoutMode()` → `phone` / `compact` / `full`, `useIsPhone()`, `LayoutModeSync` (`<html data-layout-mode>`) |
| `defaultTheme.ts`           | env switch, `<html>` props, ThemeProvider default                                                       |

## App shell (P1)

The chrome around every dashboard page is ours (architecture section 4.2).
Three exact `tsconfig.json` aliases swap upstream's layout files for
`src/theme/shell/*`, two more swap the navigation item:

| alias | replacement | pins (`@replaces-file`) |
| --- | --- | --- |
| `@/layouts/DashboardLayout` | `shell/DashboardLayout.tsx`: upstream's provider stack + `AppShell` | `src/layouts/DashboardLayout.tsx` |
| `@/layouts/Header` | `shell/Header.tsx`: the top bar, still exports `headerHeight` (48) | `src/layouts/Header.tsx` |
| `@/layouts/PageContainer` | `shell/PageContainer.tsx`: `<main>` scroll container, same classes | `src/layouts/PageContainer.tsx` |
| `@/components/SidebarItem`, `@components/SidebarItem` | `adapters/SidebarItem.tsx`: same props and routing, dark-menu visuals, collapsed rail + group popovers | `src/components/SidebarItem.tsx` |
| `@components/Breadcrumbs`, `@/components/Breadcrumbs` | `adapters/Breadcrumbs.tsx`: inside the shell registers its `Item`s with the page-header store and renders nothing (the top bar shows them); outside it renders upstream | `src/components/Breadcrumbs.tsx` |
| (hosted, not replaced) | `src/layouts/Navigation.tsx` renders inside `Sider` / `NavDrawer`; shell.css neutralises its container (`@depends`) | `src/layouts/Navigation.tsx` |

`@replaces-file <file> sha256:<16 hex>` pins the whole upstream file: when
upstream changes it, `theme:check-selectors` fails and the replacement is
reviewed (new provider in the stack, new nav behaviour, a renamed class),
then the hash is updated. `SidebarItem.contract.ts` additionally makes
`tsc` fail when the props drift.

**Structure.** `AppShell` = announcement row, then `Sider` + main column
(`Header` top bar, `PageHeaderBar`, the page, `BottomBar`), plus the phone
`NavDrawer`. Everything renders in every layout mode and `shell.css` shows
or hides parts with the contract's media queries (first paint right without
JS); only the tablet default of the sider (collapsed for the session) and the
drawer use JavaScript. No framer-motion, no `calc(100vh - 65px)`: the frame
is flex with `100dvh`, the page scrolls inside `PageContainer`.

**Sider.** 240px dark (`--sider-*` tokens, decision 1), collapses to a 56px
rail: desktops by the persisted preference (`ApplicationProvider`), tablets
by default. The collapse toggle sits in the footer (`[data-navbar-colappse-toggle]`
kept for stories and the distributor mode). Collapsed, items show their icon
with the label as `title`, and collapsible groups open a popover to the
right; nothing expands on hover. `[data-navigation]` on the `<aside>` keeps
the distributor's "hide the navigation" rule working.

**Page header slot** (`shell/pageHeader.tsx`). A page declares itself:

```tsx
usePageHeader({
  title: t("common:word.peers"),
  count: peers?.length,
  breadcrumb: [{ label: t("common:word.peers"), href: "/peers", icon: <PeerIcon size={13} /> }],
  help: <>…one sentence, optional link…</>,
  primaryAction: { label: t("…"), onClick: openAdd },   // optional
  secondaryActions: [{ label: t("…"), href: "/…" }],    // optional
  backHref: "/peers",                                   // detail pages
});
```

Desktops: the breadcrumb goes to the top bar, title + count + help + actions
to `PageHeaderBar`. Phones: the title goes to the top bar, the primary action
to `BottomBar`, the bar is hidden. A page that has not registered a header
still gets its breadcrumb in the top bar through the Breadcrumbs adapter
(the store keeps that trail in a second slot; a full spec wins) and its title
from it, else from the translated document title; its own h1 stays in the
page until it migrates. Every list page is migrated (P1b, see
`touch-points.txt` for the `@theme: page-template` lines); the detail pages
(peer, group, network, user) and the settings tabs keep their in-page title
rows until P3. The spec lives in a small external store (`PageHeaderStore`):
registering never re-renders the page, listeners fire only when a visible
field changed, handlers are read when the action runs (never stale). Pass
strings or memoised nodes. Migrated pages carry `@theme: page-template` and
a `touch-points.txt` line. `count` is the page's data length where the
page has it in scope; the table's "N of M" filtered count moves to the table
adapter in P2.

**Stories.** `Theme/Shell` renders the Peers page in the shell at 1440, 1024
(`vp-1024`) and 390 (`vp-390`), collapsed, with the group popover, with the
drawer open and with a demo page that registers actions. The `vp-<width>`
story tag makes the visual guard's `capture.mjs` shoot at that width.

**Disable or revert.** Remove the five alias lines from `tsconfig.json`:
upstream's layout, header, page container and sidebar item are used again
(their files were never edited). The Peers page then needs its in-page
header block back (`git log -- "src/app/(dashboard)/peers/page.tsx"`).

## Layout modes

One DOM, three layout modes (architecture section 5):

| mode      | width          | what changes                                                        |
| --------- | -------------- | ------------------------------------------------------------------- |
| `phone`   | < 768px        | AppBar + drawer, tables as cards, full-screen sheets, 40px controls |
| `compact` | 768 – 1279px   | collapsed sider, tables scroll in their box, 16px page padding      |
| `full`    | ≥ 1280px       | full sider, desktop layout                                          |

- **CSS first.** Pure styling differences use media queries with the contract's
  widths (`767.98px`, `1279.98px`, `768px`, `1280px`); `breakpoints.test.ts`
  rejects any other `(min|max)-width` under `src/theme`. The first paint of
  the static export is therefore right before any JavaScript runs.
- **JS for behaviour.** `useLayoutMode()` (matchMedia, server snapshot `full`)
  is for what CSS cannot express: Modal vs Sheet, where the page header
  renders, a Select that opens as a bottom panel. `LayoutModeSync`, mounted
  in `AppLayout` and the Storybook preview, mirrors the mode to
  `<html data-layout-mode>`; CSS may key on it only for JS-dependent states,
  never for the first paint.
- **Density by variable.** A control reads `var(--ctl-h)` and gets 32px on a
  desktop and 40px on a phone because `tokens.density.css` switched the
  variable, not because the control branched.

Upstream touch points (the only conflict hotspots): one import + `export default
withAntdTheme(config)` in `tailwind.config.ts`, the first line of
`src/app/globals.css`, one import + one line each in `src/layouts/AppLayout.tsx`
and `src/contexts/ThemeProvider.tsx`, three npm scripts and the
`@rc-component/pagination` dependency in `package.json` (+ lock file), two
`paths` lines in `tsconfig.json` (DataTablePagination, Table), 18 keys in `components.table.json`
(en + zh-CN), and the commented-out remote fetch in
`src/contexts/AnnouncementProvider.tsx` (see "公告横幅"), the mobile nav
drawer in `src/layouts/DashboardLayout.tsx` (see "手机导航抽屉"), and a story
decorator in `src/components/ui/AnnouncementBanner.stories.tsx` (see "公告横幅").
These in-place edits carry an `@theme` comment and are listed in
`scripts/theme/touch-points.txt`, which `npm run theme:check-selectors` (also
run by `sync-upstream.sh`) checks, so a sync that silently drops them fails.

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
  (tokens, base, overrides, vendors, density, pagination, responsive); later
  files win
  equal-specificity ties.

## Pagination component replacement

**What.** `adapters/DataTablePagination.tsx` replaces
`src/components/table/DataTablePagination.tsx` (rendered once, by
`DataTable.tsx`, so every table). It shows the full AntD pagination: total
count (共 N 条), page list with ••• jumpers (« / » on hover), prev/next, page
size select (10 / 25 / 50 / 100 / 1000, plus the current size if it is not in
the list) and the quick jumper (前往 X 页). Upstream only has
« ‹ X of Y › », which CSS cannot turn into a page list.

**How it is swapped in.** One line in `tsconfig.json` (`compilerOptions.paths`,
the only upstream file touched besides `package.json` and the lock file):

```json
"@components/table/DataTablePagination": ["./src/theme/adapters/DataTablePagination.tsx"],
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
hash. `tsc` fails via `adapters/DataTablePagination.contract.ts` when the
props type changes. Then:

1. Read the upstream diff. Does a new prop or behaviour need a counterpart in
   the AntD branch? (The upstream branch forwards all props anyway.)
2. Update the wrapper, the expected type in the contract file and the hash
   (the check-selectors error prints the new one).
3. Run `npx vitest run src/theme/components`, and look at the
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

## 手机端适配（responsive.css + adapters/Table.tsx）

原则：**桌面优先、单一代码库**。所有规则都在 `max-width: 1279.98px` /
`767.98px` 媒体查询或 `(pointer: coarse)` 里，所以除 R1 外 ≥1280px 的桌面（浅色、暗色）与之前逐像素一致（R1 自 P0 起在所有宽度生效，见下表）。
没有改任何页面代码；表格转卡片是**同一个 `<table>`** 用 CSS 重新排版。

**暗色模式也生效。** 和其他主题文件不同，`responsive.css` 的作用域是
`:root.theme-antd:is(.dark, :not(.dark))`：只要是开启了 AntD 主题的构建（`<html>` 上有
`theme-antd`），无论用户切到浅色还是暗色都生效。原因：手机切到暗色时原来会回到上游的手机布局
（用户详情页左右两栏挤在一起、整页横向滚动、表格不转卡片），店主在手机上就遇到了。权重仍是 (0,3,0)，
照样压过 `dark:` 变体。颜色只有几处（卡片边框 / 背景、字段名、R2 固定列、R5 弹窗底栏），写成
`var(--ant-…, rgb(var(--nbg-…, 上游值)))`：浅色用 AntD token（和以前完全一样），暗色没有 `--ant-*`，
取上游 nb-gray 色。`NEXT_PUBLIC_DEFAULT_THEME=light|dark`（不带 `theme-antd`）的构建仍与上游完全一致。
只想让暗色回到上游手机布局：把 `responsive.css` 里的 `:is(.dark, :not(.dark))` 全部换回 `:not(.dark)`。

断点：`< 768px` 手机；`768–1279px` 平板 / 小笔记本；`≥ 1280px` 不受影响。

整体关闭：删掉 `index.css` 里的 `@import "./responsive.css";`，再删 `tsconfig.json`
里 `@components/table/Table` 那一行（可选，见 R4）。单独关闭某一项：删掉
`responsive.css` 里对应编号的块（注释里有 R1…R6 编号）。

| 编号 | 做什么 | 为什么 | 怎么关 |
| ---- | ------ | ------ | ------ |
| R1 所有宽度（其余子项 `< 1280px`） | `.table-fixed-scroll` 改为 `display:block`，表格工具栏（搜索 / 筛选 / 按钮）允许换行（这两条在所有宽度生效）；页面头部「标题 … 操作」行（`justify-between max-w-6xl`）放不下时把操作按钮换到标题下面；含 `.truncate` 文本（如 `TextWithTooltip`）的 flex / grid 子项 `min-width:0`（带显式 `min-w-*` 的除外，如 15rem 侧栏） | 上游 `globals.css` 把它设成 `display:table`，外层被表格撑宽，`Table` 自带的 `overflow-x-auto` 永远不滚动，整页横向溢出（1440 宽、侧栏展开时 Peers 的工具栏和表格也溢出，Add Peer 被挤出屏幕，见 `docs/plans/evidence/2026-10-17-ui-audit/peers-1440.png`，所以 P0 起这两条在所有宽度生效）；flex 子项默认 `min-width:auto`，外层不能收缩，`truncate` 的省略号永远不出现，超长主机名 / 邮箱把整页撑宽（peer 详情页 375 +157px、768 +245px） | 删 R1 块中对应规则 |
| R2 `768–1279px` | 行操作列（⋮ 菜单，`data-nb-cell="trail"`）`position:sticky; right:0`，背景跟随行的 hover / 选中色 | 平板上表格在自己的框内横向滚动，操作按钮常在最右侧看不到 | 删 R2 块 |
| R3 `< 768px` | 通用防溢出：`inline-flex gap-4` 按钮组（以及其中嵌套的 `flex gap-4` 按钮组）换行；页面标题（h1/h2 以及 `whitespace-nowrap text-xl` 标题行）里的长名称可断行；Radix 弹层（菜单、下拉、Popover）最大宽度 `100vw - 16px`；输入框 / 文本域 / select 字号 16px；日期范围选择器固定在屏幕顶部（左右各 8px，可纵向滚动），底部「起 - 止」时间输入框上下排列；详情页左右两栏（`flex gap-10 max-w-6xl items-start`，用户详情 / 网络详情 / peer 详情）改为上下排列；「标签 … 输入组」设置行（`justify-between gap-10` 且控件是 `w-full flex gap-3`，如 认证 → 会话过期的「数字 + 小时」）控件放到标签下面；活动日志条目的日期换到「用户 · 邮箱」下面；功能卡片（`FeatureCard`，IdP 同步 / MFA 等，页面会传更大的 `min-w-*`）最大宽度 100%、文字换行 | 375px 下 336/419 个页面 story 横向溢出；iOS Safari 在字号 < 16px 的输入框聚焦时会自动放大页面；日期选择器默认向右侧弹出、两个月并排，手机上超出屏幕（`!important` 用来覆盖 Radix 的内联 `transform/left/top`）；16px 字号下两个时间输入框并排时各自折成两行；其余几项是 `mobile-allow.json` 里剩下的溢出（审计日志 +69px、认证小时行 +32px、用户详情组选择器 +58px、MFA 卡片 +73px、Add Route 按钮组 +27px），都按"通用结构"写规则，每条带 `@depends` 由 `theme:check-selectors` 检查 | 删 R3 中对应规则 |
| R4 `< 768px` | **表格转卡片**：表头行变成可横向滚动的「全选 + 排序」条；每一行变成一张卡片：第一行是【勾选框】【第一列（名称）】【⋮ 操作】，其余列为「列名 …… 值」；上游已隐藏的列（如 `hidden xl:table-cell`）保持隐藏；选中 / hover 颜色沿用 `overrides.css` | 参考 ThingsBoard / AntD Pro 的手机列表；不维护第二套页面，排序、筛选、勾选、行操作、展开行、分页都是原表格本身，所以全部照常工作 | 删 R4 块（表格回到 R1 的内部横向滚动）；再删 `tsconfig.json` 的 Table 行即可完全去掉包装组件 |
| R5 `< 768px` | 弹窗（`Modal`）全屏：`min-height:100dvh`、去圆角和边框；底部按钮栏 `position:sticky; bottom:0`（含 iOS 安全区）；弹窗内大间距（`gap-6/8/10`）的横向 flex 改为纵向、`grid-cols-2` 改为单列 | 手机上居中小弹窗内容被挤压，主按钮常在长表单底部看不到；左右两栏（如访问控制的「来源 → 目标」）放不下 | 删 R5 块 |
| R6 `pointer: coarse` | 勾选框、开关、弹窗关闭按钮、面包屑链接加不可见的 `::after` 热区（向外扩 8–12px） | 触屏点击目标 < 24px；只扩大点击区域，不改外观 | 删 R6 块 |
| 分页 | `adapters/DataTablePagination.tsx`：`< 768px` 时 `showLessItems`、不显示快速跳转（`useIsPhone()`，`matchMedia`；没有 `matchMedia` 的环境如 jsdom 按非手机处理） | 完整分页在 375px 放不下 | 删掉 `showQuickJumper` / `showLessItems` 两个 `phone` 相关的 prop（整体关闭 `responsive.css` 时这一项不会自动关闭） |

**表格包装组件（`adapters/Table.tsx`）。** 与分页组件相同的方式替换：
`tsconfig.json` 里加一行精确别名
`"@components/table/Table": ["./src/theme/adapters/Table.tsx"]`
（唯一的引用方是 `DataTable.tsx`），包装组件通过 `@/components/table/Table` 引入原组件并
`export *` 其余导出。它只读 DOM、只写属性，不改任何行为：

- 从表头第一行读列名，写到每个单元格的 `data-label`，并写 `data-nb-col`（第几列，从 1 开始）；
- `data-nb-cell` 标记单元格角色：`lead`（标题前的无标题列，如勾选框）、`title`（第一个有列名的列）、
  `trail`（标题后最后一个无标题列，通常是 ⋮ 操作）、`field`（其他列）、`full`（`colSpan` 的展开行 / 空状态）；
- `<table data-nb-cards>` 表示有表头可以转卡片；`data-nb-route` 是当前路由（每表配置用）；
- `MutationObserver`（只观察子节点和文本，不观察属性，所以不会自我触发）在行变化时重新标记。

CSS 只依赖这些自有属性，不依赖上游类名，所以上游改表格样式不会让卡片布局失效。
`adapters/Table.contract.ts` 在上游改了 `Table` 的 props 时让 `tsc` 报错。

**每表配置（按需隐藏卡片里的列）。** 在 R4 末尾的「Per-table card config」处写，键是
路由 + 列号，例如 `table[data-nb-route="/peers"] td[data-nb-col="7"] { display: none; }`。
目前**没有任何条目**：所有列在卡片里都显示（上游在窄屏已隐藏的列除外）。新增时请在这里登记。

**已知仍会横向溢出的页面：无。** 549 个 story 在 375 / 390 / 768 下都不再横向溢出，
`scripts/theme/mobile-allow.json` 为空（`{}`）；以后新增的溢出会被 `npm run theme:mobile-guard` 报出来。
如果某个页面确实只能用脆弱的补丁修，宁可把它写进 `mobile-allow.json`（`--update` 后审查 diff）并在这里列出。

**检查。** `npm run theme:mobile-guard`（见下文「Checks」）：除横向溢出外，`< 768px` 时还检查
「两栏并排」和「表格没有转成卡片」，暗色 390px、详情页 360px（浅色 + 暗色）也在检查范围内。

## 手机导航抽屉（`src/layouts/DashboardLayout.tsx`，上游文件里的改动）

**做什么：** 手机（`< 768px`，即上游显示汉堡菜单的断点；`≥ 768px` 一直显示侧栏，没有抽屉）
的导航菜单改成 Angular Material / ThingsBoard 的 sidenav "over" 模式：

- 抽屉 `fixed` 在左侧、全屏高（`h-dvh`），从左滑入（0.2s），盖在页面**上面**，内容超出时自己滚动
  （`overscroll-contain`），顶部（头像、关闭按钮）始终可见，不管文档有没有被滚动；
- 页面本身完全不动：不再缩小到 75%、不再加圆角、不再右移下移、不再变成 90vh；
- 半透明遮罩（`bg-black/40`，`fixed inset-0`）盖住页面，点遮罩或 ✕ 关闭，按 Esc 关闭；遮罩的淡入用 CSS 动画
  （`animate-in fade-in-0 duration-200`，系统开启「减少动态效果」时不动画），不用 framer-motion：framer 的 opacity
  动画结束时会有一帧回到初始值 0，抽屉右侧露出的那一条遮罩会闪一下白（店主手机上看到的白条）；
- 打开时锁住页面滚动（`<html>` 的 `overflow:hidden`），页面加 `inert`（读屏和 Tab 都进不去），
  焦点移到 ✕ 按钮，关闭后回到汉堡按钮；抽屉是 `role="dialog" aria-modal="true"`；
- 点菜单项后关闭抽屉（上游 `SidebarItem` 原有逻辑，未改）。

**为什么：** 店主不喜欢上游"整页缩小后滑到右边"的效果，想要和 ThingsBoard 一样的抽屉。
上游这个效果在手机上还有两个 bug（文档滚动过 1px 后 framer-motion 丢掉页面的位移，页面盖住
抽屉；抽屉在文档流里，文档滚动过时顶部在屏幕外）。新写法从结构上避免了这两个问题：
之前删掉的 `layout={"position"}` 保持删除，之前加的"打开时 `scrollTo(0,0)`"已去掉（不再需要）。

**为什么改 TSX 而不是只写主题 CSS：** 页面的缩放 / 位移 / 高度是 framer-motion 写在行内
`style` 里的（`transform`、`height: 90vh`），抽屉在文档流里且没有遮罩层，只用 CSS 需要大量
`!important` 去压行内样式、还要伪造遮罩，Esc / 滚动锁定 / 焦点管理 CSS 做不到，而且只对 AntD
浅色主题生效。改 TSX 是一处集中的、所有主题一起生效的小改动（`@theme` 注释 +
`touch-points.txt` 三行），上游改写这段时会在合并时冲突或被 `theme:check-selectors` 报出来，
比一组依赖 framer 行内样式的 CSS 更好维护。桌面（`≥ 768px`）汉堡菜单不显示，抽屉不会出现，
页面外层的动画值与上游关闭状态完全相同，所以 ≥1280 逐像素不变。

**怎么关掉（回到上游的缩放滑开效果）：** 没有运行时开关（刻意不加，避免在上游文件里再多一处改动）。
`git log --oneline -- src/layouts/DashboardLayout.tsx` 找到 "drawer backdrop fades in with a CSS animation"
和 "mobile nav as an 'over' drawer" 两次提交，按从新到旧的顺序 `git revert <新> <旧>` 即可（目前可以无冲突地直接 revert）。
结果是上一版：上游的缩放滑开效果，加上打开菜单时 `window.scrollTo(0, 0)`——旧效果的抽屉在文档流里，
这一行是它需要的修复，所以随 revert 一起回来；`touch-points.txt` 也会一起恢复（去掉 "over" drawer、`inert`、
遮罩三行，恢复 `scrollTo` 那一行）。
之后跑 `npm run theme:check-selectors` 确认。合并上游时如果这里冲突：先接受上游版本，
再按上面的列表重新做一遍（或者放弃此定制）。

## 公告横幅（不再拉取 NetBird 官方公告）

**做什么：** `src/contexts/AnnouncementProvider.tsx` 里拉取
`https://raw.githubusercontent.com/netbirdio/dashboard/main/announcements.json`
的那段 `fetch` 被注释掉，换成 `raw = [];`（带 `@theme` 注释，原代码原样保留在注释里）。
页面顶部不再出现官方公告（例如 “Roll Out NetBird Across Your Organization with MDM”）。

**为什么：** 那些是 NetBird 官方的产品推广，对自建部署的用户没有意义；同时避免浏览器每 30 分钟访问一次 GitHub。

**没有动的：** 横幅组件 `AnnouncementBanner`、部署方自己的公告（运行时配置 `NETBIRD_ANNOUNCEMENT`，
见 `src/utils/announcement.ts`）、计费提醒、MSP 公告的逻辑都原样保留。要显示自己的公告，用
`NETBIRD_ANNOUNCEMENT`：Docker 镜像里是同名环境变量；静态部署则是 `config.json` 里的
`"announcement"` 字段。它只支持一段纯文本，醒目样式（`important`），不可关闭；留空即不显示。

**注意：** 公告会在浏览器 `localStorage`（键 `netbird-announcements`）里缓存最多 30 分钟。
已经打开过旧版本的浏览器，最多 30 分钟内还可能看到缓存里的官方公告，过期后自动消失
（也可以手动清除这个键）。

**怎么恢复：** 在 `getRemoteAnnouncements()` 里删掉 `raw = [];`，取消下面 `fetch` 那几行的注释
（`ANNOUNCEMENTS_URL` 常量一直保留着），并删掉 `scripts/theme/touch-points.txt` 里对应的一行。合并上游时如果这里冲突，以上游为准再重新注释即可。

**Storybook：** 上游的 `Components/AnnouncementBanner` 故事是通过模拟这个远程 URL 来显示横幅的，
关掉 `fetch` 之后这 5 个故事的 play 步骤找不到横幅而失败。故事文件里加了一个 decorator
（带 `@theme` 注释，已登记在 `touch-points.txt`）：把故事自己的公告写进 Provider 读取的
`localStorage` 缓存（`netbird-announcements`，时间戳为当前时间，所以被当作"未过期缓存"直接使用），
横幅照常显示，play 通过。只影响这 5 个故事，应用行为不变。恢复远程拉取后可以删掉这个 decorator。

## Checks

- `npm run theme:check-selectors`: every `@depends` token still exists in its
  file and every `[class~=…]` selector still matches a class under `src/`.
  The specificity policy holds. Replaced components still match the upstream
  signature (`@replaces`). Every `@theme` touch point is still in place.
- `npx vitest run src/theme`: the breakpoint contract (and that the theme CSS
  uses no other widths), `useLayoutMode`, the pagination adapter.
- `npm run theme:visual-guard -- --base <ref> --theme dark|light` — every
  story against the last approved `dev` commit (CI: the PR base, else the
  commit before the push). Both themes fail on any change so a reviewer
  looks at the uploaded shots; a dark change is reviewed like a light one
  (see "Merging upstream").
- `npm run theme:mobile-guard` — every page story at 375 / 390 / 768px (AntD
  light), 390px dark, the detail-page stories (`*detail*`) at 360px light +
  dark, **and 1280 / 1440px light (desktops)**: fails when a page scrolls
  sideways more than `scripts/theme/mobile-allow.json` allows (> 4px), and
  below 768px when two tall columns sit side by side or a table with a header
  is not shown as cards (layout checks are not allowlistable). The desktop
  widths are the layout-mode boundary and the common laptop width with the
  sider open. `--storybook <dir>` reuses a build, `--update` rewrites the
  allowlist (review its diff), `THEME_GUARD_CHROMIUM=<path>` uses a
  preinstalled browser.
- CI: `.github/workflows/theme-antd-guard.yml` runs all of them.

## Merging upstream

Branch model: upstream `origin/main` (netbirdio/dashboard) → `dev`. `dev` is
the single main branch: the zh-CN translations and this theme live there
together (the old `i18n-zh-cn` / `feature/theme-antd` branches are gone).
分支模型：上游 `origin/main` → `dev`；`dev` 是唯一的主开发分支（中文翻译与本主题都在其上）。

`scripts/theme/sync-upstream.sh` does it in a throw-away worktree first:

```sh
scripts/theme/sync-upstream.sh            # dry run: fetch origin/main, replay dev onto it,
                                          # check-selectors, build, dark visual guard
                                          # (vs pre-sync dev), phone overflow
                                          # guard. No branch moves.
scripts/theme/sync-upstream.sh --quick    # dry run, rebase + check-selectors only
scripts/theme/sync-upstream.sh --apply    # rebase dev onto origin/main
```

It never pushes. After
`--apply`, review both themes against the pre-sync `dev`:
`npm run theme:visual-guard -- --base ORIG_HEAD --theme light` and `--theme dark`.

**Dark theme policy (since P0 of the UI architecture, decision 4).** The dark
theme is no longer kept pixel-identical to upstream: the shell, templates and
adapters render in both colour modes from our tokens, and until P5 switches
dark to AntD dark tokens it takes its colours from upstream's values. The
guard therefore compares dark with the previous approved commit like light,
and every dark change is reviewed from the shots rather than forbidden.
