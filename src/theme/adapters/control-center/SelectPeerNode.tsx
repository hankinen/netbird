"use client";

import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import useFetchApi from "@utils/api";
import { Handle, Position } from "@xyflow/react";
import { sortBy } from "lodash";
import { ChevronsUpDown, MonitorSmartphoneIcon } from "lucide-react";
import * as React from "react";
import RoundedFlag from "@/assets/countries/RoundedFlag";
import { t } from "@/i18n";
import type { Peer } from "@/interfaces/Peer";
import { useCloseOnCanvasClick } from "@/modules/control-center/hooks/useCloseOnCanvasClick";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard } from "@/theme/graph";
import { SelectPeerNode as UpstreamSelectPeerNode } from "../../../modules/control-center/nodes/SelectPeerNode";
import { PeerOsIcon } from "./shared";

/**
 * The peer selector at the root of the peer view, replacing
 * src/modules/control-center/nodes/SelectPeerNode.tsx through its alias.
 * @replaces-file src/modules/control-center/nodes/SelectPeerNode.tsx sha256:96f7acc0cfc6a836
 */
export * from "../../../modules/control-center/nodes/SelectPeerNode";

type Props = Parameters<typeof UpstreamSelectPeerNode>[0];

export const SelectPeerNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedSelectPeerNode {...props} />
  ) : (
    <UpstreamSelectPeerNode {...props} />
  );

function ThemedSelectPeerNode({ data, id }: Props) {
  const { data: peers } = useFetchApi<Peer[]>("/peers");
  const userId = data?.userId;

  const peerSelectOptions: SelectOption[] = React.useMemo(
    () =>
      sortBy(
        peers
          ?.filter((p) => !userId || p.user_id === userId)
          .map(
            (p) =>
              ({
                value: p.id,
                label: p.name,
                icon: () => <PeerOsIcon os={p.os} size={16} />,
              }) as SelectOption,
          ) || [],
        ["label", "value"],
        "asc",
      ),
    [peers, userId],
  );

  const peer = peers?.find((p) => p.id === data.currentPeer);

  const [open, setOpen] = React.useState(false);
  useCloseOnCanvasClick(open, () => setOpen(false));

  return (
    <SelectNodeShell open={open}>
      <SelectDropdown
        variant={"secondary"}
        deferChange
        value={data.currentPeer}
        onChange={data.onPeerChange}
        options={peerSelectOptions}
        showSearch={true}
        searchPlaceholder={
          data?.placeholder ??
          t("control-center.nodes:selectPeerNode.text.searchPeers")
        }
        open={open}
        onOpenChange={setOpen}
        popoverWidth={280}
        triggerClassName={"nb-graph-select__trigger"}
        size={"xs"}
        maxHeight={300}
      >
        <GraphNodeCard
          nodeId={id}
          kind={"peer"}
          className={"nb-graph-select__card"}
          icon={
            peer ? (
              <PeerOsIcon os={peer.os} />
            ) : (
              <MonitorSmartphoneIcon size={16} />
            )
          }
          flag={
            peer?.country_code ? (
              <RoundedFlag country={peer.country_code} size={10} />
            ) : undefined
          }
          title={peer?.name ?? t("common:word.peers")}
          meta={peer?.ip}
          labelMaxWidth={180}
          interactive
          trailing={<ChevronsUpDown size={16} />}
          state={{ selected: open }}
        />
      </SelectDropdown>
    </SelectNodeShell>
  );
}

/** Wrapper of the three selector nodes: the trigger plus the edge ports. */
export function SelectNodeShell({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={"nb-graph-select"} data-open={open ? "" : undefined}>
      {children}
      <Handle
        type={"source"}
        position={Position.Right}
        id={"sr"}
        className={"nb-graph-select__port"}
      />
      <Handle
        type={"target"}
        position={Position.Left}
        id={"tl"}
        className={"opacity-0"}
      />
    </div>
  );
}
