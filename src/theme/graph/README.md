# Graph layer (`src/theme/graph`)

Product-agnostic primitives for a canvas built on `@xyflow/react`, styled
from their own tokens in both colour modes. The Control Center renders them
through the adapters in `src/theme/adapters/control-center/`; a second graph
page (a policy preview, a peer's connections) starts from the same files.
Plan and decisions: `docs/plans/2026-10-18-control-center-ui-and-graph-architecture.md`.

## Rules

- **Nothing in here imports from `src/modules`.** A primitive knows nodes,
  edges, states and tokens, never peers, policies or drafts. The adapter is
  the only place that knows both sides.
- **State is a data attribute, never a class combination.** `data-selected`,
  `data-drop-target`, `data-connect-target`, `data-disabled`, `data-draft`,
  `data-deleting`, `data-warning` on the primitive's root; `graph.css` gives
  every primitive the same look for the same state.
- **Colours and sizes come from `tokens.graph.css` only.** Light values map
  onto the AntD alias tokens, dark values keep upstream's palette (decision 4
  of the UI architecture, until P5). No Tailwind colour class, no literal.
- **Sizes are flow units.** The control-center fits its views at a zoom of
  about 0.8 on a laptop, so the type scale is 1.25× the screen size it must
  land at (title 16px → 12.8px, meta 15px → 12px). `scripts/theme/graph-legibility.mjs`
  measures the result and fails CI below 12px.
- **Performance rules of the canvas stay** (`src/modules/control-center/CLAUDE.md`):
  nodes never subscribe to the whole store, hover goes through the external
  `graphHover` store (an edge re-renders only when its own endpoint flips),
  level of detail is one attribute on `.react-flow` written by `GraphLodSync`.

## Files

| File | What |
| --- | --- |
| `tokens.graph.css` | `--graph-*` tokens: type scale, geometry, light block, dark block |
| `graph.css` | every rule of the layer, scoped `:root.theme-antd`, ≤ 3 compounds, BEM classes `nb-graph-*` |
| `GraphNodeCard` | entity node: icon tile (`data-kind` colours), title, meta, trailing, floating action; variants `card` / `plain` / `row` |
| `GraphPill` | relationship node: status dot, name, tag (protocol and ports) |
| `GraphFrame` | container node: 72px header (the frame layout reserves it), `controls` slot above, body for the rows |
| `GraphTag`, `GraphDot` | small label and 8px status dot |
| `GraphEdge`, `GraphDefs` | the one edge: hairline, arrowhead markers per tone, dashed when disabled, flowing dash on hover; `GraphDefs` mounts the markers once |
| `edges.ts` | pure anchor resolution (fixed policy sides) and tone selection |
| `hover.ts` | hover store, `useGraphEdgeEmphasis`, `hoverHandlers` |
| `lod.ts` | zoom thresholds and `GraphLodSync` |
| `colorMode.ts` | `useGraphColorMode` (canvas follows the dashboard theme in the AntD build, "dark" otherwise) and the `<Background>` props |
| `GraphDock*` | bottom tool strip and its button / group / divider |
| `GraphSegmented` | segmented control (tablist) of the chrome row |
| `GraphLegend`, `EdgeSwatch` | legend rows drawn with the real edge classes |
| `Graph.stories.tsx` | every primitive, every state, both colour modes |

## Level of detail

| zoom | shown |
| --- | --- |
| ≥ 0.6 | everything |
| 0.35 – 0.6 | tiles, titles, status dots; meta lines, tags and pill tags hidden |
| < 0.35 | tiles and dots only |

## Adding a graph page

1. Render your nodes with `GraphNodeCard` / `GraphPill` / `GraphFrame` and
   your edges with `GraphEdge` (anchors from `resolveAnchors`, path from
   React Flow's path helpers). Give every root a `nodeId` so hover works.
2. Mount `<GraphDefs />` and `<GraphLodSync />` once inside the
   `ReactFlowProvider`.
3. Pass `colorMode={useGraphColorMode()}` and `<Background {...GRAPH_BACKGROUND} />`
   to `<ReactFlow>`.
4. Put the chrome in a `.nb-graph-chrome` row above the canvas (the page
   container lays the two out as a column) or in the shell's page header slot
   (`usePageHeaderSlot` + a portal); floating elements are the dock
   (`GraphDock`) at the bottom and a `.nb-graph-status` pill at the top.
5. Add the page to `scripts/theme/graph-legibility.mjs` (`--filter`) so the
   12px gate covers it.

## Replacing an upstream canvas file

The control-center adapters are the pattern: one file per upstream file,
`export * from` the upstream module (its types and helpers stay importable),
a component of the same name that renders the graph primitives when
`ANTD_THEME_ENABLED` and the upstream component otherwise, props typed as
`Parameters<typeof Upstream>[0]`, an `@replaces-file … sha256:` pin that
`theme:check-selectors` verifies, a line in `control-center.contract.ts`,
and an exact alias in `tsconfig.json` placed before `@/*`. Keep every
`data-testid`, handle id and `cc-*` class hook the e2e suites and the focus
mode use.
