"use client";

import { cn } from "@utils/helpers";
import * as React from "react";
import { hoverHandlers } from "./hover";

/**
 * Entity node of the canvas: icon tile, title, one line of meta, an optional
 * trailing slot, and an action that floats above the card (Install, No
 * Network). Every state is a data attribute graph.css styles, so a selected
 * peer, group, resource and provider all ring the same way.
 *
 *   variant "card"  a standalone card (peers, groups, resources, providers)
 *   variant "plain" a transparent row that becomes a card on hover (a group's
 *                   peers in the group view)
 *   variant "row"   a row inside a network frame (the frame stamps the size)
 */
export type GraphNodeKind =
  | "peer"
  | "group"
  | "resource"
  | "provider"
  | "network"
  | "user"
  | "placeholder";

export type GraphNodeState = {
  /** Panel open or right-click target: solid ring. */
  selected?: boolean;
  /** A dragged node hovers this one (drag-to-group): dashed ring + tint. */
  dropTarget?: boolean;
  /** A connection is being dragged; rings on hover. */
  connectTarget?: boolean;
  disabled?: boolean;
  /** Exists only in the draft: dashed border. */
  draft?: boolean;
  /** Marked for deletion in the draft. */
  deleting?: boolean;
  warning?: boolean;
};

export type GraphNodeCardProps = {
  /** React Flow node id; reported to the hover store so its edges light up. */
  nodeId?: string;
  kind: GraphNodeKind;
  variant?: "card" | "plain" | "row";
  icon: React.ReactNode;
  /** Small overlay in the tile's corner (a country flag). */
  flag?: React.ReactNode;
  title: React.ReactNode;
  /** Tags next to the title (Draft, counts). */
  titleExtra?: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Floats above the card; the adapter adds `nodrag` as needed. */
  action?: React.ReactNode;
  state?: GraphNodeState;
  /** Hover / pointer affordance; defaults to whether onClick is set. */
  interactive?: boolean;
  labelMaxWidth?: number;
  className?: string;
  tileClassName?: string;
  style?: React.CSSProperties;
  testId?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  /** Handles and other overlays, rendered last inside the root. */
  children?: React.ReactNode;
};

const flag = (v?: boolean) => (v ? "" : undefined);

export const GraphNodeCard = React.forwardRef<
  HTMLDivElement,
  GraphNodeCardProps
>(function GraphNodeCard(
  {
    nodeId,
    kind,
    variant = "card",
    icon,
    flag: flagNode,
    title,
    titleExtra,
    meta,
    trailing,
    action,
    state = {},
    interactive,
    labelMaxWidth,
    className,
    tileClassName,
    style,
    testId,
    onClick,
    children,
  },
  ref,
) {
  const isInteractive = interactive ?? !!onClick;
  const rootStyle =
    labelMaxWidth !== undefined
      ? ({
          ...style,
          "--graph-label-max": `${labelMaxWidth}px`,
        } as React.CSSProperties)
      : style;
  return (
    <div
      ref={ref}
      className={cn("nb-graph-root nb-graph-node", className)}
      style={rootStyle}
      data-testid={testId}
      data-kind={kind}
      data-variant={variant}
      data-interactive={flag(isInteractive)}
      data-selected={flag(state.selected)}
      data-drop-target={flag(state.dropTarget)}
      data-connect-target={flag(state.connectTarget)}
      data-disabled={flag(state.disabled)}
      data-draft={flag(state.draft)}
      data-deleting={flag(state.deleting)}
      data-warning={flag(state.warning)}
      onClick={onClick}
      {...hoverHandlers(nodeId)}
    >
      {action && <div className={"nb-graph-node__action nodrag"}>{action}</div>}
      <div
        className={cn("nb-graph-node__tile", tileClassName)}
        data-kind={kind}
      >
        {icon}
        {flagNode && <span className={"nb-graph-node__flag"}>{flagNode}</span>}
      </div>
      <div className={"nb-graph-node__text"}>
        <div className={"nb-graph-node__title"}>
          <span className={"nb-graph-node__label"} data-graph-text={"title"}>
            {title}
          </span>
          {titleExtra}
        </div>
        {meta !== undefined && meta !== null && meta !== "" && (
          <div className={"nb-graph-node__meta"} data-graph-text={"meta"}>
            {meta}
          </div>
        )}
      </div>
      {trailing && <div className={"nb-graph-node__trailing"}>{trailing}</div>}
      {children}
    </div>
  );
});
