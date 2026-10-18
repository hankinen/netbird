"use client";

import React from "react";
import { usePageHeaderSpec } from "./pageHeader";
import { ActionButton } from "./PageHeaderBar";

/**
 * Phone-only bar with the page's primary action (decision 3). Rendered in
 * the main column below the page scroller, so the content shrinks above it
 * instead of being covered; shell.css hides it from tablets up.
 */
export function BottomBar() {
  const spec = usePageHeaderSpec();
  if (!spec?.primaryAction) return null;
  return (
    <div className={"nb-bottombar"} data-testid={"bottom-bar"}>
      <ActionButton
        action={{ ...spec.primaryAction, variant: "primary" }}
        className={"nb-bottombar__primary"}
      />
    </div>
  );
}
