"use client";

import {
  FolderGit2,
  MonitorSmartphoneIcon,
  NetworkIcon,
  UsersIcon,
} from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import { useAgentNetworkMode } from "@/modules/agent-network/useAgentNetworkMode";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphSegmented, type GraphSegmentedItem } from "@/theme/graph";
import {
  FlowSelector as UpstreamFlowSelector,
  FlowView,
} from "../../../modules/control-center/header/FlowSelector";

/**
 * View switch (Peer / User / Group / Networks), replacing
 * src/modules/control-center/header/FlowSelector.tsx through its alias: one
 * segmented control at every width, same `cc-flow-*` test ids.
 * @replaces-file src/modules/control-center/header/FlowSelector.tsx sha256:b1191014e9717e46
 */
export * from "../../../modules/control-center/header/FlowSelector";

type Props = Parameters<typeof UpstreamFlowSelector>[0];

export const FlowSelector = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedFlowSelector {...props} />
  ) : (
    <UpstreamFlowSelector {...props} />
  );

function ThemedFlowSelector({ value, onChange }: Props) {
  const { only: agentNetworkOnly } = useAgentNetworkMode();
  const items: GraphSegmentedItem<FlowView>[] = [
    {
      value: FlowView.PEERS,
      label: t("control-center.header:flowSelector.label.peer"),
      icon: MonitorSmartphoneIcon,
      testId: "cc-flow-peers",
    },
    {
      value: FlowView.USERS,
      label: t("common:word.user"),
      icon: UsersIcon,
      testId: "cc-flow-users",
    },
    {
      value: FlowView.GROUPS,
      label: t("control-center.header:flowSelector.label.group"),
      icon: FolderGit2,
      testId: "cc-flow-groups",
    },
  ];
  // The agent-network repackaging drops Networks as a top-level pivot.
  if (!agentNetworkOnly) {
    items.push({
      value: FlowView.NETWORKS,
      label: t("common:word.networks"),
      icon: NetworkIcon,
      testId: "cc-flow-networks",
    });
  }
  return (
    <GraphSegmented
      value={value}
      onChange={(v) => onChange?.(v)}
      items={items}
      ariaLabel={t("components.graph:toolbar.text.views")}
    />
  );
}
