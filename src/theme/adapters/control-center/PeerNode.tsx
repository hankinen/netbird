"use client";

import Button from "@components/Button";
import { Position, useConnection } from "@xyflow/react";
import {
  AlertTriangleIcon,
  BotIcon,
  DownloadIcon,
  Loader2,
  MonitorSmartphoneIcon,
  ServerIcon,
} from "lucide-react";
import * as React from "react";
import RoundedFlag from "@/assets/countries/RoundedFlag";
import { t } from "@/i18n";
import {
  useCanvasUI,
  useDestinationGroup,
  useIsContextMenuTarget,
} from "@/modules/control-center/contexts/ControlCenterContext";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { AllHandles } from "@/modules/control-center/handles/AllHandles";
import { ConnectHandle } from "@/modules/control-center/handles/ConnectHandle";
import {
  PLACEHOLDER_BASE_NAMES,
  useAnySourceGroupEnabled,
} from "@/modules/control-center/utils/helpers";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard } from "@/theme/graph";
import { PeerNode as UpstreamPeerNode } from "../../../modules/control-center/nodes/PeerNode";
import { DraftTag, PeerOsIcon } from "./shared";

/**
 * Peer node (installed peer, or a placeholder dropped from the components
 * panel), replacing src/modules/control-center/nodes/PeerNode.tsx through
 * the `@/modules/control-center/nodes/PeerNode` alias. Same data, hooks,
 * modals and `cc-peer-install` button; the look is the graph layer's.
 * @replaces-file src/modules/control-center/nodes/PeerNode.tsx sha256:0e2e42f59dcf7e9f
 */
export * from "../../../modules/control-center/nodes/PeerNode";

type Props = Parameters<typeof UpstreamPeerNode>[0];

export const PeerNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedPeerNode {...props} />
  ) : (
    <UpstreamPeerNode {...props} />
  );

const PLACEHOLDER_ICON = {
  agent: BotIcon,
  "user-device": MonitorSmartphoneIcon,
  server: ServerIcon,
} as const;

function ThemedPeerNode({ data, id }: Props) {
  const {
    peer,
    enabled,
    onClick,
    showHandles = true,
    variant = "default",
    placeholderKind,
    placeholderName,
    setupKey,
  } = data;
  const sourceGroupEnabled = useAnySourceGroupEnabled(
    id,
    enabled !== undefined,
  );
  const isEnabled = enabled ?? sourceGroupEnabled;
  const isTarget = useConnection((c) => c.inProgress && c.fromNode.id !== id);
  const { placeholderIp } = useCanvasUI();
  const isContextTarget = useIsContextMenuTarget(id);
  const { selectedPeerPanel } = useDestinationGroup();
  const { setInstallModal, setUserDeviceModal } = useDraftMode();
  // Placeholder peers have no data.peer.id; they're keyed on the node id.
  const showHalo =
    isContextTarget ||
    (!!selectedPeerPanel &&
      selectedPeerPanel === (data.peer?.id ?? id.replace("peer-", "")));

  // A user-device placeholder that picked its peer renders as that peer.
  if (placeholderKind && !peer) {
    const Icon = PLACEHOLDER_ICON[placeholderKind] ?? ServerIcon;
    // Drops always assign a unique placeholderName; this is a fallback.
    const label = placeholderName || PLACEHOLDER_BASE_NAMES[placeholderKind];
    const isUserDevice = placeholderKind === "user-device";
    return (
      <GraphNodeCard
        nodeId={id}
        kind={"peer"}
        icon={<Icon size={16} />}
        title={label}
        titleExtra={<DraftTag />}
        // The placeholder IP is derived from the account's peer network range.
        meta={placeholderIp}
        labelMaxWidth={150}
        state={{
          selected: showHalo,
          connectTarget: isTarget,
          draft: true,
          warning: true,
        }}
        action={
          <Button
            variant={"secondary"}
            size={"xs"}
            data-testid={"cc-peer-install"}
            onClick={() =>
              isUserDevice
                ? setUserDeviceModal({ nodeId: id, name: label })
                : setInstallModal({
                    isUserDevice: false,
                    setupKey,
                    placeholderKind,
                    nodeId: id,
                  })
            }
          >
            {isUserDevice ? (
              <AlertTriangleIcon size={12} className={"text-yellow-400"} />
            ) : setupKey ? (
              // Waiting for the machine to register.
              <Loader2 size={12} className={"animate-spin"} />
            ) : (
              <DownloadIcon size={12} className={"text-yellow-400"} />
            )}
            {isUserDevice
              ? t("control-center.nodes:peerNode.text.installOrAssign")
              : setupKey
              ? t("common:word.waiting")
              : t("common:word.install")}
          </Button>
        }
      >
        {showHandles && (
          <>
            <AllHandles />
            <ConnectHandle type={"source"} position={Position.Left} />
            <ConnectHandle type={"source"} position={Position.Right} />
          </>
        )}
      </GraphNodeCard>
    );
  }

  return (
    <GraphNodeCard
      nodeId={id}
      kind={"peer"}
      variant={variant === "card" ? "card" : "plain"}
      icon={peer ? <PeerOsIcon os={peer.os} /> : null}
      flag={
        peer?.country_code ? (
          <RoundedFlag country={peer.country_code} size={10} />
        ) : undefined
      }
      title={peer?.name ?? t("common:word.unknownRegion")}
      meta={peer?.ip}
      labelMaxWidth={150}
      interactive={!!onClick}
      state={{
        selected: showHalo,
        connectTarget: isTarget,
        disabled: !isEnabled,
      }}
      onClick={() => peer && onClick?.(peer)}
    >
      {/* showHandles only gates the visible connect bubbles. */}
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
