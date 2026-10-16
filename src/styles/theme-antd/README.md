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
| `responsive.css`   | phones / tablets (< 1280px only), see "手机端适配" below                                                 |
| `components/`      | component replacements via `tsconfig.json` paths: `DataTablePagination`, `Table`                        |
| `defaultTheme.ts`  | env switch, `<html>` props, ThemeProvider default                                                       |

Upstream touch points (the only conflict hotspots): one import + `export default
withAntdTheme(config)` in `tailwind.config.ts`, the first line of
`src/app/globals.css`, one import + one line each in `src/layouts/AppLayout.tsx`
and `src/contexts/ThemeProvider.tsx`, three npm scripts and the
`@rc-component/pagination` dependency in `package.json` (+ lock file), two
`paths` lines in `tsconfig.json` (DataTablePagination, Table), 18 keys in `components.table.json`
(en + zh-CN), and the commented-out remote fetch in
`src/contexts/AnnouncementProvider.tsx` (see "公告横幅").

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

## 手机端适配（responsive.css + components/Table.tsx）

原则：**桌面优先、单一代码库**。所有规则都在 `max-width: 1279.98px` /
`767.98px` 媒体查询或 `(pointer: coarse)` 里，并且同样限定在
`:root.theme-antd:not(.dark)` 下，所以 ≥1280px 的桌面、暗色主题、上游浅色主题都与之前
逐像素一致。没有改任何页面代码；表格转卡片是**同一个 `<table>`** 用 CSS 重新排版。

断点：`< 768px` 手机；`768–1279px` 平板 / 小笔记本；`≥ 1280px` 不受影响。

整体关闭：删掉 `index.css` 里的 `@import "./responsive.css";`，再删 `tsconfig.json`
里 `@components/table/Table` 那一行（可选，见 R4）。单独关闭某一项：删掉
`responsive.css` 里对应编号的块（注释里有 R1…R7 编号）。

| 编号 | 做什么 | 为什么 | 怎么关 |
| ---- | ------ | ------ | ------ |
| R1 `< 1280px` | `.table-fixed-scroll` 改为 `display:block`，表格工具栏（搜索 / 筛选 / 按钮）允许换行 | 上游 `globals.css` 把它设成 `display:table`，外层被表格撑宽，`Table` 自带的 `overflow-x-auto` 永远不滚动，整页横向溢出（上游在 1280 也有这个问题，但 1280 起不改，保证桌面一致） | 删 R1 块 |
| R2 `768–1279px` | 行操作列（⋮ 菜单，`data-nb-cell="trail"`）`position:sticky; right:0`，背景跟随行的 hover / 选中色 | 平板上表格在自己的框内横向滚动，操作按钮常在最右侧看不到 | 删 R2 块 |
| R3 `< 768px` | 通用防溢出：页面头部「标题 … 操作」行（`justify-between max-w-6xl`）和 `inline-flex gap-4` 按钮组换行；页面标题（h1/h2 以及 `whitespace-nowrap text-xl` 标题行）里的长名称可断行；Radix 弹层（菜单、下拉、Popover）最大宽度 `100vw - 16px`；输入框 / 文本域 / select 字号 16px；日期范围选择器固定在屏幕顶部（左右各 8px，可纵向滚动） | 375px 下 336/419 个页面 story 横向溢出；iOS Safari 在字号 < 16px 的输入框聚焦时会自动放大页面；日期选择器默认向右侧弹出、两个月并排，手机上超出屏幕（`!important` 用来覆盖 Radix 的内联 `transform/left/top`） | 删 R3 中对应规则 |
| R4 `< 768px` | **表格转卡片**：表头行变成可横向滚动的「全选 + 排序」条；每一行变成一张卡片：第一行是【勾选框】【第一列（名称）】【⋮ 操作】，其余列为「列名 …… 值」；上游已隐藏的列（如 `hidden xl:table-cell`）保持隐藏；选中 / hover 颜色沿用 `overrides.css` | 参考 ThingsBoard / AntD Pro 的手机列表；不维护第二套页面，排序、筛选、勾选、行操作、展开行、分页都是原表格本身，所以全部照常工作 | 删 R4 块（表格回到 R1 的内部横向滚动）；再删 `tsconfig.json` 的 Table 行即可完全去掉包装组件 |
| R5 `< 768px` | 弹窗（`Modal`）全屏：`min-height:100dvh`、去圆角和边框；底部按钮栏 `position:sticky; bottom:0`（含 iOS 安全区）；弹窗内大间距（`gap-6/8/10`）的横向 flex 改为纵向、`grid-cols-2` 改为单列 | 手机上居中小弹窗内容被挤压，主按钮常在长表单底部看不到；左右两栏（如访问控制的「来源 → 目标」）放不下 | 删 R5 块 |
| R6 `pointer: coarse` | 勾选框、开关、弹窗关闭按钮、面包屑链接加不可见的 `::after` 热区（向外扩 8–12px） | 触屏点击目标 < 24px；只扩大点击区域，不改外观 | 删 R6 块 |
| R7 `< 768px` | 手机导航抽屉：打开汉堡菜单时，页面外层（`fixed scale-75 rounded-xl`）的位移由 CSS 给出（`translate(80% / 60% / 45%, 6.5%)`，断点 490 / 640px，数值与上游相同，带 0.2s 过渡）；抽屉本身 `position: fixed; top: 0` 固定在屏幕左上角 | **修复"打开菜单后灰色遮罩盖住整页、菜单只露出碎片"**。上游 `DashboardLayout` 用 framer-motion 移动页面外层，并且该元素带 `layout="position"`；只要文档被滚动过（哪怕 1px），framer 的布局投影就会把 x/y 位移整个丢掉，页面保持原大小盖在抽屉上，只剩 20% 黑色遮罩。安卓 Chrome 上 `100vh` 等于"地址栏收起后"的高度，`h-screen` 外壳比可见区域高出地址栏那么多，页面随手一滑文档就滚动了，所以手机上几乎必现，桌面和开发者工具模拟（文档不滚动）看不到。上游暗色 / 上游浅色同样有这个问题（主题层按约定不改它们）。抽屉固定是因为文档滚动后抽屉顶部（头像、关闭按钮）会跑到屏幕外 | 删 R7 块（三个 `@media`） |
| 分页 | `components/DataTablePagination.tsx`：`< 768px` 时 `showLessItems`、不显示快速跳转（`useIsPhone()`，`matchMedia`；没有 `matchMedia` 的环境如 jsdom 按非手机处理） | 完整分页在 375px 放不下 | 删掉 `showQuickJumper` / `showLessItems` 两个 `phone` 相关的 prop（整体关闭 `responsive.css` 时这一项不会自动关闭） |

**表格包装组件（`components/Table.tsx`）。** 与分页组件相同的方式替换：
`tsconfig.json` 里加一行精确别名
`"@components/table/Table": ["./src/styles/theme-antd/components/Table.tsx"]`
（唯一的引用方是 `DataTable.tsx`），包装组件通过 `@/components/table/Table` 引入原组件并
`export *` 其余导出。它只读 DOM、只写属性，不改任何行为：

- 从表头第一行读列名，写到每个单元格的 `data-label`，并写 `data-nb-col`（第几列，从 1 开始）；
- `data-nb-cell` 标记单元格角色：`lead`（标题前的无标题列，如勾选框）、`title`（第一个有列名的列）、
  `trail`（标题后最后一个无标题列，通常是 ⋮ 操作）、`field`（其他列）、`full`（`colSpan` 的展开行 / 空状态）；
- `<table data-nb-cards>` 表示有表头可以转卡片；`data-nb-route` 是当前路由（每表配置用）；
- `MutationObserver`（只观察子节点和文本，不观察属性，所以不会自我触发）在行变化时重新标记。

CSS 只依赖这些自有属性，不依赖上游类名，所以上游改表格样式不会让卡片布局失效。
`components/Table.contract.ts` 在上游改了 `Table` 的 props 时让 `tsc` 报错。

**每表配置（按需隐藏卡片里的列）。** 在 R4 末尾的「Per-table card config」处写，键是
路由 + 列号，例如 `table[data-nb-route="/peers"] td[data-nb-col="7"] { display: none; }`。
目前**没有任何条目**：所有列在卡片里都显示（上游在窄屏已隐藏的列除外）。新增时请在这里登记。

**已知仍会横向溢出的页面**（都是单个页面的特殊布局，按「宁可列出、不打脆弱补丁」原则未处理；
共 47 条，已写入 `scripts/theme/mobile-allow.json`，`npm run theme:mobile-guard` 只防止新增或变严重）：

- peer 详情页：超长主机名（375 +157px，768 +245px）、登录过期提示头部（768 +150px）、
  768 下标题旁的操作按钮组 `flex gap-4`（+34px）、「Add Exit Node / Add Route」按钮组（375 +27px）；
- 活动 → 审计日志的行（375 +69px）；
- 设置 → 认证里的「小时」输入行（375 +32px）；
- 团队 → 用户（cloud）的 MFA 卡片及其上的邀请弹窗（375 +73px）；
- 用户详情页的组选择器（375 +58px）；
- 集成页在 768 下约 3px（在 4px 容差内，不计）。

日期范围选择器在手机上底部的起止时间输入框仍偏挤（不溢出页面，只是排版拥挤）。

**检查。** `npm run theme:mobile-guard`（见下文「Checks」）。

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
（`ANNOUNCEMENTS_URL` 常量一直保留着）。合并上游时如果这里冲突，以上游为准再重新注释即可。

**Storybook：** 上游的 `Components/AnnouncementBanner` 故事是通过模拟这个远程 URL 来显示横幅的，
关掉 `fetch` 之后这几个故事不再显示横幅（不影响其他故事和页面）。

## Checks

- `npm run theme:check-selectors`: every `@depends` token still exists in its
  file and every `[class~=…]` selector still matches a class under `src/`.
  The specificity policy holds. Replaced components still match the upstream
  signature (`@replaces`).
- `npm run theme:visual-guard -- --base <ref> --theme dark` — all stories,
  dark, must be pixel-identical to the upstream base.
- `npm run theme:visual-guard -- --base <ref> --theme light` — AntD theme vs
  the last approved theme commit; review every change.
- `npm run theme:mobile-guard` — every page story at 375 / 390 / 768px (AntD
  light): fails when a page scrolls sideways more than
  `scripts/theme/mobile-allow.json` allows (> 4px). `--storybook <dir>` reuses
  a build, `--update` rewrites the allowlist (review its diff).
- CI: `.github/workflows/theme-antd-guard.yml` runs all four.

## Merging upstream

`scripts/theme/sync-upstream.sh` does it in a throw-away worktree first:

```sh
scripts/theme/sync-upstream.sh            # dry run: fetch origin/main, replay i18n-zh-cn
                                          # and feature/theme-antd, check-selectors,
                                          # build, dark visual guard, phone overflow
                                          # guard. No branch moves.
scripts/theme/sync-upstream.sh --quick    # dry run, rebase + check-selectors only
scripts/theme/sync-upstream.sh --apply    # rebase feature/theme-antd onto i18n-zh-cn
scripts/theme/sync-upstream.sh --apply --rebase-i18n   # also rebase i18n-zh-cn onto upstream
```

It never pushes and touches `i18n-zh-cn` only with `--rebase-i18n`. After
`--apply`, review the AntD theme itself:
`npm run theme:visual-guard -- --base ORIG_HEAD --theme light`.
