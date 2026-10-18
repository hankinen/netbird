"use client";

import { cn } from "@utils/helpers";
import * as React from "react";
import type { GraphNodeState } from "./GraphNodeCard";
import { GraphDot } from "./GraphTag";
import { hoverHandlers } from "./hover";

/**
 * Relationship node of the canvas: a pill with a status dot, a name and an
 * optional tag (protocol and ports). Policies and agent policies render it.
 */
export type GraphPillProps = {
  nodeId?: string;
  name: React.ReactNode;
  /** Tags after the name (Draft). */
  nameExtra?: React.ReactNode;
  /** Right-hand capsule, e.g. "TCP 22, 443". */
  tag?: React.ReactNode;
  /** Enabled policy: green dot; otherwise grey and the pill fades. */
  on?: boolean;
  state?: GraphNodeState;
  className?: string;
  testId?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children?: React.ReactNode;
};

const flag = (v?: boolean) => (v ? "" : undefined);

export function GraphPill({
  nodeId,
  name,
  nameExtra,
  tag,
  on = true,
  state = {},
  className,
  testId,
  onClick,
  children,
}: GraphPillProps) {
  return (
    <div
      className={cn("nb-graph-root nb-graph-pill", className)}
      data-testid={testId}
      data-on={on ? "true" : "false"}
      data-has-name={name ? "" : undefined}
      data-selected={flag(state.selected)}
      data-drop-target={flag(state.dropTarget)}
      data-connect-target={flag(state.connectTarget)}
      data-disabled={flag(state.disabled || !on)}
      data-draft={flag(state.draft)}
      data-deleting={flag(state.deleting)}
      onClick={onClick}
      {...hoverHandlers(nodeId)}
    >
      <GraphDot tone={on ? "on" : "off"} />
      <span className={"nb-graph-pill__name"} data-graph-text={"title"}>
        {name}
      </span>
      {nameExtra}
      {tag !== undefined && tag !== null && tag !== "" && (
        <span className={"nb-graph-pill__tag"} data-graph-text={"tag"}>
          <span>{tag}</span>
        </span>
      )}
      {children}
    </div>
  );
}
