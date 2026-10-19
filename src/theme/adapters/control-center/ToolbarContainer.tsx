"use client";

import * as React from "react";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphDock } from "@/theme/graph";
import { ToolbarContainer as UpstreamToolbarContainer } from "../../../modules/control-center/toolbar/ToolbarContainer";

/**
 * Container of the canvas toolbars, replacing
 * src/modules/control-center/toolbar/ToolbarContainer.tsx through its alias.
 * @replaces-file src/modules/control-center/toolbar/ToolbarContainer.tsx sha256:3fa2e0582b1a5d63
 */
export * from "../../../modules/control-center/toolbar/ToolbarContainer";

type Props = Parameters<typeof UpstreamToolbarContainer>[0];

export const ToolbarContainer = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <GraphDock {...props} />
  ) : (
    <UpstreamToolbarContainer {...props} />
  );
