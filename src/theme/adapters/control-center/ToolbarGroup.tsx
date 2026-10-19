"use client";

import * as React from "react";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphDockGroup } from "@/theme/graph";
import { ToolbarGroup as UpstreamToolbarGroup } from "../../../modules/control-center/toolbar/ToolbarGroup";

/**
 * Group of toolbar buttons, replacing
 * src/modules/control-center/toolbar/ToolbarGroup.tsx through its alias.
 * @replaces-file src/modules/control-center/toolbar/ToolbarGroup.tsx sha256:4657d1053f87eb23
 */
export * from "../../../modules/control-center/toolbar/ToolbarGroup";

type Props = Parameters<typeof UpstreamToolbarGroup>[0];

export const ToolbarGroup = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <GraphDockGroup {...props} />
  ) : (
    <UpstreamToolbarGroup {...props} />
  );
