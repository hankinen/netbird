import { cn } from "@utils/helpers";
import * as React from "react";

/** Small label inside a node: Draft, counts, warnings. */
export type GraphTagTone = "neutral" | "draft" | "warning" | "danger";

export function GraphTag({
  tone = "neutral",
  className,
  children,
}: {
  tone?: GraphTagTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("nb-graph-tag", className)} data-tone={tone}>
      {children}
    </span>
  );
}

/** 8px status dot: on (green), off (grey), warning (amber), danger (red). */
export function GraphDot({
  tone = "on",
  className,
}: {
  tone?: "on" | "off" | "warning" | "danger";
  className?: string;
}) {
  return (
    <span
      className={cn("nb-graph-dot", className)}
      data-tone={tone === "on" ? undefined : tone}
      aria-hidden
    />
  );
}
