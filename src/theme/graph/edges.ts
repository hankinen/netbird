import { Position } from "@xyflow/react";

/** A node's rectangle in flow coordinates. */
export type Rect = { x: number; y: number; width: number; height: number };

export type Anchors = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePosition: Position;
  targetPosition: Position;
};

/**
 * Where an edge leaves its source and enters its target: each end anchors
 * to the side facing the other node, at mid-height, unless the end is
 * "fixed" (a policy pill always takes sources on its left and sends
 * destinations from its right, whatever the layout did).
 */
export function resolveAnchors(
  source: Rect,
  target: Rect,
  fixed: { source?: boolean; target?: boolean } = {},
): Anchors {
  const sourceIsLeft =
    source.x + source.width / 2 < target.x + target.width / 2;

  const sourcePosition = fixed.source
    ? Position.Right
    : sourceIsLeft
    ? Position.Right
    : Position.Left;
  const targetPosition = fixed.target
    ? Position.Left
    : sourceIsLeft
    ? Position.Left
    : Position.Right;

  return {
    sx: sourcePosition === Position.Right ? source.x + source.width : source.x,
    sy: source.y + source.height / 2,
    tx: targetPosition === Position.Left ? target.x : target.x + target.width,
    ty: target.y + target.height / 2,
    sourcePosition,
    targetPosition,
  };
}

export type EdgeTone = "default" | "emphasis" | "disabled" | "draft";

/** Marker id for an edge tone (GraphDefs renders one marker per tone). */
export const markerId = (tone: EdgeTone) =>
  tone === "default" ? "nb-graph-arrow" : `nb-graph-arrow-${tone}`;

export const EDGE_TONES: EdgeTone[] = [
  "default",
  "emphasis",
  "disabled",
  "draft",
];

export function edgeTone({
  enabled,
  draft,
  emphasis,
}: {
  enabled: boolean;
  draft?: boolean;
  emphasis?: boolean;
}): EdgeTone {
  if (!enabled) return "disabled";
  if (emphasis) return "emphasis";
  if (draft) return "draft";
  return "default";
}
