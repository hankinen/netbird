"use client";

import {
  Handle,
  Position,
  useConnection,
  useNodeId,
  useStore,
} from "@xyflow/react";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from "lucide-react";
import * as React from "react";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { ConnectHandle as UpstreamConnectHandle } from "../../../modules/control-center/handles/ConnectHandle";

/**
 * The visible connect bubble on a node's side, replacing
 * src/modules/control-center/handles/ConnectHandle.tsx through its alias.
 * Handle ids (`sl-connect`, `sr-connect`, …) and the subscription shape are
 * upstream's; only the bubble is the graph layer's.
 * @replaces-file src/modules/control-center/handles/ConnectHandle.tsx sha256:4b7fbf8782fc54b8
 */
export * from "../../../modules/control-center/handles/ConnectHandle";

type Props = Parameters<typeof UpstreamConnectHandle>[0];

export const ConnectHandle = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedConnectHandle {...props} />
  ) : (
    <UpstreamConnectHandle {...props} />
  );

type Side = "left" | "right" | "top" | "bottom";
// Position's values are these strings; resolved per render, not at module
// level, so test files that mock @xyflow/react without Position still load.
const sideOf = (position: Position): Side => String(position) as Side;

const ARROWS = {
  left: ArrowLeftIcon,
  right: ArrowRightIcon,
  top: ArrowUpIcon,
  bottom: ArrowDownIcon,
} as const;

const handleIdFor = (type: "source" | "target", side: Side) =>
  `${type === "source" ? "s" : "t"}${side[0]}-connect`;

function ThemedConnectHandle({
  position = Position.Right,
  type = "source",
  hidden = false,
}: Props) {
  const nodeId = useNodeId();
  const side = sideOf(position);
  const handleId = React.useMemo(() => handleIdFor(type, side), [type, side]);

  // Selector form: this handle renders in EVERY node, so it must re-render
  // when the flags flip, not on every pointer move of a connect drag.
  const connectionState = useConnection((c) =>
    !c.inProgress
      ? "idle"
      : c.fromNode?.id === nodeId && c.fromHandle?.id === handleId
      ? "self"
      : "other",
  );
  const isConnecting = connectionState === "self";
  const isDragging = useStore((s) => {
    if (!nodeId) return false;
    const node = s.nodeLookup?.get(nodeId);
    return node?.dragging === true;
  });

  if (connectionState === "other") return null;

  const ArrowIcon = ARROWS[side];
  const horizontal = side === "left" || side === "right";

  return (
    <Handle
      type={type}
      position={position}
      id={handleId}
      className={"nb-graph-handle"}
      data-connecting={isConnecting ? "" : undefined}
      data-hidden={hidden || isDragging ? "" : undefined}
      // The hit area is a strip along the node's side; the bubble inside it
      // is what the user sees.
      style={{
        background: "none",
        border: "none",
        borderRadius: 0,
        ...(horizontal
          ? { width: "1em", height: "4em" }
          : { width: "4em", height: "1em" }),
      }}
    >
      <span className={"nb-graph-handle__bubble"} data-side={side}>
        <span className={"nb-graph-handle__dot"} />
        <ArrowIcon size={14} className={"nb-graph-handle__arrow"} />
      </span>
    </Handle>
  );
}
