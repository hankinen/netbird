# 企业级 UI 架构设计：PC + 手机单一代码库

日期 2026-10-17。分支 `dev` @ `bf7fd35`。证据截图在
`docs/plans/evidence/2026-10-17-ui-audit/`（Storybook 渲染，AntD 浅色主题，
1440 / 768 / 390 三种宽度）。状态：**已决策（2026-10-17，店主采纳全部推荐项，见第 10 节），P0 进行中**。

目标读者：店主（做决策）和之后实施各阶段的人或 agent（照着做）。
技术词保留英文，行文中文。

---

## 0. 一句话结论

现在的界面是"上游 NetBird 换成 AntD 配色，再打一层手机补丁"：干净，但没有
自己的骨架，信息密度低，页头像 SaaS 落地页，1440 宽就横向溢出。要做到企业级，
**最大的杠杆不是再改颜色，而是把外壳（Shell）、页面模板（Templates）和表格系统
收归自己所有**，上游只保留业务模块。响应式不再靠 media query 逐页打补丁，而是
用"一套 DOM、三种布局模式、页面声明意图、外壳决定摆放"的契约来做，PC 和手机
天然同一份代码。上游基线从"像素级跟随"降级为"受控分叉"：数据层和业务模块继续
跟上游，表现层是我们的。

---

## 1. 目标与非目标

**目标**

1. PC（≥1280）达到企业级管理后台水准：结构清晰、密度合理、层级分明、克制。
   参照物是 Ant Design Pro 的后台骨架和 ThingsBoard 的实体管理密度，不是
   Linear / Vercel 那种大留白、大圆角、渐变的欧美 SaaS。
2. 手机（<768）达到同等水准：不是"桌面页面缩小能用"，而是有手机自己的导航、
   操作和列表形态（卡片、底部操作栏、全屏表单）。
3. 平板 / 小笔记本（768–1279）有明确定义，不再是桌面布局的挤压版。
4. **一套代码库**：没有第二套页面、第二套组件树。同一个页面在三种模式下渲染
   同一份 React 树，差异来自 CSS 和少量模式分支。
5. 中文是一等公民：中英文排版同时好看，所有新文案走 `t()`。
6. 可持续：每一层都有自动守卫（视觉、溢出、选择器、契约），设计不会在后续
   迭代中慢慢漂走。

**非目标**

- 不引入 `antd` 运行时库（两套 UI 库并存会让包体、样式冲突和上游合并都变差）。
  继续用上游的 Radix 原语 + Tailwind，按 AntD 规范做样式；只在上游缺原语时借
  `@rc-component/*`（分页已经这么做了）。
- 不做 SSR、不换框架、不改数据层（SWR、contexts、API）。
- 不在本阶段做 Control Center 画布的手机编辑（只保证可读、不溢出）。
- 不做"主题商店"式的多皮肤；只有一套企业主题 + 它的暗色（暗色见第 10 节决策）。

---

## 2. 现状审查

### 2.1 做得对的，保留

- 主题层只用 CSS 变量，`tokens.css` 是唯一的颜色来源；`@depends` + `check-selectors`
  让"键在上游类名上的 CSS"有自动守卫。
- 组件替换走 `tsconfig.json` 精确 `paths` 别名 + `.contract.ts` + `@replaces` 哈希
  （`DataTablePagination`、`Table`）。这是本设计继续扩展的机制。
- 手机导航抽屉（over 模式）、表格转卡片（同一个 `<table>` 重排）、弹窗全屏 +
  底栏 sticky、16px 输入框防 iOS 缩放、触控热区：方向都对，第 5 节在它们之上
  收紧成契约，而不是推倒。
- 视觉守卫（dark / light）、mobile-guard、story 体系完整，新设计直接复用。

### 2.2 问题清单（按影响排序）

| # | 问题 | 证据 | 影响 |
| --- | --- | --- | --- |
| 1 | **1440 宽、侧栏展开时 Peers 工具栏和表格横向溢出**，Add Peer 按钮不可见，Version 列被切 | `peers-1440.png` | 最常见的笔记本宽度上主操作丢失 |
| 2 | 页头占高：PC 约 170px，手机约 200px（四分之一屏）。面包屑 + 32px 大标题 + 营销式描述句 + "Learn more" 外链 | `peers-1440.png`, `peers-390.png` | 数据区被压到下方；文案风格是产品官网，不是控制台 |
| 3 | 表格密度低：行高约 82px（每格两行），900px 高只看到 7 行；表头大写小字；Groups 用按钮样式、Direction 用绿框，格内控件风格不一 | `peers-1440.png`, `policies-1440.png` | 企业列表要 12–14 行可见、扫视即可对齐 |
| 4 | 外壳没有身份：白色顶栏里只有 logo（浅色下字标几乎看不见）+ 帮助 + 头像；没有页面标题、没有全局搜索；侧栏浅灰与画布浅灰几乎同色；底部版本框像便签 | 所有 1440 截图 | 第一眼没有"系统"的感觉 |
| 5 | 手机端工具栏换行成 4 行，首条数据从 y≈510px 才开始；表头变成一条横向滚动的排序条 | `peers-390.png` | 手机上一屏看不到数据 |
| 6 | 平板 768 侧栏仍然展开占 240px，表格只剩两列 | `peers-768.png` | 平板体验最差的一档 |
| 7 | 详情页两栏：左侧属性列表对齐混乱（图标 + 标签 + 右对齐值 + 复制按钮），右侧设置卡灰底像禁用态；Save / Cancel 在页头右上，手机上不 sticky | `peer-detail-1440.png`, `peer-detail-390.png` | 表单类页面缺少统一的"描述列表 + 操作栏"范式 |
| 8 | 设置页：垂直 tab + 内容 `max-w-2xl`，右侧三分之一空白；手机上 tab 变成一排无样式 chip | `settings-1440.png` | 版式没有为宽屏和窄屏分别设计 |
| 9 | 弹窗手机版：标题区高、方向箭头占两行、留白多；桌面版结构合理 | `policy-modal-390.png` | 手机表单效率 |
| 10 | 动效：外壳用 framer-motion spring（弹性）切页、侧栏 hover 展开覆盖内容 | 代码 `DashboardLayout.tsx` | 弹性动画和 hover 展开都是"玩具感"的来源 |

### 2.3 根因（三个结构性原因）

1. **表现层不属于我们。** 页面结构、页头、工具栏、表格行都是上游写死的 Tailwind
   类，主题只能"隔着类名"改颜色和尺寸，改不了结构（页头文案、工具栏分组、
   行内两行布局）。
2. **响应式是补丁不是契约。** `responsive.css` 按"上游某个页面的类组合"逐条打
   补丁（`[class~="gap-10"][class~="max-w-6xl"]`），每个新页面都要重新补；页面
   不知道自己在什么模式下，组件也不知道。
3. **没有设计系统的"中间层"。** 从 token 直接跳到页面，缺少 Shell、PageHeader、
   Toolbar、Descriptions、Sheet 这些模板级构件，所以每页各自为政、密度不一。

---

## 3. 设计语言

### 3.1 风格定位

企业级、信息密度优先、克制。它和"欧美 SaaS 风"的具体区别：

| 维度 | 欧美 SaaS（不要） | 本设计（要） |
| --- | --- | --- |
| 画布 | 纯白大留白、大卡片、彩色渐变 | 浅灰画布 `#f5f5f5`，白色表面，1px 发丝线分区 |
| 圆角 | 12–16px，药丸按钮 | 6px（控件）/ 8px（卡片），不用药丸 |
| 阴影 | 多层柔和投影做层级 | 发丝线做层级，阴影只给浮层（菜单、弹窗） |
| 字号 | 标题 32–40px，正文 16px | 页标题 20px，区块标题 16px，正文 14px，辅文 12px |
| 密度 | 行高 64–80px，每格两行 | 表格行 48–56px，单行为主，第二行只放必要辅文 |
| 文案 | 页头一段营销描述 + Learn more | 标题 + 数量；说明收进帮助图标 tooltip |
| 主操作 | 大号渐变按钮 | AntD primary 32px，位置固定在工具栏右端 |
| 动效 | spring 弹性、页面缩放 | 200ms ease-out，淡入 / 位移 ≤ 8px，尊重 reduced-motion |
| 侧栏 | 极简图标、hover 展开 | 分组明确、可折叠成 56px 图标栏、折叠态点击展开 |

### 3.2 视觉规范要点

- **颜色**：AntD v5 token 全量（seed → map → alias → component 四级，见附录 B）。
  主色保留 `#1677ff`（可在决策 6 换成品牌蓝），NetBird 橙只出现在 logo。
  状态色一律用 AntD success / warning / error / processing 四色 + 对应的
  bg / border / text 三档，不再出现 `bg-sky-900` 之类的直接色。
- **表面与描边**：画布 `colorBgLayout`，表面 `colorBgContainer`，分区线
  `colorBorderSecondary`，控件描边 `colorBorder`。表格、卡片、侧栏都用发丝线。
- **字体**：Latin 继续 Inter（已是 WOFF2）；CJK 用系统字体栈
  `"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC"`，不打包中文字体。
  表格数字 `font-variant-numeric: tabular-nums`。行高 1.5715。
- **字号阶梯**：12 / 14 / 16 / 20 / 24，不再有 `text-[0.84rem]`、`text-[8px]` 这类
  自由值（Beta 徽标用 `tag` 的 small 尺寸）。
- **间距**：8pt 网格；页面内边距 24px（compact 16px，phone 12px）；区块间距 16/24。
- **图标**：lucide 16px 为主，20px 只用于导航和空状态。
- **状态表达**：在线 / 离线用 6px 圆点 + 文字，不只靠颜色；标签（tag）承担
  分类，徽标（badge）承担计数。
- **动效**：外壳不用 framer-motion；抽屉 / 弹窗 / 菜单统一 CSS transition
  200ms；列表加载用 skeleton，不用 spinner。

### 3.3 向 ThingsBoard 借什么

借：

- **实体表格范式**：白色卡片容器 + 顶部工具栏（标题 / 数量 / 搜索 / 筛选 /
  刷新 / 新增）+ 密表格 + 底部分页，一屏能扫 12 行以上。
- **详情就地打开**：点一行在右侧抽屉看概览，再决定是否进入整页（本设计作为
  可选能力，见 6.5）。
- **手机端同一套列**：表格在窄屏变成卡片但列定义不变，排序 / 筛选 / 多选照常。
- **导航分组和图标栏**：清楚的一级分组，折叠后仍可用。
- **toolbar 收纳**：窄屏时次要操作收进 ⋯ 菜单，不换行堆叠。

不借：

- Angular Material 的外观（涟漪、浮动标签、阴影层级）。我们的外观是 AntD。
- ThingsBoard 的仪表盘 widget 网格（NetBird 没有这类页面）。

---

## 4. 总体架构：四层模型

```
┌──────────────────────────────────────────────────────────────────────┐
│ L3  上游业务模块  src/modules/*, src/contexts/*, src/utils/api.tsx     │  跟上游
│     表格列定义、弹窗表单、业务 cells、权限逻辑（只加 t() 和 column meta）│
├──────────────────────────────────────────────────────────────────────┤
│ L2  模板与适配器  src/theme/templates/*, src/theme/adapters/*          │  我们的
│     ListPage / DetailPage / SettingsPage / FormSheet / QuickView       │
│     Button / Input / Select / Tabs / Modal / Table / Badge / …(别名替换)│
├──────────────────────────────────────────────────────────────────────┤
│ L1  外壳  src/theme/shell/*                                           │  我们的
│     AppShell（Sider / Header / AppBar / PageHeader slot / BottomBar）  │
│     LayoutModeProvider（phone | compact | full）                      │
├──────────────────────────────────────────────────────────────────────┤
│ L0  设计 token  src/theme/tokens/*, src/theme/css/*                   │  我们的
│     颜色 / 字体 / 密度 / 圆角 / 阴影 / 动效 / z-index / 断点            │
└──────────────────────────────────────────────────────────────────────┘
```

依赖只能向下：L3 不知道 L1 的存在（它只用 `@components/*`，别名把调用导到
L2 的 adapter）；L2 用 L1 的 hooks（`useLayoutMode`、`usePageHeaderSlot`）；
L1 和 L2 只消费 L0 的 token。

### 4.1 L0：Design tokens

- 现有 `tokens.css` 扩成完整的 AntD v5 四级 token（附录 B），分三个文件：
  `tokens.light.css`、`tokens.dark.css`（决策 4 之后启用）、`tokens.density.css`
  （按布局模式切换的控件高度、字号、内边距）。
- `withAntdTheme.ts` 继续把 Tailwind 调色板映射成 `var(--x, 上游值)`，新增
  spacing / fontSize 的映射，让上游组件里的 `text-sm` `p-4` 也跟 token 走。
- 断点只在一个地方定义：`src/theme/tokens/breakpoints.ts` 导出常量，脚本生成
  `breakpoints.css`（自定义媒体查询 `@custom-media` 由 PostCSS 展开）。单元测试
  断言 TS 与 CSS 一致。

### 4.2 L1：App Shell

替换上游的 `DashboardLayout` / `Header` / `Navigation` / `PageContainer`
（通过 `tsconfig.json` 精确别名 `@/layouts/DashboardLayout` 等，与现有
`@components/table/Table` 同一机制；P0 用 10 分钟 spike 验证 `@/` 前缀的精确
别名在 Turbopack / Storybook / vitest 下都优先于 `@/*`）。

Shell 的组成与三种模式：

```
full (≥1280)                      compact (768–1279)              phone (<768)
┌──────┬────────────────────────┐ ┌──┬───────────────────────┐ ┌──────────────────┐
│ Logo │ 面包屑 … 搜索 ⌘K ? 👤   │ │☰ │ 面包屑 … 搜索 ? 👤      │ │ ☰  页面标题   ⋯  │ AppBar 48
│──────┼────────────────────────│ │──┼───────────────────────│ ├──────────────────┤
│ 导航 │ PageHeader：标题 · 数量 │ │图│ PageHeader（同左）      │ │ 工具栏(一行+⋯)   │
│ 240  │          主操作 次操作   │ │标│                        │ │ 卡片列表         │
│ 分组 │ Toolbar：搜索 筛选 刷新 │ │栏│ Toolbar（溢出收进 ⋯）   │ │                  │
│      │ 表格（密，可横滚，粘列） │ │56│ 表格（横滚 + 粘首列/尾列）│ │                  │
│      │ 分页                    │ │  │                        │ ├──────────────────┤
│ 版本 │                        │ │  │                        │ │ [ 主操作按钮 ]    │ BottomBar
└──────┴────────────────────────┘ └──┴───────────────────────┘ └──────────────────┘
```

- **Sider**：240px，可折叠 56px 图标栏（持久化到 localStorage，沿用
  `isNavigationCollapsed`）；折叠态点击图标弹出该组的浮层菜单（不是 hover 把
  侧栏撑开盖住内容）。compact 默认折叠。深色还是浅色侧栏见决策 1。
- **Header**（full / compact）：48px；左侧当前页面的面包屑；右侧全局搜索
  （现有 ⌘K 搜索面板，入口搬到这里）、帮助、用户。MSP / 租户切换保留在右侧。
- **AppBar**（phone）：48px；☰ + 页面标题 + 操作溢出菜单。页面标题来自
  PageHeader slot（见 5.2）。
- **PageHeader slot**：页面通过 `usePageHeader({ title, count, breadcrumb,
  primaryAction, secondaryActions, tabs, help })` 声明；full / compact 渲染在内容
  区顶部（20px 标题 + 右侧操作），phone 渲染到 AppBar（标题）+ BottomBar
  （主操作）+ 溢出菜单（次操作）。
- **BottomBar**（phone）：当页面声明了 `primaryAction`，或详情页处于编辑态
  （Save / Cancel），以 sticky 底栏呈现，含 `env(safe-area-inset-bottom)`。
- **导航抽屉**（phone）：沿用现有 over 抽屉（Esc、焦点、滚动锁定），外观换成
  Sider 同款。是否追加底部 tab 栏见决策 2。
- **公告 / 账单提示**：Header 下方一条，不再把高度算进 `headerHeight` 常量，
  改为 CSS grid 行，内容区自然下移。
- **移除**：页面切换的 framer spring、侧栏 hover 展开、`calc(100vh - 65px)`
  硬编码；Shell 用 CSS grid（`grid-template-rows: auto 1fr`）和 `100dvh`。

### 4.3 L2：模板与适配器

两条腿同时走，才能既快又彻底：

- **Adapters（不改页面就换外观）**：对上游 `src/components/*` 里的原语做别名
  替换：Button、Input、Textarea、Select、Badge（→ Tag）、Tabs、Breadcrumbs、
  Modal（→ 桌面居中 / 手机 Sheet）、Card、Checkbox / Switch、Tooltip、
  Pagination（已有）、Table（已有，升级）。每个 adapter：转发全部 props、
  `.contract.ts` 锁 props 类型、`@replaces` 哈希锁上游签名、story 覆盖三种模式。
  adapter 内部不写业务，只做结构 + 类名（用 cva variants，颜色全走 token）。
  做完这一步，约 80% 的页面外观已经统一，`overrides.css` 里键在上游类名上的
  规则应大幅减少（第 8 节把 `@depends` 数量当作下降指标）。
- **Templates（结构性的改进）**：`ListPage`、`DetailPage`、`SettingsPage`、
  `FormSheet`、`QuickView`（第 6 节）。页面逐个迁移到模板，迁移的 `page.tsx`
  头部加 `@theme page-template` 注释并登记到 `touch-points.txt`。未迁移的页面
  靠 adapter 和一组"过渡 CSS"（现有 `.p-default h1` 这类规则）维持一致，直到迁完。

### 4.4 L3：上游模块

`src/modules/*`、`src/contexts/*`、API 层保持跟上游。允许的改动只有三种：
`t()`（翻译）、表格列的 `meta`（5.3）、页面级的模板迁移（`page.tsx`）。

### 4.5 目录结构（P0 做一次性迁移）

```
src/theme/
  tokens/        breakpoints.ts, tokens.light.css, tokens.dark.css, tokens.density.css
  css/           base.css, overrides.css(逐步缩小), vendors.css, responsive.css(逐步缩小), index.css
  shell/         AppShell.tsx, Sider.tsx, Header.tsx, AppBar.tsx, BottomBar.tsx,
                 PageHeaderSlot.tsx, LayoutModeProvider.tsx, NavDrawer.tsx
  templates/     ListPage.tsx, DetailPage.tsx, SettingsPage.tsx, FormSheet.tsx, QuickView.tsx,
                 Toolbar.tsx, Descriptions.tsx, EmptyState.tsx
  adapters/      Button.tsx, Input.tsx, Select.tsx, Tag.tsx, Tabs.tsx, Modal.tsx,
                 Table.tsx, DataTablePagination.tsx, … 各带 .contract.ts / .stories.tsx / .test.tsx
  hooks/         useLayoutMode.ts, usePageHeader.ts, useIsTouch.ts
  README.md      （现 theme-antd/README.md 迁移并重写）
```

现有 `src/styles/theme-antd/` 整体搬入，脚本（`scripts/theme/*`、`tsconfig.json`
别名、`globals.css` 第一行、`AppLayout.tsx` 的 import）同一提交内更新。

---

## 5. 响应式架构："一套 DOM，三种布局模式"

### 5.1 布局模式契约

| 模式 | 宽度 | 导航 | 表格 | 弹窗 | 控件高度 |
| --- | --- | --- | --- | --- | --- |
| `full` | ≥1280 | Sider 240 / 56 | 密表格，容器内横滚，粘首列 + 粘操作列 | 居中 Modal（640 / 800 / 960 三档） | 32px |
| `compact` | 768–1279 | Sider 默认折叠 56 | 同上 | 居中 Modal，max 90vw | 32px |
| `phone` | <768 | AppBar + 抽屉（+ 可选底部 tab） | 卡片 | 全屏 Sheet，sticky 头尾 | 40px，字号 16px |

CSS 与 JS 的分工（避免首屏闪烁，静态导出没有视口信息）：

- **首屏和纯样式差异用媒体查询**（`@custom-media --phone (max-width: 767.98px)` 等，
  从 `breakpoints.ts` 生成）。
- **行为差异用 `useLayoutMode()`**（matchMedia，与同一断点表一致）：Modal 还是
  Sheet、Select 下拉还是底部面板、PageHeader 渲染到哪个槽。
- Shell 在 `<html>` 上写 `data-layout-mode`，仅供"JS 已知"的样式分支使用；规则
  是 CSS 不得只依赖它决定首屏布局。
- 所有组件级的宽度适配优先用 **container query**（`@container`），例如工具栏在
  自己容器不足 720px 时把次要按钮收进 ⋯，与页面是否有侧栏无关。这正是问题 #1
  的根治办法：1440 减去侧栏 240 只剩 1200，工具栏自己知道该收。

### 5.2 页面意图槽位

页面不关心自己在什么设备上，只声明意图：

```tsx
usePageHeader({
  title: t("common:word.peers"),
  count: peers?.length,
  breadcrumb: [{ label: t("common:word.peers"), href: "/peers" }],
  help: t("peers.page:page.text.userDevicesAndHeadlessMachines"),
  primaryAction: { label: t("peers.page:page.text.addPeer"), onClick: openAdd, icon: <Plus/> },
  secondaryActions: [refresh, exportCsv],
});
```

Shell 决定：full / compact 放内容区顶部一行；phone 把 `title` 放 AppBar、
`primaryAction` 放 BottomBar、`secondaryActions` 收进 ⋯。`help` 在任何模式下都是
标题旁的 ⓘ tooltip，不再是一段正文。`DataTableHeadingPortal`（上游把数量写进
h1 的机制）改为向这个 slot 写 `count`。

### 5.3 表格响应式契约

在 TanStack 的列定义上加 `meta`（L3 唯一允许的结构改动）：

```ts
meta: {
  priority: 1 | 2 | 3,        // 1 总是显示；2 compact 隐藏；3 phone 卡片隐藏
  cardRole: "title" | "subtitle" | "status" | "field" | "actions" | "hidden",
  align: "start" | "end",
  width: 160,                 // 期望宽度，用于 table-layout: fixed
}
```

Table adapter 读 meta 写 `data-*`（没有 meta 的列退回现有的 DOM 推断），CSS 负责：

- full / compact：`table-layout: fixed`，容器内横滚，首列和操作列 sticky，
  行高 48px（单行）/ 56px（带辅文），表头 12px 常规大小写（不再全大写）。
- phone：卡片结构固定为「状态点 + title / subtitle + 操作 ⋯」一行，下方最多
  4 个 `field`（label 12px 灰 / value 14px），其余折叠在"更多"里；排序 / 多选
  从横向滚动条改为工具栏里的"排序"下拉 + 卡片左侧勾选。
- 单元格里不再放按钮样式的 Group 标签；统一为 Tag（可点击的 Tag 有 hover）。
- 空状态、加载 skeleton、错误态是模板的一部分，每个列表页自动拥有。

### 5.4 弹窗、抽屉、选择器

- `Modal` adapter：full / compact 居中；phone 全屏 Sheet（已有 R5 的 CSS 升级为
  组件实现：头部 sticky 带返回、底部 sticky 操作、内容区自己滚动；打开时 push
  一条 history，让安卓返回键关闭 Sheet 而不是退出页面）。
- `QuickView`（右侧抽屉，480px）：phone 上是 90dvh 的底部 Sheet。
- `Select` / 多选器：phone 上下拉改为底部面板（搜索框在顶部，选项 44px 高）。
- 日期范围选择器：phone 上沿用"顶部 sheet"方案，但由组件实现，不再 `!important`
  覆盖 Radix 的内联定位。

### 5.5 密度 token 随模式切换

`tokens.density.css` 按媒体查询改写同一组变量：

```css
:root { --ctl-h: 32px; --ctl-font: 14px; --cell-py: 12px; --page-px: 24px; }
@media (--phone) { :root { --ctl-h: 40px; --ctl-font: 16px; --cell-py: 12px; --page-px: 12px; } }
@media (--compact) { :root { --page-px: 16px; } }
```

所有控件只引用这些变量，于是"手机上控件变大"不需要任何组件知道自己在手机上。

### 5.6 触控与可达性

- 触控设备（`pointer: coarse`）：可点目标 ≥ 40px（CSS 热区继续保留）。
- 键盘：focus-visible 环统一为 token；抽屉 / Sheet 焦点陷阱和返回焦点沿用现有
  实现；Shell 用 `<header> <nav> <main>` 地标。
- 文本：卡片和描述列表允许中文 `overflow-wrap: anywhere`；长主机名 / 邮箱在
  phone 可换行、在 full 截断加 tooltip。
- 动效遵循 `prefers-reduced-motion`。

---

## 6. 页面模板

### 6.1 ListPage（Peers、Policies、Groups、Networks、Routes、DNS、Users、Setup Keys、Services …）

- 组成：PageHeader slot + `Toolbar`（搜索 / 筛选组 / 视图切换 / 刷新 / 更多）+
  `DataTable`（adapter）+ 分页。整体在一个白色表面卡片里，画布灰底。
- full：工具栏一行，容器不足时次要项收进 ⋯；表格见 5.3。
- phone：AppBar 标题 + 搜索按钮展开为全宽搜索；筛选是一个按钮打开底部 Sheet；
  卡片列表；主操作在 BottomBar。
- 迁移顺序：Peers（最复杂、最常用）→ Policies → 其余（多数只需换模板壳）。

### 6.2 DetailPage（Peer、User、Network、Group、Service User …）

- 组成：PageHeader（返回 + 标题 + 状态 Tag + 操作）+ Tabs + 内容。
- 概览 tab 用 `Descriptions`（AntD 描述列表：label / value 网格，full 两列、
  phone 一列），取代现在的 Card.List；设置项用统一的 `SettingRow`
  （标题 / 说明 / 控件右对齐），灰底卡片取消。
- 编辑态：有未保存更改时 full 在 PageHeader 右侧显示 Save / Cancel，phone 显示在
  BottomBar；离开页面有守卫（沿用 `useGuardedRouter`）。

### 6.3 SettingsPage

- full：左侧 200px 分区菜单 + 右侧内容，内容 `max-width: 880px` 居左不再
  `max-w-2xl`，宽屏右侧放"本页说明 / 相关文档"侧栏（可选）。
- phone：分区菜单是一个列表页，点进去是该分区内容（AppBar 返回），不再是
  一排横向 chip。实现上仍是同一个 `VerticalTabs`：phone 模式下 List 和 Content
  互斥显示，URL `?tab=` 不变。

### 6.4 FormSheet（所有创建 / 编辑弹窗）

- 结构固定：头部（图标 + 标题 + 一句说明）/ 可选 tabs / 表单主体 /
  底部（左：帮助链接；右：取消 + 主按钮）。
- 表单布局：full 标签在上、单列 640px 或双列 800px；phone 单列，控件 40px，
  底部操作 sticky。方向箭头之类的示意图在 phone 收成一行图标。

### 6.5 QuickView（可选，ThingsBoard 式）

列表行点击先开右侧抽屉（概览 + 关键操作 + "打开详情页"），减少在列表与详情
之间来回。行为由 `ListPage` 的 `quickView` 配置开启，默认关闭，先在 Peers 试。

---

## 7. 与上游的关系：受控分叉

店主已确认：**效果优先，基线可以不保持**。但"不保持"不等于"随便改"，而是把
仓库分成三类表面，各自有明确的合并策略，让上游同步仍然是半自动的。

### 7.1 三类表面

| 表面 | 内容 | 上游合并时 | 守卫 |
| --- | --- | --- | --- |
| ours | `src/theme/**`、`tsconfig.json` 的别名块、`scripts/theme/**` | 以我们为准 | contract + `@replaces` 哈希：上游改了被替换组件的签名时 `tsc` 和 check-selectors 报错 |
| shared | 已迁移到模板的 `page.tsx`、带 `meta` 的列定义、`AppLayout.tsx`、`globals.css` 首行 | 先接受上游，再按 `@theme` 注释重做 | `touch-points.txt` |
| upstream | `src/modules/**`（除 meta）、`src/contexts/**`、API、e2e、上游 workflow | 以上游为准 | 上游自己的测试 |

### 7.2 替换机制与清单

继续用精确 `paths` 别名（附录 C 是全清单）。规则：

- 一个别名 = 一个 adapter 文件 + 一个 `.contract.ts` + 一组 story（三种模式）+
  单元测试（props 透传、模式分支）。
- adapter 对外的 props 类型是上游的超集，默认值保持上游行为，新增 prop 都是可选。
- adapter 内部通过非别名路径引用上游实现（`@/components/...`），需要时包裹，
  不需要时直接重写（Shell 和 Table 会重写；Button / Input 一类包裹即可）。

### 7.3 规则变更

- **暗色不再要求与上游像素一致。** 原因：Shell 和模板是重写，暗色下必须由我们
  的 token 渲染。视觉守卫改为"两种主题都和上一个已批准的 dev 提交比较"，
  CI 已经是这么取基线的，只是把 dark 从"零变化"改成"变化需审阅"。决策 4 决定
  暗色是沿用上游 token 值还是切到 AntD 暗色 token。
- `check-selectors` 保留，并新增两项统计：`@depends` 规则数和 `responsive.css`
  行数，要求每个阶段只降不升。
- 上游同步流程（`sync-upstream.sh`）不变：dry-run → 检查 → `--apply`。冲突
  预期集中在 shared 表面，README 列出每个 shared 文件的"重做步骤"。

---

## 8. 质量门禁

| 门禁 | 现状 | 本设计 |
| --- | --- | --- |
| Story 覆盖 | 每页一组 story，默认 1440 | 模板和 adapter 的 story 用 `parameters.viewport` 固定 390 / 1024 / 1440 三档，自动进入视觉守卫 |
| 溢出守卫 | `mobile-guard` 375 / 390 / 768 | 新增 **1280 / 1366 / 1440 桌面档**（本次问题 #1 会被它抓到），全部 story 不得横向溢出 |
| 视觉守卫 | dark 零变化，light 审阅 | 两种主题都审阅；基线 = 上一个已批准提交 |
| 选择器守卫 | `@depends` / `@replaces` / touch points | 不变，加"下降指标" |
| 单元测试 | 85 个文件 | 新增：`breakpoints.ts` 与 CSS 一致；`useLayoutMode`；PageHeader slot 在三种模式下的分发；column meta → data 属性；Sheet 的 history 行为 |
| e2e | 桌面 1920×1080 | 增加一个 `phone` project（390×844，`isMobile`），先跑登录 + Peers + 创建 Policy 三条主流程 |
| 可达性 | 无 | story 层跑 axe（Storybook a11y addon），阻断级：对比度、无名控件、焦点不可见 |
| 性能 | 无 | 预算：首屏 JS 不因 Shell 增加 >30KB gzip；CLS = 0（Shell 用 grid，没有 65px 常量）；Peers 1000 行滚动 60fps（表格虚拟化保持上游 `react-virtuoso` 路径） |

---

## 9. 分阶段路线图

每个阶段独立可发布，发布后视觉守卫基线前移。

| 阶段 | 内容 | 验收 | 预估 |
| --- | --- | --- | --- |
| **P0 基础** | 决策定稿；目录迁移到 `src/theme/`；`breakpoints.ts` + 布局模式契约 + `useLayoutMode`；token 扩展（字体 / CJK / 密度 / 语义色）；桌面溢出守卫上 CI；**快速修复问题 #1**（工具栏 container query 收纳 + 表格容器横滚） | 1280–1440 所有 story 无横向溢出；三种模式下现有页面不退化 | 1 周 |
| **P1 外壳** | AppShell（Sider / Header / AppBar / BottomBar / PageHeader slot / 抽屉）；adapters：Button、Input、Textarea、Select、Tag、Tabs、Breadcrumbs；Peers 与 Policies 迁到 `ListPage` 作为样板 | 两个样板页在 390 / 1024 / 1440 达到设计稿；其余页面在新外壳里不破 | 2 周 |
| **P2 表格系统** | Table adapter v2（column meta、粘列、密度、卡片结构、空 / 载入 / 错误态）；`FormSheet`；`QuickView`；phone 版 Select / 日期；其余列表页迁移 | 全部列表页在三种模式下通过守卫；`@depends` 数量下降 ≥ 50% | 2 周 |
| **P3 详情与设置** | `DetailPage`（Descriptions、SettingRow、编辑态操作栏）；`SettingsPage`（宽屏版式、phone 列表 → 详情）；Peer / User / Network / Group 详情与 Settings 迁移 | 详情与设置页三种模式通过；e2e phone project 三条流程绿 | 2 周 |
| **P4 收尾** | Control Center 手机只读适配；Integrations / Agent Network / Reverse Proxy 边角页；动效、skeleton、空状态、zh-CN 排版 QA；性能预算 | 全部 page story 通过全部守卫；`responsive.css` 中按上游类名打补丁的规则归零 | 1 周 |
| **P5 可选** | AntD 暗色 token；PWA 细节（standalone、safe-area）；底部 tab 栏（若决策 2 选是） | 暗色视觉审阅通过 | 1 周 |

P0 的"快速修复问题 #1"单独成一个小 PR 先上线，不等整体。

---

## 10. 需要店主决策的事项

| # | 问题 | 选项 | 推荐 | 结论 |
| --- | --- | --- | --- | --- |
| 1 | 侧栏配色 | A 白底侧栏 + 灰画布（现在，AntD Pro light）；B 深色侧栏 `#001529` + 白顶栏（经典企业后台 / ThingsBoard 顶栏深色） | **B**：外壳立刻有辨识度，NetBird 橙色 logo 在深蓝上成立；内容区不受影响 | **B 深色侧栏 `#001529` + 白顶栏** |
| 2 | 手机主导航 | A 只用抽屉；B 抽屉 + 底部 tab 栏（Peers / 策略 / 网络 / 更多） | **A 先做**，P5 看数据再决定 B；底部 tab 和 BottomBar 主操作会抢位置 | **A 只用抽屉；底部 tab 栏留到 P5 看数据** |
| 3 | 手机主操作位置 | A 底部 sticky 操作栏；B 右下 FAB（ThingsBoard）；C 放 AppBar 右侧 | **A**：主操作有文字、可达性好、和编辑态 Save / Cancel 同一位置 | **A 底部 sticky 操作栏** |
| 4 | 暗色主题 | A 暗色沿用上游 token 值（新外壳按其取色）；B 切到 AntD 暗色 token（P5） | **A 到 P4，P5 做 B**；期间暗色只保证"可用、不难看" | **A 到 P4；P5 切 AntD 暗色 token** |
| 5 | 页头文案 | A 保留描述段落；B 标题 + 数量，说明收进 ⓘ | **B** | **B 标题 + 数量，说明收进 ⓘ** |
| 6 | 主色 | A `#1677ff` AntD 蓝；B 自定义品牌蓝（如 `#2f54eb`） | **A**，除非有品牌规范 | **A `#1677ff`** |
| 7 | 目录迁移到 `src/theme/` | 现在做 / 不做 | **现在做**（一次机械提交，之后所有新文件都有家） | **现在做（P0 第一个提交）** |
| 8 | QuickView 抽屉 | 做 / 不做 | **P2 在 Peers 试做**，默认关闭 | **P2 在 Peers 试做，默认关闭** |
| 9 | 设置页宽屏右侧"说明栏" | 做 / 不做 | 不做，留白用 `max-width: 880px` 收住即可 | **不做** |

全部按推荐项定稿（2026-10-17）。后续改动任一决策时在此表更新结论并注明日期。

---

## 11. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| `@/layouts/*` 精确别名在某个工具链里不生效 | P0 第一天 spike；失败则改为在 `AppLayout.tsx` 和 `(dashboard)/layout.tsx` 两处改 import（登记 touch-points） |
| 上游大改 `DataTable` 导致 Table adapter 失配 | contract + 哈希立刻报错；adapter 对上游的依赖面限制在 `columns` / `data` / 少量回调 |
| 页面迁移期间新旧并存，视觉不一致 | adapter 先行（P1）保证基础一致；过渡 CSS 维持未迁移页；每阶段守卫基线前移 |
| 手机 Sheet 与浏览器返回键 | 组件内 pushState + popstate 关闭，单元测试覆盖；e2e phone project 验证 |
| CJK 字体渲染差异（Windows 雅黑 vs macOS 苹方） | 行高 1.5715 和 8pt 网格对两者都稳；视觉守卫在 Linux Chromium 跑，加一条 Noto Sans CJK 的 story 做参考 |
| 包体增加 | 不引入 antd；新增代码主要是 Shell 和 adapters，预算 30KB gzip，CI 对比 `out/` 体积 |

---

## 12. 执行记录

### P0（2026-10-17）

| 项 | 状态 | 提交 / 证据 |
| --- | --- | --- |
| 决策定稿 | 完成 | `docs(plans): record the nine UI architecture decisions` |
| 目录迁移 `src/styles/theme-antd` → `src/theme/{tokens,css,adapters,hooks}` | 完成 | `refactor(theme): move src/styles/theme-antd to src/theme`；check-selectors 改为遍历 `src/theme` 下全部样式、读 `adapters/` 的 `@replaces` |
| 布局模式契约 | 完成 | `feat(theme): layout-mode contract`：`tokens/breakpoints.ts`、`hooks/useLayoutMode.tsx`（`useLayoutMode` / `useIsPhone` / `LayoutModeSync`）、断点一致性测试；`AppLayout` 挂载（touch point）；分页 adapter 改用共享 hook |
| token 扩展 | 完成 | `feat(theme): token expansion`：`tokens.base.css`（字体 / CJK 栈 / 字号 / 间距 / 动效 / z-index）、`tokens.density.css`（随模式切换的控件 / 表格 / 页面密度）、`tokens.light.css` 补齐语义色与外壳组件 token（深色侧栏）；Inter 字体加 CJK fallback；表格 tabular-nums。消费方在 P1 的 adapters 中切换 |
| 问题 #1：1440 横向溢出 | 完成 | `fix(theme): tables scroll in their own box and toolbars wrap at every width`；验证：`evidence/2026-10-17-ui-audit/peers-1440-after-p0.png`（页面横向溢出 0px，Add Peer 可见，工具栏换行，表格在自己的框内横滚） |
| 桌面溢出守卫 | 完成 | `mobile-guard.mjs` 新增 `--desktop-vp 1280,1440` 轮次（默认开启，CI 自动覆盖）；`THEME_GUARD_CHROMIUM` 允许使用预装浏览器 |
| 规则与文档 | 完成 | 暗色不再要求与上游像素一致（两种主题都对上一个已批准提交做视觉审阅）：`src/theme/README.md`、`AGENTS.md`、`theme-antd-guard.yml` 已更新 |

P0 验收（2026-10-17，本机全量运行）：

| 检查 | 结果 |
| --- | --- |
| `node scripts/theme/check-selectors.mjs` | 106 个 `@depends` token、137 个属性选择器、158 条规则、1 个替换组件、8 个 touch point 全部通过 |
| `npx tsc --noEmit` | 0 错误 |
| `npx vitest run` | 87 个文件 / 993 个测试通过（含断点契约 13 个、`useLayoutMode` 4 个） |
| changed-files `eslint` | 无新增错误或告警（`mobile-guard.mjs` 的两条告警早于 P0 存在） |
| `npm run build` | 通过；postbuild：742 个 .gz、IMMUTABLE OK（1942 个文件） |
| `mobile-guard`（375 / 390 / 768 浅色，390 暗色，360 详情页浅 + 暗，**1280 / 1440 浅色**） | 549 个 page story × 8 轮：横向溢出 0，布局问题 0，`mobile-allow.json` 仍为空 |

桌面轮次第一次运行抓到 3 处 1280 宽度的溢出（设置 → 安装密钥 207px、Agent Network 配置 220px、
云计费 40px），根因都是垂直 tab 布局里内容项 `min-width: auto` 被表格或不换行按钮撑开；
`fix(theme): let flex row items with tables shrink` 一条规则修复后复跑归零。

### P1a 外壳（2026-10-18）

| 项 | 状态 | 说明 |
| --- | --- | --- |
| `@/layouts/*` 精确别名 spike | 通过 | tsc、vitest、Storybook（Vite）、`next build`（Turbopack）都以精确别名优先于 `@/*`，机制与 `@components/table/Table` 相同 |
| AppShell | 完成 | `src/theme/shell/`：深色侧栏（240 / 56px 轨道，桌面持久化、平板默认折叠、折叠态分组弹出层、底部折叠按钮）、48px 顶栏（面包屑 / 页面名 + 帮助 + 用户）、PageHeaderBar、手机 AppBar（同一组件，CSS 切换）、over 抽屉、BottomBar；flex + `100dvh`，无 framer |
| 替换与守卫 | 完成 | `DashboardLayout` / `Header` / `PageContainer` / `SidebarItem` 走别名；`check-selectors` 新增 `@replaces-file`（整文件 sha256 pin），上游改动即报；`SidebarItem.contract.ts` 锁 props；上游 `SidebarItem.test` 直接跑在 adapter 上 |
| 页头槽位 | 完成 | `usePageHeader()` 外部 store（只通知可见字段变化、handler 不过期）；桌面：面包屑进顶栏、标题 / 数量 / 帮助 / 操作进页头栏；手机：标题进 AppBar、主操作进底栏 |
| 首个迁移页 | 完成 | Peers：去掉页内头部块（面包屑 / h1 / 营销段落），注册 title / count / breadcrumb / help；主操作（Add Peer）仍在工具栏，随 P2 的 Toolbar 一起上提 |
| Stories 与截图工具 | 完成 | `Theme/Shell` 9 个 story（1440 / 1024 / 390，折叠、弹出层、抽屉、带操作）；`capture.mjs` 支持 `vp-<width>` 标签按宽度截图 |
| i18n | 完成 | `nav` 命名空间新增 `shell.label.*` 六个键（en + zh-CN） |
| 证据截图 | 完成 | `evidence/2026-10-18-shell/`：1440 浅 / 暗、折叠 + 分组弹出层、1024 平板、390 手机、抽屉、底部操作栏 |

P1a 验收（2026-10-18，本机全量运行）：

| 检查 | 结果 |
| --- | --- |
| `check-selectors` | 117 个 `@depends` token、147 个属性选择器、236 条规则、1 个替换组件 + 5 个 pin 文件、11 个 touch point 全部通过 |
| `npx tsc --noEmit` | 0 错误（含 `SidebarItem.contract.ts`） |
| `npx vitest run` | 88 个文件 / 999 个测试通过（含上游 `SidebarItem.test` 跑在 adapter 上、页头 store 4 个） |
| changed-files `eslint`、prettier | 无新增错误或告警 |
| `npm run i18n:check` | 139 个命名空间、0 错误 |
| `npm run build` | 通过；postbuild 743 个 .gz、IMMUTABLE OK（1944 个文件）；产物里含外壳（别名在 Turbopack 下生效） |
| `mobile-guard`（375 / 390 / 768 浅色，390 暗色，360 详情页浅 + 暗，1280 / 1440 浅色） | 549 个 page story × 8 轮：横向溢出 0，布局问题 0 |

守卫第一次跑抓到 5 个 story 在 768 / 1280 / 1440 下横向溢出正好一个侧栏宽度（56 / 240px）：
重定向页和套餐页渲染的 `FullScreenLoading` 是 `w-screen`（100vw），在上游的固定侧栏旁没问题，
在外壳的主列里就多出一个侧栏。`fix(shell): viewport-wide children of the main column are sized to the column`
一条规则修复后复跑归零。

**P1a 留下的事项（进 P1b / P2）**
- 顶栏全局搜索入口、Breadcrumbs adapter（未迁移页面的面包屑仍在页内）。
- Button / Input / Select / Tag / Tabs adapters；工具栏 container query 收纳（1440 下 Peers 工具栏仍换行）。
- 手机端 AppBar 不显示数量；DataTable 的「N of M」过滤计数随表格 adapter 进槽位。
- 折叠态的标签提示用的是原生 `title`，P1b 换成 Tooltip。

**P0 留下的已知事项**
- `--ant-control-height` 等旧 token 仍是独立数值，P1 在 Button / Input / Table adapters 落地时改为引用 `--ctl-h` 等密度 token。
- 1440 下 Peers 工具栏换行后第二行只有「刷新」和「Add Peer」，视觉上偏松；P1 的 `Toolbar`（container query 收纳次要项）解决。
- 上游 `README.md` 的本地开发说明与 `.storybook/visual-regression/README.md` 的 `config.json` 描述已过期（运行时配置改造遗留），与本计划无关，另行处理。

---

## 附录 A：Peers 列表在三种模式下的目标线框

```
full 1440（侧栏 240 展开）
┌ Header ──────────────────────────────────────────────────────────────┐
│ ▣ netbird   Peers                           搜索 ⌘K    ?   👤 Olivia │
├ Sider ───┬ Content ─────────────────────────────────────────────────┤
│ ■ 控制中心 │ Peers  13  ⓘ                                 [+ 添加设备] │
│ ■ 设备    │ ┌───────────────────────────────────────────────────────┐ │
│ ■ 访问控制 ▾│ │ 🔍 搜索…   [筛选 ▾] [用户设备|服务器] [不合规 1] [⟳] [⋯] │ │
│   策略    │ ├───────────────────────────────────────────────────────┤ │
│   组      │ │ □ 名称            地址          组      最近在线  版本  ⋮│ │
│   合规检查 │ │ □ ● router-berlin 100.92.1.1   2 组    刚刚    0.59.2 ⋮│ │ 48px
│ ■ 网络路由 ▾│ │ □ ● k8s-node…     100.92.12.5  3 组    刚刚    0.60.0 ⋮│ │
│ …        │ │ …（12–14 行可见）                                      │ │
│          │ ├───────────────────────────────────────────────────────┤ │
│ v0.60.0  │ │ 共 13 条                      ‹ 1 ›   25 条/页          │ │
└──────────┴─┴───────────────────────────────────────────────────────┴─┘

phone 390
┌──────────────────────┐
│ ☰  设备 (13)      🔍 ⋯ │ AppBar
├──────────────────────┤
│ [筛选 ▾] [排序 ▾] 不合规 1│ 一行工具栏，横向可滚
├──────────────────────┤
│ □ ● router-berlin   ⋮│
│   100.92.1.1          │
│   组 2 组 · 刚刚 · 0.59.2│  卡片：title / subtitle / 3 个 field
├──────────────────────┤
│ □ ● k8s-node-eu-…   ⋮│
│ …                    │
├──────────────────────┤
│ [      + 添加设备     ] │ BottomBar（safe-area）
└──────────────────────┘
```

## 附录 B：token 清单草案（新增部分）

- 字体：`--font-family`（Inter + CJK 栈）、`--font-family-code`、
  `--font-size-xs/sm/base/lg/xl`（12/14/16/20/24）、`--line-height`、
  `--font-weight-strong: 600`。
- 密度（随模式）：`--ctl-h`、`--ctl-h-lg`、`--ctl-font`、`--cell-py`、`--cell-px`、
  `--page-px`、`--page-py`、`--section-gap`。
- 语义色补全：`--ant-color-info*`、`--ant-color-link*`、`--ant-color-fill-tertiary/quaternary`、
  `--ant-color-bg-elevated`、`--ant-color-bg-spotlight`、`--ant-color-split`、
  `--ant-color-icon`、`--ant-color-icon-hover`。
- 组件 token：`--sider-bg`、`--sider-fg`、`--sider-active-bg`、`--header-bg`、
  `--table-header-bg`、`--table-row-hover-bg`、`--table-row-selected-bg`、
  `--tag-*`（按状态）、`--sheet-header-h`、`--bottombar-h`。
- 动效：`--motion-fast: 120ms`、`--motion-base: 200ms`、`--ease-out`。
- 层级：`--z-header: 100`、`--z-sider: 110`、`--z-drawer: 1000`、`--z-modal: 1100`、
  `--z-toast: 1200`。
- 断点（TS 为源）：phone 767.98 / compact 1279.98 / wide 1599.98。

## 附录 C：adapter 清单

| 上游组件 | 处理 | 阶段 |
| --- | --- | --- |
| `layouts/DashboardLayout`、`Header`、`Navigation`、`PageContainer` | 重写（Shell） | P1 |
| `components/Button` | 包裹：映射到 AntD 的 primary / default / text / link / danger 五种，size sm / md | P1 |
| `components/Input`、`Textarea`、`Select`、`DropdownInput` | 包裹：高度 / 字号跟密度 token；phone Select 底部面板 | P1 / P2 |
| `components/Badge`、`ui/SmallBadge` | 包裹 → Tag（状态色四档 + 中性） | P1 |
| `components/Tabs`、`VerticalTabs`、`SegmentedTabs` | 包裹：下划线 tab / 卡片 tab；VerticalTabs phone 列表模式 | P1 / P3 |
| `components/Breadcrumbs` | 包裹：写入 PageHeader slot | P1 |
| `components/modal/Modal` | 重写：Modal / Sheet 分支，history 集成 | P2 |
| `components/table/Table`、`DataTable`、`DataTablePagination` | 升级：column meta、粘列、密度、卡片、空态 | P2 |
| `components/Card`、`CardTable`、`SettingCard`、`FeatureCard` | 重写 → Descriptions / SettingRow / FeatureCard | P3 |
| `components/ui/FullScreenLoading`、skeletons | 包裹：token 化 | P1 |
| `components/Tooltip`、`Popover`、`DropdownMenu`、`Command` | 仅 CSS（浮层阴影 / 圆角 / 宽度上限） | P1 |
| Control Center（React Flow） | 仅 CSS + phone 只读 | P4 |
