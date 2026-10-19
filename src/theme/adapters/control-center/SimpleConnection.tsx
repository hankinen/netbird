"use client";

import { getSimpleBezierPath } from "@xyflow/react";
import * as React from "react";
import { useSourceGroupEnabled } from "@/modules/control-center/utils/helpers";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphEdge, useGraphEdgeEmphasis } from "@/theme/graph";
import { SimpleConnection as UpstreamSimpleConnection } from "../../../modules/control-center/edges/SimpleConnection";

/**
 * Membership edge (user → peer, group → member), replacing
 * src/modules/control-center/edges/SimpleConnection.tsx through its alias:
 * a plain hairline with no arrowhead, since it is not a direction of traffic.
 * @replaces-file src/modules/control-center/edges/SimpleConnection.tsx sha256:ee063cbe74854837
 */
export * from "../../../modules/control-center/edges/SimpleConnection";

type Props = Parameters<typeof UpstreamSimpleConnection>[0];

export const SimpleConnection = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedSimpleConnection {...props} />
  ) : (
    <UpstreamSimpleConnection {...props} />
  );

function ThemedSimpleConnection({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  source,
  target,
}: Props) {
  const [path] = getSimpleBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  // The edge's own flag wins: some views (users) set enabled on the EDGE while
  // their source node carries none, and the node lookup would default to false.
  const nodeEnabled = useSourceGroupEnabled(source);
  const enabled = Boolean(
    (data?.enabled as boolean | undefined) ?? nodeEnabled,
  );
  const emphasis = useGraphEdgeEmphasis(source, target);
  return (
    <GraphEdge
      id={id}
      path={path}
      direction={"none"}
      enabled={enabled}
      emphasis={emphasis}
    />
  );
}
