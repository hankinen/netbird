# Control Center Graph 层 G0 / G1 / G2-外壳 证据（2026-10-18）

分支 `ui-optimization`，Storybook 静态构建，`Pages/Core/ControlCenter` 与 `Theme/Graph` 的
story，1440×960 由 `.storybook/visual-regression/scripts/capture.mjs` 截图，390 / 1024 由
`../2026-10-18-control-center-audit/measure-canvas.mjs` 同款脚本截图。对照"之前"见
`../2026-10-18-control-center-audit/`。

## 截图

| 文件 | 内容 |
| --- | --- |
| `peers-1440-light.png` / `peers-1440-dark.png` | Peer 视图：页头（标题 + Live / Draft）、画布工具行、节点卡、胶囊、箭头边 |
| `groups-1440-light.png`、`users-1440-light.png` | Group、User 视图（User 视图处于 LOD 1：隐藏辅文，无名胶囊保留协议 tag） |
| `networks-1440-light.png` / `networks-1440-dark.png` | Networks 视图：框架、等宽行、路由设备条（上游组件，未换） |
| `draft-1440-light.png`、`draft-add-menu-1440-light.png` | Draft：Cancel / Review & Deploy 在页头，dock 在底部，组件面板（上游） |
| `node-context-menu-1440-light.png` | 策略节点右键菜单 |
| `graph-*.png` | Graph 原语 story：节点卡（种类 / 状态 / 变体）、胶囊、框架、边 tone、dock 与分段控件 |
| `peers-390-light.png`、`draft-390-light.png`、`networks-1024-light.png` | 手机（LOD 2，只读）与平板 |

## 数字（`npm run theme:graph-legibility`，默认 fit 后屏幕上的最小文字）

| 视图 | 之前 1440 | 现在 1440 | 现在 1280 | 缩放 1440 / 1280 |
| --- | --- | --- | --- | --- |
| Peers | 8.3px | **12.0px** | 10.9px | 0.80 / 0.73 |
| Groups | 8.3px | **12.0px** | 10.9px | 0.80 / 0.73 |
| Users | 5.9px | 8.9px | 7.7px | 0.59 / 0.51 |
| Networks | 5.6px | 8.0px | 7.0px | 0.54 / 0.46 |
| Draft | 6.8px | 9.3px | 9.3px | 0.62 / 0.62 |

被外壳遮住的节点：全部为 0（之前 Draft 视图 1）。低于 12px 的 16 项记录在
`scripts/theme/graph-legibility-allow.json`，只允许变好；过线依赖下一阶段的
`layout/columns.ts`（列距按实测宽度、重心排序、等宽框架）。

## 守卫

| 检查 | 结果 |
| --- | --- |
| `npx tsc --noEmit` | 0 错误 |
| `npx vitest run` | 92 个文件 / 1018 个测试通过 |
| `theme:check-selectors` | 109 `@depends`、384 条规则、31 个 `@replaces-file`、13 个 touch point |
| `theme:mobile-guard`（9 个 story × 8 轮） | 横向溢出 0，布局问题 0 |
| `i18n:check` | 140 个命名空间、0 错误 |
| `npm run build` | 通过；postbuild 743 个 .gz，IMMUTABLE OK（1945 个文件），graph.css 与 adapter 在产物中 |
| e2e（13 个 control-center spec） | **未运行**：需要 Docker 测试环境 |
