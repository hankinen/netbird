"use client";

import Button from "@components/Button";
import { cn, singularize } from "@utils/helpers";
import { Handle, Position, useConnection, useStore } from "@xyflow/react";
import { CirclePlusIcon, NetworkIcon } from "lucide-react";
import * as React from "react";
import { useGroups } from "@/contexts/GroupsProvider";
import { t } from "@/i18n";
import { Network, NetworkResource } from "@/interfaces/Network";
import { useIsContextMenuTarget } from "@/modules/control-center/contexts/ControlCenterContext";
import { useDraftChangeset } from "@/modules/control-center/draft/DraftChangesetContext";
import {
  useDraftMode,
  useNetworkHover,
} from "@/modules/control-center/draft/DraftModeContext";
import { ConnectHandle } from "@/modules/control-center/handles/ConnectHandle";
import { FullAreaTargetHandle } from "@/modules/control-center/handles/FullAreaTargetHandle";
import { useFrameRouterRows } from "@/modules/control-center/hooks/useFrameRouterRows";
import { MoreResourcesNode } from "@/modules/control-center/nodes/MoreResourcesNode";
import {
  getRoutingPeerCount,
  RoutingPeersBar,
} from "@/modules/control-center/panels/RoutingPeersBar";
import {
  DraftNetworkRef,
  getDraftResource,
  NETWORK_FRAME_HEADER,
} from "@/modules/control-center/utils/helpers";
import { NodeType } from "@/modules/control-center/utils/nodes";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphFrame } from "@/theme/graph";
import { NetworkNode as UpstreamNetworkNode } from "../../../modules/control-center/nodes/NetworkNode";
import { DraftTag } from "./shared";

/**
 * Network frame, replacing src/modules/control-center/nodes/NetworkNode.tsx
 * through the `@/modules/control-center/nodes/NetworkNode` alias. The count
 * overlays, lazy router rows, hover bookkeeping, handles and the add-resource
 * button are upstream's (the upstream NetworkNode.test runs against this
 * file); the frame itself is the graph layer's.
 * @replaces-file src/modules/control-center/nodes/NetworkNode.tsx sha256:55b6c42664b88098
 */
export * from "../../../modules/control-center/nodes/NetworkNode";

type Props = Parameters<typeof UpstreamNetworkNode>[0];

export const NetworkNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedNetworkNode {...props} />
  ) : (
    <UpstreamNetworkNode {...props} />
  );

function ThemedNetworkNode({ data, id }: Props) {
  const {
    isDraft,
    setRoutingPeerModal,
    drillDownNetworkNodeId,
    setDrillDownNetworkNodeId,
  } = useDraftMode();
  const { hoveredNetworkNodeId, setHoveredNetworkNodeId } = useNetworkHover();
  const isFrameHovered = hoveredNetworkNodeId === id;
  const isDrilled = drillDownNetworkNodeId === id;
  const isTarget = useConnection((c) => c.inProgress && c.fromNode?.id !== id);
  const showHalo = useIsContextMenuTarget(id);

  // Hovering the floating controls must neither highlight the frame nor reveal
  // its ConnectHandle.
  const [controlsHovered, setControlsHovered] = React.useState(false);

  const n = data.network as Network;

  // Store selector with value equality, NOT useCanvasState: subscribing to the
  // nodes array re-rendered every frame on every canvas update.
  const draftResources = useStore(
    (s) =>
      s.nodes
        .filter((node) => {
          const ref = (node.data as { draftNetwork?: DraftNetworkRef })
            ?.draftNetwork;
          if (!ref) return false;
          return ref.networkClientId
            ? `network-${ref.networkClientId}` === id
            : !!n?.id && ref.networkId === n.id;
        })
        .map((node) => getDraftResource(node))
        .filter(Boolean) as NetworkResource[],
    (a, b) =>
      a.length === b.length &&
      a.every(
        (r, i) =>
          r.id === b[i].id &&
          r.name === b[i].name &&
          r.address === b[i].address &&
          r.type === b[i].type,
      ),
  );

  const { changes } = useDraftChangeset();
  const { groups } = useGroups();

  // Pending delete-resource changes must lower the header count immediately;
  // the live id list still contains the doomed resources until deploy.
  const deletedResourceCount = React.useMemo(() => {
    const liveIds = new Set(n?.resources ?? []);
    return changes.filter(
      (c) => c.type === "delete-resource" && liveIds.has(c.resourceId),
    ).length;
  }, [changes, n?.resources]);

  // Only the count is needed, so no frame subscribes to /networks/resources.
  const resourceCount =
    Math.max(0, (n?.resources || []).length - deletedResourceCount) +
    draftResources.length;

  // Resource-group rows have no draftNetwork ref but still occupy a grid cell.
  const resourceGroupCount = useStore(
    (s) =>
      s.nodes.filter(
        (node) =>
          node.parentId === id && node.type === NodeType.ResourceGroupNode,
      ).length,
  );
  const frameCellCount = resourceCount + resourceGroupCount;

  // Rect computed by useNetworkFrameLayout; cleared while drilled.
  const moreCell = data.moreCell;

  // API router rows are fetched lazily on first popover open.
  const [routersRequested, setRoutersRequested] = React.useState(false);
  const { rows: routerRows, isLoading: routerRowsLoading } = useFrameRouterRows(
    id,
    routersRequested,
  );

  // A pending update-router that disables a live router must drop its peers from
  // the badge before the lazy rows fetch runs.
  const liveNetworkId = n?.id;
  const draftDisabledRouterPeers = React.useMemo(
    () =>
      changes.reduce((sum, c) => {
        if (c.type !== "update-router" || c.enabled !== false) return sum;
        if (!liveNetworkId || c.networkId !== liveNetworkId) return sum;
        if (c.peerId) return sum + 1;
        const group = groups?.find(
          (g) => g.id === c.groupId || g.name === c.groupId,
        );
        return sum + (group?.peers_count ?? 0);
      }, 0),
    [changes, groups, liveNetworkId],
  );

  // Frames count peers, not routers (see getRoutingPeerCount).
  const routingPeersCount =
    routersRequested && !routerRowsLoading
      ? getRoutingPeerCount(routerRows)
      : Math.max(0, (n?.routing_peers_count ?? 0) - draftDisabledRouterPeers) +
        getRoutingPeerCount(routerRows);

  const controlsHover = {
    onMouseEnter: () => {
      setHoveredNetworkNodeId(null);
      setControlsHovered(true);
    },
    onMouseLeave: () => {
      setHoveredNetworkNodeId(id);
      setControlsHovered(false);
    },
  };

  return (
    <GraphFrame
      nodeId={id}
      icon={<NetworkIcon size={16} />}
      title={n?.name}
      titleExtra={!n?.id ? <DraftTag /> : undefined}
      meta={
        resourceCount === 0
          ? t("control-center.nodes:resourceGroupNode.text.noResources")
          : singularize("Resources", resourceCount, true)
      }
      hovered={isFrameHovered && !controlsHovered}
      interactive={!isDrilled}
      state={{
        selected: showHalo,
        disabled: data.enabled === false,
        connectTarget: isDraft && isTarget,
        // Set on the node's data by useDragToGroup during a drag.
        dropTarget: data.dropTarget,
        draft: !n?.id,
      }}
      onClick={
        isDraft && !isDrilled ? () => setDrillDownNetworkNodeId(id) : undefined
      }
      controls={
        <div
          // ReactFlow fires enter outer→inner and leave inner→outer, so these
          // run after (enter) / before (leave) its own node handler and win.
          onClick={(e) => e.stopPropagation()}
          className={"flex items-stretch gap-2"}
          {...controlsHover}
        >
          <RoutingPeersBar
            rows={routerRows}
            count={routingPeersCount}
            loading={routerRowsLoading}
            compact
            onOpenChange={(open) => open && setRoutersRequested(true)}
            onPrefetch={() => setRoutersRequested(true)}
            // Live opens the real modal; draft records a change.
            onAdd={() => setRoutingPeerModal({ networkNodeId: id })}
          />
        </div>
      }
    >
      {/* Empty frames center the button; with resources it's a full-width row
          in the bottom band the layout reserves. */}
      <FrameAddResourceButton
        id={id}
        frameCellCount={frameCellCount}
        {...controlsHover}
      />

      {/* Draft frames use FullAreaTargetHandle instead. */}
      {!isDraft && (
        <>
          <Handle
            type={"source"}
            position={Position.Right}
            id={"sr"}
            isConnectable={false}
            style={{ opacity: 0 }}
          />
          <Handle
            type={"target"}
            position={Position.Left}
            id={"tl"}
            isConnectable={false}
            style={{ opacity: 0 }}
          />
        </>
      )}
      {isDraft && (
        <ConnectHandle
          type={"source"}
          position={Position.Left}
          hidden={controlsHovered}
        />
      )}
      {isDraft && <FullAreaTargetHandle isConnectable={isTarget} />}

      {/* Clicks bubble to the frame and drill in. */}
      {!isDrilled && moreCell && (
        <MoreResourcesNode
          count={moreCell.count}
          style={{
            left: moreCell.x,
            top: moreCell.y - 1,
            width: moreCell.width,
            height: moreCell.height,
          }}
        />
      )}
    </GraphFrame>
  );
}

// Split out so live frames never mount useDraftNodeCreation, which pulls six
// SWR subscriptions per frame.
const FrameAddResourceButton = ({
  id,
  frameCellCount,
  onMouseEnter,
  onMouseLeave,
}: {
  id: string;
  frameCellCount: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const { setResourceEditor } = useDraftMode();
  return (
    <div
      // Click-through wrapper so dragging empty frame content still moves the
      // frame; only the button captures events and blocks the drag.
      className={cn(
        "absolute inset-x-0 bottom-0 pointer-events-none",
        frameCellCount === 0 ? "flex items-center justify-center" : "px-5 pb-5",
      )}
      style={frameCellCount === 0 ? { top: NETWORK_FRAME_HEADER } : undefined}
    >
      <Button
        variant={"secondary"}
        size={"xs"}
        // h-9 is NETWORK_FRAME_ADD_BUTTON_H: the layout reserves exactly it.
        className={cn(
          "!px-3 !py-0 h-9 nodrag pointer-events-auto",
          frameCellCount > 0 && "w-full",
        )}
        // The row is created only once the modal saves. Clicks must not bubble;
        // a frame click drills in.
        onClick={(e) => {
          e.stopPropagation();
          setResourceEditor({ createInNetworkNodeId: id });
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <CirclePlusIcon size={12} />
        {t("common:word.addResource")}
      </Button>
    </div>
  );
};
