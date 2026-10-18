"use client";

import { type Node, Position, useConnection, useStore } from "@xyflow/react";
import * as React from "react";
import { t } from "@/i18n";
import { useIsContextMenuTarget } from "@/modules/control-center/contexts/ControlCenterContext";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { AllHandles } from "@/modules/control-center/handles/AllHandles";
import { ConnectHandle } from "@/modules/control-center/handles/ConnectHandle";
import { StandaloneResourceNode } from "@/modules/control-center/nodes/StandaloneResourceNode";
import {
  getDraftResource,
  getResourceNodeEnabled,
  useAnySourceGroupEnabled,
} from "@/modules/control-center/utils/helpers";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard } from "@/theme/graph";
import { ResourceNode as UpstreamResourceNode } from "../../../modules/control-center/nodes/ResourceNode";
import { DraftTag, PeerOsIcon, ResourceTypeIcon } from "./shared";

/**
 * Resource node in its three shapes (standalone card, row inside a network
 * frame, destination card), replacing
 * src/modules/control-center/nodes/ResourceNode.tsx through its alias. The
 * `cc-frame-row` / `cc-frame-row-icon` hooks stay on framed rows: the frame
 * layout and the focus mode key on them.
 * @replaces-file src/modules/control-center/nodes/ResourceNode.tsx sha256:44ba12d7f9fb2b23
 */
export * from "../../../modules/control-center/nodes/ResourceNode";

type Props = Parameters<typeof UpstreamResourceNode>[0];

export const ResourceNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedResourceNode {...props} />
  ) : (
    <UpstreamResourceNode {...props} />
  );

function ThemedResourceNode({ data, id, parentId }: Props) {
  const { enabled, resource, peer, showHandles = false, className } = data;
  const sourceGroupEnabled = useAnySourceGroupEnabled(
    id,
    enabled !== undefined,
  );
  const isEnabled = enabled ?? sourceGroupEnabled;
  const { isDraft, setResourceEditor, drillDownNetworkNodeId } = useDraftMode();
  // Dragging FROM a framed resource is drill-down-only; dropping onto it isn't.
  const isFramed = !!parentId?.startsWith("network-");
  const handlesActive = !isFramed || drillDownNetworkNodeId === parentId;
  const isTarget = useConnection((c) => c.inProgress && c.fromNode.id !== id);
  const showHalo = useIsContextMenuTarget(id);

  const isDraftResource = id.startsWith("resource-new-");
  const node = { id, data, position: { x: 0, y: 0 } } as Node;
  const draftResource = isDraftResource ? getDraftResource(node) : undefined;
  const cardResource = draftResource ?? resource;

  // Boolean selector, NOT useInternalNode: that lookup is rebuilt every drag
  // tick, re-rendering every framed resource row.
  const parentFrameHidden = useStore((st) =>
    parentId ? !!st.nodeLookup.get(parentId)?.hidden : false,
  );
  // Keys off the frame being HIDDEN so the row↔card swap happens while the
  // canvas is invisible.
  const isDrilledChild = isFramed && parentFrameHidden;
  const standaloneCard = isDraft
    ? !isFramed || isDrilledChild
    : !isFramed && (!!data.draftNetwork || !!data.standalone);
  if (cardResource && standaloneCard) {
    return (
      <StandaloneResourceNode
        id={id}
        data={data}
        hideNetwork={isDrilledChild || !!data.drilled}
      />
    );
  }

  // A resource inside a network frame is a flat row managed by the frame.
  if (cardResource && isFramed) {
    return (
      <GraphNodeCard
        nodeId={id}
        kind={"resource"}
        variant={"row"}
        className={className ? `cc-frame-row ${className}` : "cc-frame-row"}
        tileClassName={"cc-frame-row-icon"}
        icon={<ResourceTypeIcon type={cardResource.type} />}
        title={cardResource.name}
        titleExtra={isDraftResource ? <DraftTag /> : undefined}
        meta={
          cardResource.address ||
          t("control-center.nodes:resourceNode.text.iPCIDROrDomain")
        }
        labelMaxWidth={135}
        interactive
        state={{
          selected: showHalo,
          connectTarget: isTarget,
          disabled: data.enabled === false || !getResourceNodeEnabled(node),
          draft: isDraftResource,
        }}
        onClick={() => {
          // Live rows drill into the network via onNodeClick instead.
          if (isDraft) setResourceEditor({ nodeId: id });
        }}
      >
        <AllHandles />
        {isDraft && showHandles && handlesActive && (
          <ConnectHandle type={"source"} position={Position.Left} />
        )}
      </GraphNodeCard>
    );
  }

  return (
    <GraphNodeCard
      nodeId={id}
      kind={peer ? "peer" : "resource"}
      variant={data.standalone ? "card" : "plain"}
      className={className}
      icon={
        peer ? (
          <PeerOsIcon os={peer.os} />
        ) : (
          <ResourceTypeIcon type={resource?.type} />
        )
      }
      title={peer?.name || resource?.name || t("common:word.unknownRegion")}
      meta={peer?.ip || resource?.address}
      labelMaxWidth={150}
      interactive
      state={{ connectTarget: isTarget, disabled: !isEnabled }}
    >
      <AllHandles />
    </GraphNodeCard>
  );
}
