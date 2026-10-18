"use client";

import {
  getSimpleBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from "@xyflow/react";
import * as React from "react";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphEdge, useGraphEdgeEmphasis } from "@/theme/graph";
import { DirectionIn as UpstreamDirectionIn } from "../../../modules/control-center/edges/DirectionIn";

/**
 * Inbound edge ("in"), replacing
 * src/modules/control-center/edges/DirectionIn.tsx through its alias.
 * @replaces-file src/modules/control-center/edges/DirectionIn.tsx sha256:83e69ed899179d0d
 */
export * from "../../../modules/control-center/edges/DirectionIn";

type Props = Parameters<typeof UpstreamDirectionIn>[0];

export const DirectionIn = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedDirectionIn {...props} />
  ) : (
    <UpstreamDirectionIn {...props} />
  );

function ThemedDirectionIn({
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
  const { enabled, type = "straight" } = data;
  const emphasis = useGraphEdgeEmphasis(source, target);
  const [path] =
    type === "straight"
      ? getStraightPath({ sourceX, sourceY, targetX, targetY })
      : type === "bezier"
      ? getSimpleBezierPath({
          sourceX: sourceX - 10,
          sourceY,
          sourcePosition,
          targetX: targetX + 10,
          targetY,
          targetPosition,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });
  return (
    <GraphEdge
      id={id}
      path={path}
      direction={"forward"}
      enabled={enabled}
      emphasis={emphasis}
    />
  );
}
