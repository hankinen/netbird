"use client";

import { GroupBadgeIcon } from "@components/ui/GroupBadgeIcon";
import { Position, useConnection } from "@xyflow/react";
import * as React from "react";
import {
  useCanvasUI,
  useDestinationGroup,
  useIsContextMenuTarget,
} from "@/modules/control-center/contexts/ControlCenterContext";
import { AllHandles } from "@/modules/control-center/handles/AllHandles";
import { ConnectHandle } from "@/modules/control-center/handles/ConnectHandle";
import {
  getGroupCountLabel,
  useAnySourceGroupEnabled,
} from "@/modules/control-center/utils/helpers";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard } from "@/theme/graph";
import { GroupNode as UpstreamGroupNode } from "../../../modules/control-center/nodes/GroupNode";
import { DraftTag } from "./shared";

/**
 * Group node, replacing src/modules/control-center/nodes/GroupNode.tsx
 * through the `@/modules/control-center/nodes/GroupNode` alias. Same data,
 * same hooks, same `cc-group-node` hook and handles; the look is the graph
 * layer's node card.
 * @replaces-file src/modules/control-center/nodes/GroupNode.tsx sha256:1626c0b2252783e1
 */
export * from "../../../modules/control-center/nodes/GroupNode";

type Props = Parameters<typeof UpstreamGroupNode>[0];

export const GroupNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedGroupNode {...props} />
  ) : (
    <UpstreamGroupNode {...props} />
  );

function ThemedGroupNode({ data, id }: Props) {
  const {
    enabled,
    group,
    hoverable = true,
    dropTarget,
    showHandles = false,
    onClick,
  } = data;
  const sourceGroupEnabled = useAnySourceGroupEnabled(
    id,
    enabled !== undefined,
  );
  const isEnabled = enabled ?? sourceGroupEnabled;
  // Selector form: re-renders only when the boolean flips, not per pointer move.
  const isTarget = useConnection((c) => c.inProgress && c.fromNode.id !== id);
  const isNew = !group?.id;
  const isContextMenuActive = useIsContextMenuTarget(id);
  const { selectedDestinationGroup } = useDestinationGroup();
  const isPanelActive =
    selectedDestinationGroup !== "" &&
    (selectedDestinationGroup === group?.id || selectedDestinationGroup === id);

  const { groupUserCounts } = useCanvasUI();
  // A draft group has no id yet, so it counts under its name — the same ref the
  // pending `update-user-groups` entries carry.
  const userCount =
    (data as { userCountOverride?: number }).userCountOverride ??
    (group ? groupUserCounts.get(group.id ?? group.name) : 0);
  const countLabel = React.useMemo(
    () => getGroupCountLabel(group, userCount),
    [group, userCount],
  );

  return (
    <GraphNodeCard
      nodeId={id}
      kind={"group"}
      className={"cc-group-node"}
      icon={<GroupBadgeIcon id={group?.id} issued={group?.issued} size={16} />}
      title={group.name}
      titleExtra={isNew ? <DraftTag /> : undefined}
      meta={countLabel}
      interactive={hoverable}
      state={{
        selected: isPanelActive || isContextMenuActive,
        dropTarget,
        connectTarget: isTarget,
        disabled: !isEnabled,
        draft: isNew,
      }}
      onClick={() => onClick?.(group)}
    >
      <AllHandles />
      {showHandles && (
        <>
          <ConnectHandle type={"source"} position={Position.Left} />
          <ConnectHandle type={"source"} position={Position.Right} />
        </>
      )}
    </GraphNodeCard>
  );
}
