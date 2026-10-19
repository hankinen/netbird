"use client";

import { Position } from "@xyflow/react";
import * as React from "react";
import AIProviderLogo from "@/modules/agent-network/AIProviderLogo";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { AllHandles } from "@/modules/control-center/handles/AllHandles";
import { ConnectHandle } from "@/modules/control-center/handles/ConnectHandle";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard } from "@/theme/graph";
import { ProviderNode as UpstreamProviderNode } from "../../../modules/control-center/nodes/ProviderNode";
import { DraftTag, isDraftId } from "./shared";

/**
 * AI provider node, replacing
 * src/modules/control-center/nodes/ProviderNode.tsx through its alias.
 * @replaces-file src/modules/control-center/nodes/ProviderNode.tsx sha256:00be471513ccf769
 */
export * from "../../../modules/control-center/nodes/ProviderNode";

type Props = Parameters<typeof UpstreamProviderNode>[0];

export const ProviderNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedProviderNode {...props} />
  ) : (
    <UpstreamProviderNode {...props} />
  );

function ThemedProviderNode({ data, id }: Props) {
  const enabled = data.enabled ?? true;
  const { isDraft } = useDraftMode();
  const draft = isDraftId(data.id);
  return (
    <GraphNodeCard
      nodeId={id}
      kind={"provider"}
      className={"cc-provider-node"}
      icon={<AIProviderLogo providerId={data.providerId} size={16} />}
      title={data.name}
      titleExtra={draft ? <DraftTag /> : undefined}
      meta={data.upstreamUrl}
      labelMaxWidth={180}
      // The pane's onNodeClick opens the provider; the card reads as clickable.
      interactive
      state={{ disabled: !enabled, draft }}
    >
      <AllHandles />
      {isDraft && (
        <>
          <ConnectHandle type={"source"} position={Position.Left} />
          <ConnectHandle type={"source"} position={Position.Right} />
        </>
      )}
    </GraphNodeCard>
  );
}
