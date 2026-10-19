"use client";

import { Handle, Position, useConnection } from "@xyflow/react";
import * as React from "react";
import { t } from "@/i18n";
import { useIsContextMenuTarget } from "@/modules/control-center/contexts/ControlCenterContext";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { ConnectHandle } from "@/modules/control-center/handles/ConnectHandle";
import { FullAreaTargetHandle } from "@/modules/control-center/handles/FullAreaTargetHandle";
import { getPolicyProtocolAndPortText } from "@/modules/control-center/utils/helpers";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphPill } from "@/theme/graph";
import { PolicyNode as UpstreamPolicyNode } from "../../../modules/control-center/nodes/PolicyNode";
import { DraftTag, isDraftId } from "./shared";

/**
 * Policy pill, replacing src/modules/control-center/nodes/PolicyNode.tsx
 * through the `@/modules/control-center/nodes/PolicyNode` alias. Handle ids
 * (`sr`, `tl`, the connect handles) are upstream's: draft-connect keys on them.
 * @replaces-file src/modules/control-center/nodes/PolicyNode.tsx sha256:4f6b5f6145e4d227
 */
export * from "../../../modules/control-center/nodes/PolicyNode";

type Props = Parameters<typeof UpstreamPolicyNode>[0];

// Upstream's helper yields "TCP:22,443,3000-3999, ..."; spaced out it reads
// as a list, not an identifier (the e2e suites do not assert this text).
export const formatPorts = (label: string) =>
  label.replace(/^([A-Za-z]+):/, "$1 ").replace(/,(?=\S)/g, ", ");

export const PolicyNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedPolicyNode {...props} />
  ) : (
    <UpstreamPolicyNode {...props} />
  );

function ThemedPolicyNode({ data, id }: Props) {
  const rule = data.policy.rules?.[0];
  const label = getPolicyProtocolAndPortText(data.policy);
  const isActive = !!rule?.enabled;
  const { isDraft } = useDraftMode();
  const isDropTarget = useConnection(
    (c) => c.inProgress && c.fromNode?.id !== id,
  );
  const showHalo = useIsContextMenuTarget(id);
  const draft = isDraftId(data.policy.id);

  return (
    <GraphPill
      nodeId={id}
      name={rule?.name}
      nameExtra={draft ? <DraftTag /> : undefined}
      tag={label === "" ? t("common:word.all") : formatPorts(label)}
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
      {/* Dragging right adds the target group as a destination, left as a
          source. */}
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
