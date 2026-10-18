"use client";

import { getSimpleBezierPath } from "@xyflow/react";
import * as React from "react";
import { useEdgeNodeRect } from "@/modules/control-center/utils/edge-helper";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphEdge, resolveAnchors, useGraphEdgeEmphasis } from "@/theme/graph";
import UpstreamAnimatedLine from "../../../modules/control-center/edges/AnimatedLine";

/**
 * Labelled floating edge ("floating-straight"), replacing
 * src/modules/control-center/edges/AnimatedLine.tsx through its alias.
 * @replaces-file src/modules/control-center/edges/AnimatedLine.tsx sha256:d5d5bbfc09adc8e3
 */
export * from "../../../modules/control-center/edges/AnimatedLine";

type Props = Parameters<typeof UpstreamAnimatedLine>[0];

export default function AnimatedLine(props: Props) {
  return ANTD_THEME_ENABLED ? (
    <ThemedAnimatedLine {...props} />
  ) : (
    <UpstreamAnimatedLine {...props} />
  );
}

function ThemedAnimatedLine({ id, source, target, data }: Props) {
  const sourceRect = useEdgeNodeRect(source);
  const targetRect = useEdgeNodeRect(target);
  const emphasis = useGraphEdgeEmphasis(source, target);
  if (!sourceRect || !targetRect) return null;

  // Anchor each end to the side facing the other.
  const a = resolveAnchors(sourceRect, targetRect);
  const [path, labelX, labelY] = getSimpleBezierPath({
    sourceX: a.sx,
    sourceY: a.sy,
    sourcePosition: a.sourcePosition,
    targetX: a.tx,
    targetY: a.ty,
    targetPosition: a.targetPosition,
  });
  const label = data?.label || "";
  return (
    <GraphEdge
      id={id}
      path={path}
      direction={"forward"}
      emphasis={emphasis}
      label={label ? { x: labelX, y: labelY, text: label } : undefined}
    />
  );
}
