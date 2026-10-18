"use client";

import { MoreHorizontal } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard } from "@/theme/graph";
import { MoreResourcesNode as UpstreamMoreResourcesNode } from "../../../modules/control-center/nodes/MoreResourcesNode";

/**
 * The "+N more" cell a network frame overlays past its visible rows (not a
 * React Flow node), replacing
 * src/modules/control-center/nodes/MoreResourcesNode.tsx through its alias.
 * @replaces-file src/modules/control-center/nodes/MoreResourcesNode.tsx sha256:9f473d8505b796e1
 */
export * from "../../../modules/control-center/nodes/MoreResourcesNode";

type Props = Parameters<typeof UpstreamMoreResourcesNode>[0];

export const MoreResourcesNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedMoreResourcesNode {...props} />
  ) : (
    <UpstreamMoreResourcesNode {...props} />
  );

function ThemedMoreResourcesNode({ count, style }: Props) {
  return (
    <GraphNodeCard
      kind={"resource"}
      variant={"row"}
      icon={<MoreHorizontal size={16} />}
      title={t("control-center.nodes:moreResourcesNode.text.more", { count })}
      interactive
      style={{ position: "absolute", ...style }}
    />
  );
}
