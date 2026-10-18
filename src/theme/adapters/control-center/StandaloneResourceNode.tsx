"use client";

import Button from "@components/Button";
import { type Node, Position, useConnection } from "@xyflow/react";
import { AlertTriangleIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import { useIsContextMenuTarget } from "@/modules/control-center/contexts/ControlCenterContext";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { AllHandles } from "@/modules/control-center/handles/AllHandles";
import { ConnectHandle } from "@/modules/control-center/handles/ConnectHandle";
import {
  getDraftResource,
  getResourceNodeEnabled,
} from "@/modules/control-center/utils/helpers";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard, GraphTag } from "@/theme/graph";
import { StandaloneResourceNode as UpstreamStandaloneResourceNode } from "../../../modules/control-center/nodes/StandaloneResourceNode";
import { DraftTag, ResourceTypeIcon } from "./shared";

/**
 * A resource as a standalone card (destination column, draft, drilled
 * network), replacing
 * src/modules/control-center/nodes/StandaloneResourceNode.tsx through its
 * alias. The network it belongs to is a tag next to the name; a draft
 * resource without one carries the "No Network" action above the card.
 * @replaces-file src/modules/control-center/nodes/StandaloneResourceNode.tsx sha256:2d52acbd096b7b68
 */
export * from "../../../modules/control-center/nodes/StandaloneResourceNode";

type Props = Parameters<typeof UpstreamStandaloneResourceNode>[0];

export const StandaloneResourceNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedStandaloneResourceNode {...props} />
  ) : (
    <UpstreamStandaloneResourceNode {...props} />
  );

function ThemedStandaloneResourceNode({
  id,
  data,
  hideNetwork = false,
}: Props) {
  const { showHandles = false } = data;
  const { isDraft, setResourceEditor, setResourceNetworkPicker } =
    useDraftMode();
  const showHalo = useIsContextMenuTarget(id);
  const isTarget = useConnection((c) => c.inProgress && c.fromNode.id !== id);

  const isDraftResource = id.startsWith("resource-new-");
  const node = { id, data, position: { x: 0, y: 0 } } as Node;
  const resource = isDraftResource ? getDraftResource(node) : data.resource;
  if (!resource) return null;

  // The live single-network view renders the same card read-only.
  const editable = isDraft;
  // An empty ref still reads as "No Network".
  const network = data.draftNetwork;
  const hasNetwork = !!(network?.networkId || network?.networkClientId);
  const showNoNetwork = !hasNetwork && editable && !hideNetwork;

  return (
    <GraphNodeCard
      nodeId={id}
      kind={"resource"}
      icon={<ResourceTypeIcon type={resource.type} />}
      title={resource.name}
      titleExtra={
        <>
          {hasNetwork && !hideNetwork && (
            // Existing resources can't be reassigned in v1.
            <GraphTag
              className={isDraftResource ? "cursor-pointer" : undefined}
            >
              <span
                className={"truncate max-w-[110px]"}
                onClick={(e) => {
                  if (!isDraftResource) return;
                  e.stopPropagation();
                  setResourceNetworkPicker({ nodeId: id });
                }}
              >
                {network!.name}
              </span>
            </GraphTag>
          )}
          {isDraftResource && <DraftTag />}
        </>
      }
      meta={
        resource.address ||
        t("control-center.nodes:resourceNode.text.iPCIDROrDomain")
      }
      labelMaxWidth={140}
      interactive={editable}
      state={{
        selected: showHalo,
        connectTarget: isTarget,
        disabled:
          data.enabled === false || !getResourceNodeEnabled({ id, data }),
        draft: isDraftResource,
        warning: showNoNetwork,
      }}
      action={
        showNoNetwork ? (
          <Button
            variant={"secondary"}
            size={"xs"}
            onClick={(e) => {
              e.stopPropagation();
              setResourceNetworkPicker({ nodeId: id });
            }}
          >
            <AlertTriangleIcon size={12} className={"text-yellow-400"} />
            {t("common:word.noNetwork")}
          </Button>
        ) : undefined
      }
      onClick={() => {
        if (editable) setResourceEditor({ nodeId: id });
      }}
    >
      <AllHandles />
      {isDraft && showHandles && (
        <ConnectHandle type={"source"} position={Position.Left} />
      )}
    </GraphNodeCard>
  );
}
