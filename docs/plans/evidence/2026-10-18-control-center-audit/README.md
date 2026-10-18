# Control Center 审查证据（2026-10-18）

基线提交 `6caacab`（外壳 P1a 之后，当时在 `claude/dreamy-goldberg-e181eu` 上，未合入 `dev`）。Storybook 静态构建，`Pages/Core/ControlCenter`
的 story，由 `.storybook/visual-regression/scripts/capture.mjs` 在 1440×960 截图，
手机 / 平板截图和下表的数字由本目录的 `measure-canvas.mjs` 读取 DOM 得到
（`node measure-canvas.mjs storybook-static`）。

## 截图

| 文件 | 内容 |
| --- | --- |
| `peers-1440-light.png` / `peers-1440-dark.png` | 实时模式 Peer 视图，浅色 / 暗色 |
| `groups-1440-light.png`、`users-1440-light.png` | Group、User 视图 |
| `networks-1440-light.png` / `networks-1440-dark.png` | Networks 视图（网络框架、浮动的路由节点小工具条） |
| `draft-1440-light.png` | Draft 模式（顶部 Cancel / Review & Deploy 压住第一张目标卡片） |
| `draft-add-menu-1440-light.png` | Draft 的组件面板 |
| `node-context-menu-1440-light.png` | 策略节点右键菜单 |
| `networks-1024-light.png` | 平板宽度（compact 模式） |
| `peers-390-light.png`、`networks-390-light.png`、`draft-390-light.png` | 手机宽度 |

## 数字

默认进入视图后 `fitView` 落定的缩放，以及该缩放下几类文字在屏幕上的**实际像素高度**
（CSS 字号 × 缩放）。企业后台可接受的下限是 12px。

| 视图（1440×960，浅色） | 缩放 | 节点 / 边 | 策略端口文字 | 策略名 | 组名 | 设备名 | 节点占用区域（画布 1200×912） | 被顶部浮层遮住的节点 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Peers | 0.80 | 17 / 19 | 8.3px | 10.2px | 11.2px | 10.9px | 1091×534 | 0 |
| Groups | 0.80 | 10 / 9 | 8.3px | 10.2px | 11.2px | 10.9px | 1091×374 | 0 |
| Users | 0.57 | 20 / 28 | 5.9px | 7.3px | 8.0px | 7.8px | 1092×381 | 0 |
| Networks | 0.54 | 18 / 8 | 5.6px | 6.9px | 7.5px | 7.3px | 1092×390 | 0 |
| Draft（从 Peers 进入） | 0.66 | 31 / 38 | 6.8px | 8.4px | 9.2px | 8.9px | 895×830 | 1 |
| Peers（暗色） | 0.80 | 17 / 19 | 8.3px | 10.2px | 11.2px | 10.9px | 1091×534 | 0 |

边的描边颜色（内联 style，主题层够不到）：`#0ea5e9`（单向）、`#0e9f6e`（双向）、
`#7d7d7d` / `#787878`（禁用 / 用户→设备）。手机 390 宽三张截图横向溢出均为 0px，
但整图缩放到约 0.25，文字完全不可读；Draft 模式下底部工具条与右下角 Feedback 按钮重叠。

## 代码统计（`src/modules/control-center`，全部为上游代码，fork 只加过 `t()`）

| 指标 | 数值 |
| --- | --- |
| 源文件 / 总行数 | 150 个文件 / 约 45,400 行（含测试） |
| `nb-gray-*` 颜色工具类使用次数 / 不同色阶 | 343 / 18 |
| TSX 中的十六进制颜色 | 17 |
| 任意字号 `text-[…]` 使用次数 / 不同值 | 44 / 11（0.50rem … 0.85rem、8px） |
| 像素微调 `top-[…]` | 23 |
| 选中光环 `ring-sky-500` / 拖放目标 `ring-white` 重复 | 9 / 11 |
| `!` 强制工具类 | 579 |
| `data-testid` | 62（e2e 的 13 个 control-center spec 共 195 次 `getByTestId`） |
| 注册的节点类型 / 节点组件 / 边组件 | 16 / 11 / 4 |
| `@xyflow/react` 在仓库其它地方的使用 | 0 |
| 主题层对画布的覆盖（`src/theme/css/vendors.css`） | 8 组规则，其中 2 组键在内联 style 的 rgb 字符串上、1 组键在 `stroke="#fff"` 属性上 |
