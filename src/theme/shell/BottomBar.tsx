"use client";

import React from "react";
import { usePageHeaderSpec, usePageHeaderStore } from "./pageHeader";
import { ActionButton } from "./PageHeaderBar";

/**
 * Phone-only bar with the page's primary action (decision 3) and the actions
 * the DataTable adapter teleports on phones (its slot is the "bottom" host
 * of the store). Rendered in the main column below the page scroller, so
 * the content shrinks above it instead of being covered; shell.css shows it
 * on phones only, and only while it has something in it.
 */
export function BottomBar() {
  const spec = usePageHeaderSpec();
  const store = usePageHeaderStore();
  const setHost = React.useCallback(
    (el: HTMLDivElement | null) => store?.setHost("bottom", el),
    [store],
  );
  if (!spec) return null;
  return (
    <div className={"nb-bottombar"} data-testid={"bottom-bar"}>
      {spec.primaryAction && (
        <ActionButton
          action={{ ...spec.primaryAction, variant: "primary" }}
          className={"nb-bottombar__primary"}
        />
      )}
      <div className={"nb-bottombar__slot"} ref={setHost} />
    </div>
  );
}
