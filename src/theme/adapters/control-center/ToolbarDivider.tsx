"use client";

import * as React from "react";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphDockDivider } from "@/theme/graph";
import { ToolbarDivider as UpstreamToolbarDivider } from "../../../modules/control-center/toolbar/ToolbarDivider";

/**
 * Divider between toolbar groups, replacing
 * src/modules/control-center/toolbar/ToolbarDivider.tsx through its alias.
 * @replaces-file src/modules/control-center/toolbar/ToolbarDivider.tsx sha256:0105c26e43f5448d
 */
export * from "../../../modules/control-center/toolbar/ToolbarDivider";

type Props = Parameters<typeof UpstreamToolbarDivider>[0];

export const ToolbarDivider = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <GraphDockDivider {...props} />
  ) : (
    <UpstreamToolbarDivider {...props} />
  );
