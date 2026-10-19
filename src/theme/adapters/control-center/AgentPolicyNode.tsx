"use client";

import { Handle, Position, useConnection } from "@xyflow/react";
import * as React from "react";
import { useIsContextMenuTarget } from "@/modules/control-center/contexts/ControlCenterContext";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { ConnectHandle } from "@/modules/control-center/handles/ConnectHandle";
import { FullAreaTargetHandle } from "@/modules/control-center/handles/FullAreaTargetHandle";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphPill } from "@/theme/graph";
import { AgentPolicyNode as UpstreamAgentPolicyNode } from "../../../modules/control-center/nodes/AgentPolicyNode";
import { DraftTag, isDraftId } from "./shared";

/**
 * Agent-network policy pill, replacing
 * src/modules/control-center/nodes/AgentPolicyNode.tsx through its alias.
 * @replaces-file src/modules/control-center/nodes/AgentPolicyNode.tsx sha256:1005beb6505dc112
 */
export * from "../../../modules/control-center/nodes/AgentPolicyNode";

type Props = Parameters<typeof UpstreamAgentPolicyNode>[0];

export const AgentPolicyNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedAgentPolicyNode {...props} />
  ) : (
    <UpstreamAgentPolicyNode {...props} />
  );

function ThemedAgentPolicyNode({ data, id }: Props) {
  const isActive = data.enabled !== false;
  const { isDraft } = useDraftMode();
  const isDropTarget = useConnection(
    (c) => c.inProgress && c.fromNode?.id !== id,
  );
  const showHalo = useIsContextMenuTarget(id);
  const draft = isDraftId(data.id);

  return (
    <GraphPill
      nodeId={id}
      name={data.name}
      nameExtra={draft ? <DraftTag /> : undefined}
      on={isActive}
      state={{
        selected: showHalo,
        connectTarget: isDraft && isDropTarget,
        draft,
      }}
    >
      <Handle
        type={"source"}
        position={Position.Right}
        id={"sr"}
        className={"opacity-0"}
        isConnectable={false}
      />
      <Handle
        type={"target"}
        position={Position.Left}
        id={"tl"}
        className={"opacity-0"}
        isConnectable={false}
      />
      {isDraft && (
        <>
          <ConnectHandle type={"source"} position={Position.Left} />
          <ConnectHandle type={"source"} position={Position.Right} />
          <FullAreaTargetHandle isConnectable={isDropTarget} />
        </>
      )}
    </GraphPill>
  );
}
