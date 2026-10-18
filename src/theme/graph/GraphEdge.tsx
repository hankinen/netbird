"use client";

import { cn } from "@utils/helpers";
import * as React from "react";
import { EDGE_TONES, edgeTone, markerId } from "./edges";
import type { EdgeEmphasis } from "./hover";

/**
 * The one edge of the graph layer. A hairline in the edge colour with an
 * arrowhead at the target (both ends for `direction: "both"`); disabled
 * edges are dashed and faded, draft edges take the accent, and an edge whose
 * endpoint is hovered switches to the emphasis colour and a flowing dash,
 * the only animation on the canvas at rest.
 *
 * Renders a bare <path>: React Flow's interaction path is not needed here
 * (control-center disables pointer events on edges) and the SimpleConnection
 * test reads the first path's inline opacity.
 */
export type GraphEdgeProps = {
  id?: string;
  path: string;
  direction?: "none" | "forward" | "both";
  enabled?: boolean;
  draft?: boolean;
  emphasis?: EdgeEmphasis;
  className?: string;
  style?: React.CSSProperties;
  /** A small label at a point of the path (edge midpoint). */
  label?: { x: number; y: number; text: string };
};

export function GraphEdge({
  id,
  path,
  direction = "forward",
  enabled = true,
  draft = false,
  emphasis = "none",
  className,
  style,
  label,
}: GraphEdgeProps) {
  const tone = edgeTone({ enabled, draft, emphasis: emphasis === "hover" });
  const marker = `url(#${markerId(tone)})`;
  const labelWidth = label ? label.text.length * 7.5 + 18 : 0;
  const labelHeight = 24;
  return (
    <>
      <path
        id={id}
        d={path}
        className={cn("react-flow__edge-path nb-graph-edge", className)}
        data-disabled={enabled ? undefined : ""}
        data-draft={draft && enabled ? "" : undefined}
        data-emphasis={emphasis === "hover" ? "hover" : undefined}
        markerEnd={direction === "none" ? undefined : marker}
        markerStart={direction === "both" ? marker : undefined}
        style={{ opacity: enabled ? 1 : 0.6, ...style }}
      />
      {label && label.text.length > 0 && (
        <foreignObject
          x={label.x - labelWidth / 2}
          y={label.y - labelHeight / 2}
          width={labelWidth}
          height={labelHeight}
          style={{ overflow: "visible" }}
        >
          <div className={"nb-graph-edge__label"}>{label.text}</div>
        </foreignObject>
      )}
    </>
  );
}

/**
 * Arrowhead markers, one per tone, referenced by url(#id) from every edge.
 * Mount once per page (any SVG in the document resolves them). userSpaceOnUse
 * keeps the arrow the same size whatever the stroke width.
 */
export function GraphDefs() {
  return (
    <svg
      className={"nb-graph-defs"}
      width={0}
      height={0}
      style={{ position: "absolute", width: 0, height: 0 }}
      aria-hidden
    >
      <defs>
        {EDGE_TONES.map((tone) => (
          <marker
            key={tone}
            id={markerId(tone)}
            viewBox={"0 0 10 10"}
            refX={9}
            refY={5}
            markerWidth={9}
            markerHeight={9}
            markerUnits={"userSpaceOnUse"}
            orient={"auto-start-reverse"}
          >
            <path
              className={"nb-graph-marker"}
              data-tone={tone === "default" ? undefined : tone}
              d={"M1.5 1.5 L9 5 L1.5 8.5 Z"}
            />
          </marker>
        ))}
      </defs>
    </svg>
  );
}
