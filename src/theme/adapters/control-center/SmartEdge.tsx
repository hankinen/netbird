"use client";

import { getSimpleBezierPath } from "@xyflow/react";
import * as React from "react";
import { useEdgeNodeRect } from "@/modules/control-center/utils/edge-helper";
import { isPolicyNodeId } from "@/modules/control-center/utils/helpers";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphEdge, resolveAnchors, useGraphEdgeEmphasis } from "@/theme/graph";
import { SmartEdge as UpstreamSmartEdge } from "../../../modules/control-center/edges/SmartEdge";
import { isDraftId } from "./shared";

/**
 * Policy edge (source → policy → destination), replacing
 * src/modules/control-center/edges/SmartEdge.tsx through its alias. Same
 * value-equality rect subscriptions and fixed policy sides; a bidirectional
 * rule is one path with an arrowhead at both ends instead of two offset
 * curves.
 * @replaces-file src/modules/control-center/edges/SmartEdge.tsx sha256:e65d6f2f48af3fe4
 */
export * from "../../../modules/control-center/edges/SmartEdge";

type Props = Parameters<typeof UpstreamSmartEdge>[0];

export const SmartEdge = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedSmartEdge {...props} />
  ) : (
    <UpstreamSmartEdge {...props} />
  );

function ThemedSmartEdge({ id, source, target, data }: Props) {
  // Value-equality subscriptions so unrelated edges don't re-render on drag.
  const sourceRect = useEdgeNodeRect(source);
  const targetRect = useEdgeNodeRect(target);
  const emphasis = useGraphEdgeEmphasis(source, target);
  if (!sourceRect || !targetRect) return null;

  const enabled = data?.enabled ?? true;
  const bidirectional = data?.policy?.rules?.[0]?.bidirectional ?? false;
  // Policy nodes have fixed sides: sources enter left, destinations exit right.
  const a = resolveAnchors(sourceRect, targetRect, {
    source: isPolicyNodeId(source),
    target: isPolicyNodeId(target),
  });
  const [path] = getSimpleBezierPath({
    sourceX: a.sx,
    sourceY: a.sy,
    sourcePosition: a.sourcePosition,
    targetX: a.tx,
    targetY: a.ty,
    targetPosition: a.targetPosition,
  });

  return (
    <GraphEdge
      id={id}
      path={path}
      direction={bidirectional ? "both" : "forward"}
      enabled={enabled}
      draft={isDraftId(data?.policy?.id)}
      emphasis={emphasis}
    />
  );
}
