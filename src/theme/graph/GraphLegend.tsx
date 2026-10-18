"use client";

import { cn } from "@utils/helpers";
import * as React from "react";
import type { EdgeTone } from "./edges";
import { markerId } from "./edges";

/**
 * Legend rows for the canvas: an edge swatch (drawn with the same classes
 * and markers as the real edges, so it follows the tokens) or any node
 * sample next to a label. The product decides the rows; this file only
 * draws them.
 */
export type GraphLegendRow = {
  key: string;
  swatch: React.ReactNode;
  label: React.ReactNode;
};

export function GraphLegend({
  title,
  rows,
  className,
}: {
  title?: React.ReactNode;
  rows: GraphLegendRow[];
  className?: string;
}) {
  return (
    <div className={cn("nb-graph-legend", className)}>
      {title && <div className={"nb-graph-legend__title"}>{title}</div>}
      {rows.map((row) => (
        <div key={row.key} className={"nb-graph-legend__row"}>
          <span className={"nb-graph-legend__swatch"}>{row.swatch}</span>
          <span>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

/** A 36×20 sample of an edge in a tone, with its arrowheads. */
export function EdgeSwatch({
  tone = "default",
  direction = "forward",
}: {
  tone?: EdgeTone;
  direction?: "none" | "forward" | "both";
}) {
  const marker = `url(#${markerId(tone)})`;
  return (
    <svg width={36} height={20} viewBox={"0 0 36 20"} aria-hidden>
      <path
        d={direction === "both" ? "M6 10 H30" : "M2 10 H33"}
        className={"nb-graph-edge"}
        data-disabled={tone === "disabled" ? "" : undefined}
        data-draft={tone === "draft" ? "" : undefined}
        data-emphasis={tone === "emphasis" ? "hover" : undefined}
        markerEnd={direction === "none" ? undefined : marker}
        markerStart={direction === "both" ? marker : undefined}
        style={{ animation: "none" }}
      />
    </svg>
  );
}
