"use client";

import { getSimpleBezierPath, useConnection } from "@xyflow/react";
import * as React from "react";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { ConnectionLine as UpstreamConnectionLine } from "../../../modules/control-center/edges/ConnectionLine";

/**
 * The line drawn while a connection is dragged, replacing
 * src/modules/control-center/edges/ConnectionLine.tsx through its alias
 * (upstream's is white, invisible on a light canvas).
 * @replaces-file src/modules/control-center/edges/ConnectionLine.tsx sha256:c54d3fdf2475284a
 */
export * from "../../../modules/control-center/edges/ConnectionLine";

type Props = Parameters<typeof UpstreamConnectionLine>[0];

export const ConnectionLine = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedConnectionLine {...props} />
  ) : (
    <UpstreamConnectionLine {...props} />
  );

function ThemedConnectionLine({ fromX, fromY, toX, toY }: Props) {
  const { fromHandle, toHandle } = useConnection();
  const [path] = getSimpleBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromHandle?.position,
    targetX: toX,
    targetY: toY,
    targetPosition: toHandle?.position,
  });
  if (!fromHandle?.id) return null;
  return (
    <g style={{ pointerEvents: "none" }}>
      <path className={"nb-graph-connection"} d={path} />
    </g>
  );
}
