"use client";

import { GroupBadgeIcon } from "@components/ui/GroupBadgeIcon";
import { singularize } from "@utils/helpers";
import { Position, useConnection, useStore } from "@xyflow/react";
import * as React from "react";
import { t } from "@/i18n";
import {
  useDestinationGroup,
  useIsContextMenuTarget,
} from "@/modules/control-center/contexts/ControlCenterContext";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { AllHandles } from "@/modules/control-center/handles/AllHandles";
import { ConnectHandle } from "@/modules/control-center/handles/ConnectHandle";
import { GroupNode } from "@/modules/control-center/nodes/GroupNode";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard } from "@/theme/graph";
import { ResourceGroupNode as UpstreamResourceGroupNode } from "../../../modules/control-center/nodes/ResourceGroupNode";
import { DraftTag } from "./shared";

/**
 * A resource group shown as a row inside a network frame (and as a full
 * group card once the frame is drilled into), replacing
 * src/modules/control-center/nodes/ResourceGroupNode.tsx through its alias.
 * @replaces-file src/modules/control-center/nodes/ResourceGroupNode.tsx sha256:456cabfc60c120da
 */
export * from "../../../modules/control-center/nodes/ResourceGroupNode";

type Props = Parameters<typeof UpstreamResourceGroupNode>[0];

export const ResourceGroupNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedResourceGroupNode {...props} />
  ) : (
    <UpstreamResourceGroupNode {...props} />
  );

function ThemedResourceGroupNode({ data, id, parentId }: Props) {
  const { group, showHandles = true } = data;
  const { isDraft, drillDownNetworkNodeId } = useDraftMode();
  const { selectedDestinationGroup, setSelectedDestinationGroup } =
    useDestinationGroup();
  const isContextTarget = useIsContextMenuTarget(id);
  // Panel selection is keyed by group id, or by node id for draft groups.
  const isPanelActive =
    selectedDestinationGroup !== "" &&
    (selectedDestinationGroup === group?.id || selectedDestinationGroup === id);
  // Framed rows accept drops in every view; dragging FROM one is
  // drill-down-only.
  const isFramed = !!parentId?.startsWith("network-");
  const handlesActive = !isFramed || drillDownNetworkNodeId === parentId;
  const isTarget = useConnection((c) => c.inProgress && c.fromNode.id !== id);

  // While drilled the parent frame is HIDDEN and the row promotes to a full
  // GroupNode card. Boolean store selector on purpose, not useInternalNode.
  const parentFrameHidden = useStore((st) =>
    parentId ? !!st.nodeLookup.get(parentId)?.hidden : false,
  );
  const isDrilledChild = isFramed && parentFrameHidden;
  if (isDraft && isDrilledChild) {
    return (
      <GroupNode
        id={id}
        type={"groupNode"}
        position={{ x: 0, y: 0 }}
        data={{
          group,
          enabled: data.enabled,
          showHandles,
          dropTarget: data.dropTarget,
          onClick: () => setSelectedDestinationGroup(group?.id || id),
        }}
      />
    );
  }

  return (
    <GraphNodeCard
      nodeId={id}
      kind={"group"}
      variant={"row"}
      className={"cc-frame-row"}
      tileClassName={"cc-frame-row-icon"}
      icon={<GroupBadgeIcon id={group?.id} issued={group?.issued} size={16} />}
      title={group?.name}
      titleExtra={!group?.id ? <DraftTag /> : undefined}
      meta={
        group?.resources_count
          ? singularize("Resources", group.resources_count, true)
          : t("control-center.nodes:resourceGroupNode.text.noResources")
      }
      labelMaxWidth={135}
      interactive
      state={{
        selected: isPanelActive || isContextTarget,
        connectTarget: isTarget,
        dropTarget: data.dropTarget,
        draft: !group?.id,
      }}
      onClick={() => {
        if (isDraft) setSelectedDestinationGroup(group?.id || id);
      }}
    >
      {/* AllHandles always render: even a showHandles-false row has to anchor
          edges. showHandles only gates the visible connect bubble. */}
      <AllHandles />
      {showHandles && isDraft && handlesActive && (
        <ConnectHandle type={"source"} position={Position.Left} />
      )}
    </GraphNodeCard>
  );
}
