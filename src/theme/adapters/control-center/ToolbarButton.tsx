"use client";

import * as React from "react";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphDockButton } from "@/theme/graph";
import { ToolbarButton as UpstreamToolbarButton } from "../../../modules/control-center/toolbar/ToolbarButton";

/**
 * Button of the canvas toolbars (draft tools, selection toolbar), replacing
 * src/modules/control-center/toolbar/ToolbarButton.tsx through its alias.
 * @replaces-file src/modules/control-center/toolbar/ToolbarButton.tsx sha256:b55a837cd0b5667b
 */
export * from "../../../modules/control-center/toolbar/ToolbarButton";

type Props = Parameters<typeof UpstreamToolbarButton>[0];

export const ToolbarButton = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <GraphDockButton {...props} />
  ) : (
    <UpstreamToolbarButton {...props} />
  );
