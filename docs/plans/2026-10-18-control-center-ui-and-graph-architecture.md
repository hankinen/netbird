# Control Center：企业级画布 UI 与可复用 Graph 组件架构

日期 2026-10-18。基线提交 `6caacab`（外壳 P1a 之后；这 14 个提交当时还在 `claude/dreamy-goldberg-e181eu` 上，未合入 `dev`），工作分支 `ui-optimization`。
证据截图与数字在 `docs/plans/evidence/2026-10-18-control-center-audit/`。
状态：**审查完成，方案待店主决策（第 8 节）**，未动代码。

本文承接 `2026-10-17-enterprise-ui-architecture.md`（下称"架构文档"）：那份文档
把 Control Center 放在 P4、"仅 CSS + 手机只读"。本文把它单独拿出来，原因见第 0 节。
技术词保留英文，行文中文。

---

## 0. 一句话结论

Control Center 的"丑"和"乱"不是配色问题，是三件事叠在一起：**画布没有自己的
设计契约**（节点、边、外壳各写各的，颜色和字号是写死的暗色值，浅色主题是用属性
选择器隔着内联样式硬翻过来的）、**可读性没有被当作约束**（默认缩放下策略文字
5.6–8.3px，组名 7.5–11.2px，远低于 12px 的企业后台下限）、**没有 Graph 层**
（`@xyflow/react` 只在这一个模块里用，16 种节点类型对应 11 个各自为政的组件，
没有任何可复用的画布原语）。这个模块 4.5 万行、100% 上游代码、上游还在活跃开发
Draft（Beta），所以**不能靠 CSS 再贴一层，也不能把模块 fork 出来改**。长期受益
最大的路线是：**建一个产品无关的 Graph 组件层（`src/theme/graph/`），再用仓库
已有的"精确别名 + contract + `@replaces` 哈希"机制，把上游的节点、边、画布外壳
逐个换成基于这层的实现**。上游的数据流、changeset、deploy 逻辑一行不动，e2e 的
62 个 `data-testid` 全部保留；画布的外观、可读性、布局、外壳从此是我们的，以后
任何需要图的页面（拓扑、策略依赖、连接关系）直接复用。

---

## 1. 目标与非目标

**目标**

1. PC（≥1280）上 Control Center 达到一线企业级拓扑编辑器的水准：第一眼能读懂
   "谁 → 通过什么策略 → 到哪里"，默认缩放下所有文字 ≥ 12px，边不打架，外壳是
   系统的一部分而不是漂在画布上的几块卡片。
2. 画布成为**可复用的 Graph 能力**：节点卡、胶囊、容器框架、边、把手、工具条、
   图例、检查器抽屉、布局策略，都是独立于 Control Center 业务的组件，有 story、
   有测试、有 token，第二个图页面接进来不用再写一遍。
3. 浅色 / 暗色两套完整外观，都从 token 渲染，不再有"暗色写死 + 浅色硬翻"。
4. 上游合并代价可控：不 fork 模块，所有替换都走别名 + contract + 哈希 pin，
   上游一改签名就报错，同步流程不变。
5. 手机 / 平板按架构文档的三种模式契约：phone 只读可看、compact 完整可用。
6. 中文一等公民：所有新文案走 `t()`，CJK 行高和字重在节点里也成立。

**非目标**

- 不改 Draft 的业务语义（changeset、deploy 顺序、group deletion 级联、placeholder
  peer 流程）。那是 `control-center/CLAUDE.md` 里几千字的 hard-won 规则，全部保留。
- 不换图引擎。继续 `@xyflow/react` v12；不引入 antd、不引入新的画布库。
- 不在本阶段做手机上的 Draft 编辑（架构文档的非目标，维持）。
- 不做"第二个图页面"本身；只保证 Graph 层能承接它（第 5.6 节给一个最小验证）。

---

## 2. 现状审查

### 2.1 视觉与交互问题（按影响排序，证据见 evidence 目录）

| # | 问题 | 证据 | 影响 |
| --- | --- | --- | --- |
| 1 | **默认缩放下文字不可读。** `fitView` 把整张图塞进视口（`maxZoom 0.8`），策略胶囊的端口文字是 `0.65rem` 等宽字 × 缩放：Peers 视图 8.3px，Users 5.9px，Networks 5.6px；组名 7.5–11.2px | `README.md` 数字表；`networks-1440-light.png` | 图的核心信息（端口、协议、名字）要放大才能看；节点是按"卡片"尺寸设计再整体缩小的 |
| 2 | **边是噪音而不是信息。** 全部边都是 `5,5` 虚线 + 永动的 dash 动画（`cc-animated-edge`），单向 `#0ea5e9` 蓝、双向 `#0e9f6e` 绿两条偏移曲线，没有图例；Users / Draft 视图 28–38 条边互相交叉 | `users-1440-light.png`、`draft-1440-light.png` | 第一眼是"一团线"；双向被画成双线读作两条策略；动画常驻分散注意力 |
| 3 | **布局是三根固定柱子。** 源 x=0、策略 x=500、目标 x=1000，与视口和节点尺寸无关：1200 宽的画布只用到 1091×374–534（Groups 视图竖向只占 41%）；Networks 的框架按"交错网格"摆放，宽度随内容变，上方各漂一条"1 Routing Peer ▾ / Add"小工具条 | `groups-1440-light.png`、`networks-1440-light.png` | 大片留白与局部拥挤并存；Networks 视图最"乱" |
| 4 | **外壳不是外壳。** 视图切换（Peer / User / Group / Networks）、网络选择器、Live / Draft 开关、Draft 的 Cancel / Review & Deploy、Focus 胶囊、底部工具条、右下角 Feedback 按钮，全是 `absolute` 漂在画布上的独立卡片；没有页面标题、数量、帮助；没有接入外壳的 `usePageHeader()` 槽位（Peers 页已经接了） | 所有 1440 截图 | 和其它页面不是一个系统；Draft 模式下顶部按钮压住第一张目标卡片（`draft-1440-light.png`，`nodesUnderHeader = 1`） |
| 5 | **浅色主题是"翻译"出来的。** `page.tsx` 写死 `colorMode="dark"` 和 `<Background bgColor="#181a1d">`；节点 343 处 `nb-gray-*`（18 个色阶）、17 处十六进制、边的颜色在内联 `style` 里。主题层只能用 `[style*="rgb(24, 26, 29)"]`、`[style*="rgb(63, 68, 75)"]` 这类选择器加 `!important` 盖回去 | `src/theme/css/vendors.css` 第 3–126 行 | 浅色下的每个颜色都是"对应关系"而不是"设计意图"：拖放目标的 `ring-white` 在白底上看不见，`ring-sky-500` 选中光环与 AntD 主色不一致 |
| 6 | **字号与间距没有阶梯。** 11 种任意字号（`text-[0.50rem]` … `text-[0.85rem]`、`text-[8px]` 的 Beta 徽标），23 处 `top-[0.05rem]` 一类像素微调，端口列表用等宽字 | 统计表 | 放大看每个节点都"差一点"，缩小看全部糊成一片 |
| 7 | **状态表达分散。** 选中 / 右键目标 / 面板打开 / 拖放目标 / 连接目标 / 禁用 / 新建 / 待删除，每个节点组件各自拼 class（`ring-2 ring-sky-500` ×9、`ring-white` ×11、`opacity-60`…），焦点模式的光环又写在 `globals.css` 里 | `nodes/*.tsx`、`src/app/globals.css` 235–270 行 | 同一状态在不同节点上看起来不一样；改一个状态要改 11 个文件 |
| 8 | **手机不可用，平板勉强。** 390 宽整图缩到约 0.25，什么都看不清；Draft 的底部工具条与 Feedback 按钮重叠；1024 宽可用但文字 5–7px | `peers-390-light.png`、`draft-390-light.png`、`networks-1024-light.png` | 架构文档说"P4 只保证可读、不溢出"：不溢出做到了，可读没有 |
| 9 | **可发现性差。** 焦点模式靠右键或 `F` 键；策略的编辑 / 禁用 / 删除只在右键菜单；没有画布内搜索（live）、没有缩放指示、没有 minimap、没有图例；快捷键只在 tooltip 里 | `node-context-menu-1440-light.png`、`ControlCenterHeader.tsx` | 企业用户的第一反应是"这个图能干什么" |
| 10 | **不属于自托管企业产品的元素。** 右下角常驻的 Feedback 按钮指向 Google 表单；"Beta" 徽标 8px | `header/ControlCenterHeader.tsx` `FeedbackButton` | 品牌与信任感 |

### 2.2 组件化与架构问题

| # | 问题 | 证据 |
| --- | --- | --- |
| A | **没有 Graph 层。** `@xyflow/react` 全仓库只有这一个模块在用；没有任何"节点卡 / 边 / 把手 / 工具条"级别的可复用原语。`elkjs` 和 `@dagrejs/dagre` 在依赖里但无人引用 | `grep` 结果：0 处模块外引用 |
| B | **11 个节点组件各写一套同样的状态机。** `PeerNode`（占位 / 真实两套 DOM）、`GroupNode`、`PolicyNode`、`ResourceNode`（框内行 / 独立卡两套）、`StandaloneResourceNode`、`ProviderNode`、`AgentPolicyNode`、`NetworkNode`、三个 `Select*Node`，每个都手拼 `relative rounded-lg border bg-nb-gray-940 … hover:… ring-…`，都各自订阅 `useConnection` / `useIsContextMenuTarget` / `useDestinationGroup` | `nodes/*.tsx`，13 个文件订阅 `useConnection` |
| C | **4 个边组件，3 个重复同一段锚点 + 贝塞尔逻辑**，颜色各自写死；`ConnectionLine` 用 `#fff`（浅色下不可见，靠 CSS 补） | `edges/*.tsx` |
| D | **画布样式散在三层。** `globals.css`（`cc-*` 全局规则）、`src/theme/css/vendors.css`（键在内联 style 上的覆盖）、模块内 Tailwind；没有一个 `--graph-*` token | 三处文件 |
| E | **布局是手写的、按节点类型字符串分桶的函数**（`applyD3HierarchicalLayout` 开头 12 个 `filter(n.type === …)`），列距是常量，不是可插拔的策略 | `utils/layouts.ts` |
| F | **表现组件知道业务。** `NetworkNode` 直接读 `useDraftChangeset()` 和 `useGroups()`；`PeerNode` 读 `useDraftMode()` 开模态框。节点无法脱离 11 层 Provider 单独渲染，也就无法有自己的 story | `nodes/NetworkNode.tsx`、`nodes/PeerNode.tsx` |
| G | **巨型文件。** `DraftChangesetContext.tsx` 2702 行、`ControlCenterComponentsPanel.tsx` 1935、`NodeContextMenu.tsx` 1579、`DestinationGroupPanel.tsx` 1541。这些是业务，本方案不碰，但它们决定了"外壳替换"必须在边界上做，不能在内部做 | 行数统计 |
| H | **测试是资产也是约束。** 纯逻辑单元测试很厚（changeset、cascade、connect、deploy 各 700–2200 行测试）；13 个 e2e spec 用 195 次 `getByTestId` 和少量 class 钩子（`.react-flow__node`、`.react-flow__pane`、`.cc-group-node`、`.cc-dimmed`）；story 只有 9 个。意味着：**只要保住 testid 和这四个 class，视觉层可以整个换掉而不碰一行业务测试** | `e2e/tests/control-center-*.spec.ts` |

### 2.3 根因

1. **这是上游的"功能原型"而不是设计过的产品面。** 上游把它标为 Beta，节点和
   外壳是随功能长出来的：先有 PeerNode，再复制成 GroupNode，再在里面加 if。
2. **仓库的主题机制在这里失效。** 主题层靠"键在上游类名上的 CSS"工作，而画布的
   颜色是内联 style 和 React Flow 的 `colorMode`，CSS 只能用 `[style*=…]` 硬翻。
   架构文档的 L2（adapters）还没有覆盖到画布。
3. **没有可读性契约。** 布局、`fitView`、字号三者没有任何一方对"屏幕上的最终
   像素"负责。

---

## 3. 三条路线

| 路线 | 做法 | 能解决 | 解决不了 | 上游合并 | 结论 |
| --- | --- | --- | --- | --- | --- |
| A 继续 CSS 覆盖 | 在 `vendors.css` 里加更多 `[style*=]` / `[class~=]` 规则 | 颜色、少量尺寸 | 可读性（缩放 / 布局）、边的形态、外壳结构、状态一致性、复用 | 最省 | 已到天花板，不推荐 |
| B fork 模块 | 把 `src/modules/control-center` 整体改成我们的 | 一切 | 4.5 万行、上游 Draft 仍在快速迭代，每次 sync 都是重做；违反仓库"dev 必须能干净 rebase 上游"的设计目标 | 最贵 | 不推荐 |
| **C Graph 层 + 边界替换** | 建 `src/theme/graph/`（产品无关的画布组件与 token），用精确别名把上游的节点 / 边 / 把手 / 外壳文件逐个换成 adapter；`page.tsx` 只做 3 行登记过的 `@theme` 编辑 | 可读性、边、状态、外壳、浅暗色、复用 | 布局引擎本身仍是上游的函数（第 5.5 节给出渐进替换方式） | 与现有 `Table` / `SidebarItem` / shell 同一机制，哈希 pin 报警 | **推荐** |

C 的关键判断：上游节点组件的 **props 契约是 React Flow 的 `Node<data, type>`**，
数据形状由 view hooks 决定、由 `.contract.ts` 锁住；节点内部怎么画是我们的自由。
上游改了 `data` 字段，`tsc` 在 contract 上报错；上游改了节点文件内容，`@replaces`
哈希在 `check-selectors` 报错。这正是 `SidebarItem` 已经走通的路。

---

## 4. 画布设计语言

参照物：AWS Application Composer / Azure 网络拓扑这类"企业资源图"，ThingsBoard
规则链编辑器（同为 AntD 系的画布 + 检查器布局），n8n（工具条和节点状态的克制），
以及架构文档第 3 节已定的 AntD 规范。不参照 Miro / Figma 式的自由白板感。

### 4.1 五条原则

1. **画布是工作区，外壳是系统的。** 页头、工具条、检查器在外壳的固定槽位里；
   允许漂在画布上的只有三样：底部居中的工具坞（Draft）、右下角的缩放 / minimap
   簇、顶部居中的瞬时状态胶囊（Focus、正在部署）。
2. **可读性是契约，不是结果。** 默认 fit 之后屏幕上最小文字 ≥ 12px（1280 及以上）。
   做法有三：节点按"紧凑行"设计（40–44px 高，一行标题 + 一行辅文）；列距由节点
   实测尺寸和视口推导；**语义缩放（LOD）**：缩放 < 0.6 只显示标题，< 0.4 只显示
   图标和颜色，文字不再变成蚂蚁。
3. **边表达关系，不表达情绪。** 默认 1.5px 实线 `colorTextQuaternary`，方向用
   箭头标记（双向 = 两端箭头），禁用 = 灰色虚线；流动动画只在 hover / 选中 /
   焦点路径上作为强调出现，静止时没有任何东西在动。端口 / 协议写在策略节点上，
   不写在边上。
4. **一种解剖，多种语义。** 所有实体节点同一个骨架：`[状态点 / 图标块 28px] [标题
   13px/600] [辅文 12px/secondary] [尾部徽标 / 计数]`。实体类型靠图标块的色系区分
   （设备中性、组蓝系、资源紫系、Provider 青系），不靠卡片形状。策略是胶囊：
   `[状态点][名称][协议 Tag]`。网络是容器框架：标题栏 + 等宽两列资源行。
5. **状态是枚举，不是 class 组合。** 节点只暴露 `data-state="selected|hover|
   drop-target|connect-target|focused|dimmed|disabled|draft|deleting|warning"`
   一类属性，样式由 Graph 层的 CSS 统一给，11 个节点组件不再各自拼 ring。

### 4.2 视觉规范要点

- **颜色**：全部来自 `tokens.graph.css`（第 5.3 节清单），浅暗各一份；映射到
  AntD alias token，不出现任何 `nb-gray-*` / 十六进制。
- **字号**：标题 13、辅文 12、胶囊 12、框架标题 13、框架行 12；LOD 之外不再有
  任何小于 12 的字号。端口列表用 `tabular-nums` 的常规字体，不用等宽字；超过
  3 项显示 `TCP 22, 443 +6` 并在 hover 展开。
- **尺寸**：实体节点 44px 高（phone 48）、宽 200–280 按内容；胶囊 28px 高；
  框架标题栏 36px、行 32px、两列、固定 320px 宽（内容多时框架变高不变宽）。
- **圆角 / 描边 / 阴影**：节点 6px，框架 8px；发丝线 `colorBorderSecondary`；
  阴影只给 hover（`boxShadowTertiary`）和浮层。
- **状态表**：

  | 状态 | 表现 |
  | --- | --- |
  | hover | 描边 `colorPrimaryBorder`，阴影 tertiary |
  | selected / 面板打开 | 2px `colorPrimary` 外环 |
  | drop-target | 虚线 `colorPrimary` 外环 + `colorPrimaryBg` 底 |
  | connect-target（拖线经过） | 同 drop-target，把手高亮 |
  | focused（焦点模式） | 外环 + 其余 `cc-dimmed` 到 35% |
  | disabled | 60% 不透明 + 状态点灰 |
  | draft（新建） | 虚线描边 + "草稿" Tag |
  | deleting | 红色状态点 + 标题删除线 |
  | warning（无网络 / 未安装） | 琥珀状态点 + 内联操作按钮 |

- **边**：实线 1.5px；hover 节点时其边与邻居提升为 `colorPrimary` 2px 并带流动
  动画，其余边 40%；同向多条边之间 6px 间距的扇形出入口（已有固定侧），不画双线；
  禁用虚线 `4 4` 灰。连接中的临时线用 `colorPrimary`。
- **外壳**（1440 线框）：

  ```
  ┌ Header ────────────────────────────────────────────────────────────────┐
  │ ▣ netbird   Control Center                            搜索 ⌘K  ?  👤   │
  ├ Sider ─┬ PageHeaderBar ─────────────────────────────────────────────────┤
  │        │ Control Center  14 设备 · 9 策略 · 3 网络  ⓘ        [● Live ▾] │
  │        ├ 画布工具条（一行，container query 收纳） ─────────────────────┤
  │        │ [设备|用户|组|网络]  [olivias-macbook-pro ▾]  🔍  │ 焦点  适配  图例 │
  │        ├──────────────────────────────────────┬─────────────────────────┤
  │        │                                      │ 检查器（360px，可收起） │
  │        │   画布（LOD、箭头边、紧凑节点）         │ 选中实体的概览 / 成员 /  │
  │        │                                      │ 策略 / 操作             │
  │        │                                      │                         │
  │        │                 [+ 添加] [▭ ✋] [↶ ↷] [排列]   ← Draft 时的工具坞 │
  │        │                                    [−  80%  +] [⛶] [▦] ← 右下簇 │
  └────────┴──────────────────────────────────────┴─────────────────────────┘
  ```

  - Live / Draft 是页头右侧的**主操作区**：Live 时一个分段控件；Draft 时变成
    `[放弃] [审阅并部署 (3)]` + 分段控件，不再和视图切换挤在同一条浮层里。
  - 视图切换、实体选择器、搜索、焦点、适配、图例在一条**画布工具条**里，是外壳
    的一行，不是画布上的卡片；compact 下次要项收进 ⋯。
  - **检查器抽屉**取代今天锚在节点旁的 `DestinationGroupPanel` / `PeerGroupsPanel`
    浮层：桌面右侧 360px，phone 底部 Sheet；内容复用现有面板组件（只换容器）。
  - 右下角簇：缩放百分比 + 适配 + minimap 开关（默认关）。
  - Focus 胶囊保留在顶部居中，作为瞬时状态；Feedback 按钮在 AntD 主题下隐藏
    （决策 4）。
- **动效**：200ms ease-out；相机 300ms；节点进出 150ms 淡入；遵循
  `prefers-reduced-motion`；静止态零动画。
- **暗色**：同一解剖，`tokens.graph.css` 的暗色块；不再是"把浅色翻译回暗色"。
- **zh-CN**：节点标题允许 CJK 换行到两行（`overflow-wrap: anywhere`，最多两行
  截断）；"N 设备, M 用户"这类计数文案走 `t()` 的 `countWord`。
- **可达性**：节点是 `button`，有 `aria-label`（"组 Developers，5 设备 3 用户"）；
  `nodesFocusable` + Tab / 方向键在邻居间移动；焦点环用 `--ant-focus-ring`；
  右键菜单的每一项同时出现在检查器的"操作"里，不再只有右键一条路。

### 4.3 手机与平板

- **phone（<768）**：只读。顶部 AppBar 标题 + 视图下拉；画布默认以"选中实体"为
  中心 fit 到 1.0 缩放并启用 LOD，可拖动；底部 Sheet 是检查器，列出该实体的策略
  和目标（表格形态，和 Peers 页的卡片一致）。Draft 入口隐藏并提示"请在桌面编辑"。
- **compact（768–1279）**：完整功能；检查器默认收起为图标栏；工具条收纳次要项；
  Draft 工具坞保留。

---

## 5. Graph 组件架构

### 5.1 分层与目录

```
src/theme/graph/                      ← "ours" 表面（与 shell 同级）
  tokens.graph.css                    ← --graph-* token，浅 / 暗两块
  graph.css                           ← 状态、LOD、边、把手、框架的全部样式（键在 data-* 上）
  GraphCanvas.tsx                     ← 包 <ReactFlow>：主题 colorMode、Background、
                                         chrome 槽位（toolbar / dock / corner / status）、LOD 上下文
  nodes/GraphNodeCard.tsx             ← 实体节点骨架（icon / title / meta / trailing / states）
  nodes/GraphPill.tsx                 ← 策略胶囊
  nodes/GraphFrame.tsx                ← 容器框架（标题栏 + 行网格 + "+N more"）
  nodes/GraphSelectNode.tsx           ← 带下拉的选择节点骨架
  edges/GraphEdge.tsx                 ← 唯一的边组件（direction / enabled / emphasis / label）
  edges/GraphConnectionLine.tsx
  handles/GraphHandle.tsx             ← 连接把手（出入口、hover 气泡）
  chrome/GraphToolbar.tsx             ← 一行工具条（container query 收纳）
  chrome/GraphDock.tsx                ← 底部工具坞
  chrome/GraphCorner.tsx              ← 缩放 / 适配 / minimap 簇
  chrome/GraphLegend.tsx
  chrome/GraphInspector.tsx           ← 右侧抽屉 / phone Sheet
  layout/columns.ts                   ← 列式布局策略（源 → 关系 → 目标），列距按实测尺寸
  layout/order.ts                     ← 重心排序减少交叉
  hooks/useGraphLod.ts, useGraphEmphasis.ts, useGraphKeyboard.ts
  README.md                           ← 契约、token、状态表、如何接一个新的图页面
src/theme/adapters/control-center/    ← 上游文件的替换件，一文件一 adapter
  PeerNode.tsx + PeerNode.contract.ts     @replaces src/modules/control-center/nodes/PeerNode.tsx sha256:…
  GroupNode.tsx + .contract.ts
  PolicyNode.tsx, ResourceNode.tsx, StandaloneResourceNode.tsx, ProviderNode.tsx,
  AgentPolicyNode.tsx, NetworkNode.tsx, ResourceGroupNode.tsx, MoreResourcesNode.tsx,
  SelectPeerNode.tsx, SelectGroupNode.tsx, SelectUserNode.tsx
  SmartEdge.tsx, SimpleConnection.tsx, AnimatedLine.tsx, DirectionIn.tsx, ConnectionLine.tsx
  ConnectHandle.tsx, AllHandles.tsx, FullAreaTargetHandle.tsx
  ControlCenterHeader.tsx, FlowSelector.tsx, DraftModeSwitcher.tsx, CanvasToolbar.tsx
  DestinationGroupPanel.tsx, PeerGroupsPanel.tsx（容器换成 GraphInspector，内容 re-export 上游）
```

依赖方向：`adapters/control-center/*` → `theme/graph/*` → `theme/tokens`。
Graph 层**不 import 任何 `src/modules/control-center` 的东西**（这是"产品无关"
的定义，用 eslint `no-restricted-imports` 守住）。adapter 是唯一知道两边的地方。

### 5.2 替换边界（哪些文件换、怎么换）

| 上游文件 | adapter 做什么 | 保留的契约 |
| --- | --- | --- |
| `nodes/*.tsx`（11 个） | 读上游的 `data`（contract 锁定形状），把业务状态（`useIsContextMenuTarget`、`useDestinationGroup`、`useConnection`、`useDraftMode` 的模态框 setter）**折算成 `data-state`**，渲染 `GraphNodeCard` / `GraphPill` / `GraphFrame` | `data-testid`（如 `cc-peer-install`、`cc-add-resource`）、class 钩子 `cc-group-node` / `cc-frame-row` / `cc-frame-row-icon` / `cc-unfocusable`、Handle 的 `id`（`sl` / `sr` / `tl` / `*-connect`，draft-connect 逻辑靠它们）、节点的实测尺寸语义（draft 复制 live 尺寸） |
| `edges/*.tsx`（4 个）+ `ConnectionLine` | 全部映射到 `GraphEdge` 的 variant（`smart` → direction 由 `isPolicyNodeId` 决定、`simple` → 无箭头、`floating-straight` → 带 label、`in`） | `useEdgeNodeRect` 订阅方式（性能规则）、`cc-animated-edge` 改为只在强调态加 |
| `handles/*.tsx` | `GraphHandle`，气泡样式 token 化 | handle id 生成规则 |
| `header/ControlCenterHeader.tsx` | 页头信息走 `usePageHeader()`（标题 / 计数 / 帮助 / 主操作区 = 模式开关与 Draft 操作）；视图切换 / 选择器 / Focus / 工具坞进 `GraphToolbar` / `GraphDock` / 顶部状态胶囊；Feedback 按钮按决策处理 | 全部 `cc-*` testid（`cc-flow-*`、`cc-mode-*`、`cc-draft-*`、`cc-network-back`、`cc-drill-back`、`cc-add-resource`） |
| `draft/CanvasToolbar.tsx`、`DraftModeSwitcher.tsx`、`FlowSelector.tsx` | 同上，逻辑（快捷键、arrange、discard）原样 re-export 或复用上游 hook | `cc-toolbar-*` testid、快捷键表 |
| `panels/DestinationGroupPanel.tsx`、`PeerGroupsPanel.tsx` | 只换容器（锚定浮层 → `GraphInspector`），`usePanelPlacement` 不再需要；内容组件 re-export | `groupPanelCloseGuard`、`MIN_PANEL_WIDTH` 等导出保留以免上游其它引用断掉 |
| `page.tsx` | **唯一的就地编辑**：`colorMode` 跟主题、`<Background>` 颜色走 token、`fitView` padding 加上外壳高度（3–5 行，`@theme` 注释 + `touch-points.txt`） | 其余 Provider 树与 `<ReactFlow>` props 不动 |
| `utils/layouts.ts`、`draft-build-layout.ts`、`drilled-layout.ts` | **第一阶段不换。** 列距常量通过 `DEFAULT_LAYOUT_CONFIG` 已经是参数，adapter 先用更紧凑的节点让同样的列距变得合理；第二阶段用别名把 `applyD3HierarchicalLayout` 换成 `layout/columns.ts`，并让上游的 `layouts` 单元测试跑在 adapter 上（`SidebarItem.test` 的做法） | 节点 `position` 的语义、`POLICY_COLUMN_Y_OFFSET` 等常量导出 |
| `globals.css` 的 `cc-*` 规则 | 迁入 `graph.css`，`globals.css` 对应段落删除（就地编辑，登记） | 选择器名保留（e2e 用 `.cc-dimmed`） |
| `vendors.css` 第 3–126 行 | 随 adapter 落地逐段删除；最终 React Flow 相关 `@depends` 归零 | — |

不换的：`contexts/`、`draft/DraftChangesetContext*`、`hooks/`、`utils/` 的纯逻辑、
`menus/`（右键菜单的样式已走 `DropdownMenu` 组件，跟着全局 adapter 走）、
`draft/modals/*`（走 Modal adapter）、`ControlCenterComponentsPanel`（第二阶段只换
它的外框为 `GraphInspector` 的一个 tab，列表项 re-export）。

### 5.3 Token 清单（`tokens.graph.css`）

```
--graph-bg                 画布底色            = --ant-color-bg-layout
--graph-grid               点阵                = --ant-color-border-secondary
--graph-node-bg / -border / -border-hover / -shadow-hover / -ring-selected / -ring-focus
--graph-node-title / -meta / -icon-bg（+ -peer / -group / -resource / -provider 四个色系）
--graph-pill-bg / -border / -dot-on / -dot-off / -tag-bg
--graph-frame-bg / -header-bg / -border / -row-hover
--graph-edge / -edge-emphasis / -edge-disabled / -edge-draft / -edge-width / -edge-width-emphasis
--graph-handle-bg / -handle-border / -handle-active
--graph-dim-opacity: .35      --graph-disabled-opacity: .6
--graph-lod-1: .6             --graph-lod-2: .4
--graph-dock-bg / -dock-border / -dock-shadow
--graph-inspector-w: 360px    --graph-inspector-w-compact: 320px
```

浅色块映射 AntD alias token；暗色块在 P5 之前沿用上游 nb-gray 值（架构决策 4），
P5 一起切 AntD 暗色 token。所有值只在这个文件出现一次。

### 5.4 公共 API 草案（以 `GraphNodeCard` 为例）

```tsx
<GraphNodeCard
  icon={<MonitorIcon />}           // 或 iconTile={{ kind: "peer", children: <OSLogo/> }}
  title="olivias-macbook-pro"
  meta="100.92.14.21"
  trailing={<Tag>Draft</Tag>}
  state={{ selected, hover, dropTarget, focused, dimmed, disabled, draft, deleting, warning }}
  lod={lod}                        // 来自 useGraphLod()，0 | 1 | 2
  handles="both" | "none" | "left" | "right"
  onAction={…}                     // warning 态的内联按钮
  testId="cc-peer-…"
  className                        // 只允许布局类，不允许颜色（eslint 规则同 AGENTS.md 第 5 条）
/>
```

`GraphEdge` 的 `data`：`{ direction: "forward" | "both" | "none", enabled, emphasis:
"none" | "hover" | "focus", label?, draft? }`。`GraphCanvas` 接 `chrome={{ toolbar,
dock, corner, status, inspector }}` 五个槽位，内部负责主题 `colorMode`、Background、
`fitView` 的 padding 计算（扣掉工具条与检查器）、LOD 上下文和键盘导航。

### 5.5 布局策略

第一阶段不换引擎，只让数据对：列距 `DEFAULT_LAYOUT_CONFIG` 保持，节点变紧凑后
同样的 fit 能落到更高的缩放（估算：Peers 视图节点高 64 → 44、宽 200–280 不变，
`maxZoom` 从 0.8 放开到 1.0，策略文字从 8.3px 到 ≥ 12px 需要 `policy.spacing`
60 → 44 和 LOD 配合，G1 以数字验收）。第二阶段 `layout/columns.ts`：

- 列距 = 该列最宽节点实测宽 + 间隙；行距 = 节点高 + 12；由 `GraphCanvas` 在
  节点测量后触发一次（上游已有"等测量再 fit"的机制）。
- 目标列用**重心排序**（按其源策略的平均 y）减少交叉；左右镜像的策略列保持。
- Networks：框架等宽 320px，按列对齐而不是交错网格；"routing peer"小工具条进框架
  标题栏；drill-down 布局复用同一策略。
- 不引入 ELK / dagre：列式布局是产品心智（源 → 策略 → 目标），确定性和性能更重要；
  两个未使用的依赖是否移除由上游决定，不在本方案里动 `package.json`。

### 5.6 复用的最小证明

G4 用 Graph 层做一个 **不进产品菜单** 的 story：`Theme/Graph/PolicyPreview`，渲染
"一个策略的源 → 策略 → 目标"三列小图（数据来自 fixtures），三种宽度 × 两种主题。
它证明 Graph 层不依赖 Control Center 的 Provider 树就能工作。将来策略详情页、
Peer 详情的"连接关系"、Networks 页的拓扑预览都从这里起步（是否做、何时做见决策 8）。

---

## 6. 分阶段路线图

每个阶段独立可合并（PR → CI → merge），视觉守卫基线前移。工作分支
`ui-optimization`，按阶段拆 PR 到 `dev`。

| 阶段 | 内容 | 验收 | 预估 |
| --- | --- | --- | --- |
| **G0 地基** | 决策定稿；`src/theme/graph/` 骨架：`tokens.graph.css`、`graph.css`、`GraphNodeCard` / `GraphPill` / `GraphFrame` / `GraphEdge` / `GraphHandle` / `GraphToolbar` / `GraphDock` / `GraphCorner` / `GraphLegend` / `GraphInspector`，每个带 story（390 / 1024 / 1440 × 浅暗）和单元测试；`page.tsx` 的 3 行 `@theme` 编辑（主题 colorMode、Background token、fit padding）；`globals.css` 的 `cc-*` 迁入 `graph.css`；**可读性守卫**脚本（evidence 目录的 `measure-canvas.mjs` 转正为 `scripts/theme/graph-legibility.mjs`，CI 对 Control Center 的 page story 在 1280 / 1440 浅暗断言最小字 ≥ 12px、被外壳遮住的节点 = 0）；eslint 规则：graph 层禁止 import 模块代码、adapter 的 `className` 禁止颜色类 | Graph 层 story 全绿；守卫脚本跑通并**先以当前数字为红线记录**（此时必然失败，作为基线） | 1 周 |
| **G1 节点与边** | 11 个节点 + 5 个边 + 3 个把手的 adapter，contract + `@replaces` 哈希；状态折算为 `data-state`；LOD；`vendors.css` 的 React Flow 覆盖删到 0 | 13 个 control-center e2e spec 通过（需 `npm run test:setup` 的 Docker 环境；CI 跑不了就本机跑并把结果写进本文第 11 节）；`npm run test:unit` 全绿；可读性守卫 Peers / Groups 视图 1440 ≥ 12px；视觉守卫两主题审阅；mobile-guard 8 轮 0 溢出 | 2 周 |
| **G2 外壳与布局** | `ControlCenterHeader` / `FlowSelector` / `DraftModeSwitcher` / `CanvasToolbar` adapter：页头槽位、画布工具条、工具坞、右下簇、图例、Focus 胶囊；检查器抽屉替换两个锚定面板；`layout/columns.ts` + 重心排序 + Networks 等宽框架，通过别名接管 `applyD3HierarchicalLayout`，上游 layout 测试跑在 adapter 上；minimap 开关；Feedback 按钮按决策 | 可读性守卫四个 live 视图 + Draft 全部 ≥ 12px、遮挡 = 0；`draft-*` e2e 全绿；Networks 视图截图经店主审阅 | 2 周 |
| **G3 手机与平板** | phone 只读模式（AppBar 视图下拉、以选中实体为中心 fit、LOD、底部 Sheet 检查器列表形态、Draft 入口隐藏）；compact 检查器图标栏、工具条收纳、工具坞 | mobile-guard 375 / 390 / 768 浅暗 0 溢出；390 下 Peers 视图选中实体的标题 ≥ 14px；e2e 增加 `phone` project 的一条只读流程（登录 → Control Center → 选设备 → 看到策略列表） | 1 周 |
| **G4 收尾与治理** | 暗色 token 校对、动效与 reduced-motion、骨架屏、键盘导航与 aria、`src/theme/graph/README.md`、`control-center/CLAUDE.md` 加一段"表现层在 adapters，规则见 graph README"、架构文档附录 C 的 Control Center 行更新为本文、`sync-upstream.sh` dry run 验证合并故事、`Theme/Graph/PolicyPreview` 复用证明 | 全部守卫绿；sync dry run 的冲突只出现在登记过的 touch point；a11y（axe）阻断级 0 | 1 周 |

合计约 7 周。G0 + G1 是价值最大的两步（可读性和节点一致性解决 2.1 的 #1、#5、#6、#7），
G2 解决 #2、#3、#4、#9、#10，G3 解决 #8。可与架构文档的 P2 / P3 并行（不同表面）。

---

## 7. 质量门禁

| 门禁 | 现状 | 本方案 |
| --- | --- | --- |
| 可读性 | 无 | **新增** `graph-legibility.mjs`：Control Center page story 在 1280 / 1440 × 浅暗，默认 fit 后最小有效字号 ≥ 12px、节点与外壳重叠 = 0；CI 阻断 |
| 选择器 / 契约 | `@depends` / `@replaces` / touch points | 不变；新增 15 个 contract 文件和 20 余个 `@replaces` 哈希；React Flow 相关 `@depends` 作为"下降指标"归零 |
| 视觉 | 两主题对上一已批准提交审阅 | 不变；Graph 层每个原语 6 张 story（3 宽 × 2 主题），Control Center 页 story 从 9 个扩到约 16 个（加检查器打开、焦点模式、phone、compact、LOD 两级） |
| 溢出 | mobile-guard 8 轮 | 不变，Control Center 的 phone / compact story 加入 |
| 单元 | 85 + 文件 | 新增：Graph 原语的状态 → `data-state` 映射、LOD 阈值、`columns` 布局（列距、重心排序）、`GraphCanvas` 的 fit padding 计算、adapter 的 props 透传 |
| e2e | 13 个 control-center spec（桌面 1920） | 必须全绿，是重构的安全网；G3 加 phone project 一条流程 |
| 可达性 | 无 | story 层 axe 阻断级：对比度、无名控件、焦点不可见；节点键盘可达 |
| 性能 | CLAUDE.md 的 2700 fiber 规则 | 保持：adapter 必须沿用 `useConnection` selector 形式、`useEdgeNodeRect`、identity-stable props；新增 story `ControlCenter/Stress` 200 节点 / 300 边，拖动 60fps 目测 + React Profiler 提交数不高于现状；Graph 层 ≤ 15KB gzip |
| 上游合并 | `sync-upstream.sh` dry run | 每阶段结束跑一次 `--quick`，冲突必须只落在 `page.tsx` 的登记行和 `globals.css` 的删除段 |

---

## 8. 需要店主决策的事项

| # | 问题 | 选项 | 推荐 | 结论 |
| --- | --- | --- | --- | --- |
| 1 | 路线 | A CSS 覆盖；B fork 模块；C Graph 层 + 边界替换 | **C** | |
| 2 | Graph 层位置 | `src/theme/graph/`（ours 表面，与 shell 同级）；`src/components/graph/`（上游命名空间） | **`src/theme/graph/`**：合并策略清楚（以我们为准），和 shell 一个待遇 | |
| 3 | 边的语义 | A 保留颜色区分单 / 双向；B 箭头表达方向、颜色只表达状态（禁用 / 焦点 / 草稿） | **B**：颜色留给状态，图例变简单，色弱可读 | |
| 4 | Feedback 按钮 | A 保留；B AntD 主题下隐藏；C 移入帮助菜单 | **B**：自托管企业产品不该常驻一个指向 Google 表单的按钮；上游构建不受影响 | |
| 5 | 实体面板形态 | A 保留锚定在节点旁的浮层；B 右侧检查器抽屉（phone 底部 Sheet） | **B**：位置固定、可收起、手机天然可用、右键菜单的操作有了第二入口 | |
| 6 | 语义缩放（LOD） | 开 / 关 | **开**：是"≥ 12px"承诺在大图上成立的唯一办法 | |
| 7 | 布局引擎 | A 保留上游列式布局，G2 渐进替换为 `columns.ts`；B 引入 ELK | **A**：列式是产品心智；ELK 增加包体和不确定性 | |
| 8 | 复用证明 | A 只做 story（`PolicyPreview`）；B 顺手上一个真实页面（Peer 详情的"连接关系"） | **A**，B 另立计划 | |
| 9 | minimap | 默认开 / 默认关可开 / 不做 | **默认关可开** | |
| 10 | 手机 Draft | 隐藏并提示；允许只读进入 Draft 看 changeset | **隐藏并提示**（架构文档非目标） | |
| 11 | 模式开关位置 | A 现状（浮层右上）；B 页头主操作区（Live / Draft 分段 + Draft 时的 放弃 / 审阅并部署） | **B** | |

决策后在此表填结论并注明日期；本文第 6 节的 G0 以此为起点。

---

## 9. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 上游 Draft 仍在快速改节点 `data` 字段 | contract 文件让 `tsc` 第一时间报错；adapter 只读 `data`，不改写；每阶段 sync dry run |
| 把手 id / 节点尺寸语义被 adapter 改动导致 draft-connect 逻辑失效 | 把手 id 规则和 `initialWidth/Height` 作为 contract 的一部分锁住；`draft-connect.test` 和 e2e `control-center-draft-connections` 是回归网 |
| 性能回退（2700 fiber 规则） | adapter 沿用 selector 订阅；`data-state` 用稳定对象；Stress story + Profiler 作为 G1 验收项 |
| 可读性守卫在 CI 的 Chromium 上数字与本机不同 | 守卫只断言阈值（≥ 12px、= 0 重叠），不断言精确值；字体用 Inter WOFF2 固定 |
| e2e 需要 Docker 环境，CI 没有 | 每个阶段本机跑全套 13 个 spec，结果写进本文第 11 节；没跑就不合并 |
| 检查器抽屉改变了 `usePanelPlacement` 的交互，e2e 用 testid 找面板 | 面板的 testid 和内容组件不变，只换容器；先跑 `control-center-live` / `-peers` spec |
| 同时进行的架构 P2（Table / Modal adapter）与本方案在 `tsconfig.json` 别名块冲突 | 别名按文件分行，各自 PR 只加自己的行；合并顺序无关 |

---

## 10. 与架构文档的关系

- 架构文档附录 C 的"Control Center（React Flow）| 仅 CSS + phone 只读 | P4"由本文
  取代；G4 时在那里改成"见 `2026-10-18-control-center-ui-and-graph-architecture.md`"。
- 本文沿用架构文档已定的全部决策（深色侧栏、AntD 蓝主色、页头文案 B、暗色 A 到
  P4、三种布局模式），不重新讨论。
- Graph 层属于架构文档四层模型的 **L2**（模板与适配器）的一个子系统，token 属于
  L0，外壳槽位使用 L1 的 `usePageHeader()`。

---

## 11. 执行记录

（按阶段追加：提交、守卫数字、e2e 结果、证据截图。）

### 审查（2026-10-18）

| 项 | 状态 | 证据 |
| --- | --- | --- |
| 代码审查 | 完成 | 第 2 节；统计见 evidence `README.md` |
| 截图 | 完成 | 1440 浅暗 × 9 story、390 × 3、1024 × 1 |
| 可读性测量 | 完成 | `measure-canvas.mjs`；数字见 evidence `README.md` |
| 方案 | 待决策 | 第 8 节 11 项 |
