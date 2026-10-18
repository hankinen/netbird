"use client";

import { cn } from "@utils/helpers";
import * as React from "react";
import type { GraphNodeState } from "./GraphNodeCard";
import { hoverHandlers } from "./hover";

/**
 * Container node (a network): a header of fixed height the frame layout
 * reserves (helpers.ts NETWORK_FRAME_HEADER = --graph-frame-header-h), a
 * body the child rows are positioned in by React Flow, a `controls` slot
 * that floats above the top-left corner (the routing-peers bar) and
 * whatever the adapter overlays (add button, "+N more" cell, handles).
 */
export type GraphFrameProps = {
  nodeId?: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  titleExtra?: React.ReactNode;
  meta?: React.ReactNode;
  /** Right-hand side of the header. */
  headerExtra?: React.ReactNode;
  /** Floats above the frame. */
  controls?: React.ReactNode;
  state?: GraphNodeState;
  /** The canvas reports a hover over the frame or one of its rows. */
  hovered?: boolean;
  interactive?: boolean;
  className?: string;
  testId?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children?: React.ReactNode;
};

const flag = (v?: boolean) => (v ? "" : undefined);

export function GraphFrame({
  nodeId,
  icon,
  title,
  titleExtra,
  meta,
  headerExtra,
  controls,
  state = {},
  hovered,
  interactive,
  className,
  testId,
  onClick,
  children,
}: GraphFrameProps) {
  return (
    <div
      className={cn("nb-graph-root nb-graph-frame", className)}
      data-testid={testId}
      data-interactive={flag(interactive ?? !!onClick)}
      data-hovered={flag(hovered)}
      data-selected={flag(state.selected)}
      data-drop-target={flag(state.dropTarget)}
      data-connect-target={flag(state.connectTarget)}
      data-disabled={flag(state.disabled)}
      data-draft={flag(state.draft)}
      onClick={onClick}
      {...hoverHandlers(nodeId)}
    >
      <div className={"nb-graph-frame__header"}>
        <div className={"nb-graph-frame__heading"}>
          {icon && (
            <span className={"nb-graph-node__tile"} data-kind={"network"}>
              {icon}
            </span>
          )}
          <div className={"nb-graph-node__text"}>
            <div className={"nb-graph-frame__title"}>
              <span
                className={"nb-graph-node__label"}
                data-graph-text={"title"}
              >
                {title}
              </span>
              {titleExtra}
            </div>
            {meta !== undefined && meta !== null && meta !== "" && (
              <div className={"nb-graph-frame__meta"} data-graph-text={"meta"}>
                {meta}
              </div>
            )}
          </div>
        </div>
        {headerExtra}
      </div>
      {controls && (
        <div className={"nb-graph-frame__controls nodrag"}>{controls}</div>
      )}
      {children}
    </div>
  );
}
