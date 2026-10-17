"use client";

import * as React from "react";
import {
  type LayoutMode,
  layoutModeFor,
  MEDIA,
} from "@/theme/tokens/breakpoints";

/** What the static export renders with: no viewport is known on the server. */
export const SERVER_LAYOUT_MODE: LayoutMode = "full";

function currentMode(): LayoutMode {
  if (typeof window === "undefined") return SERVER_LAYOUT_MODE;
  if (typeof window.matchMedia === "function") {
    if (window.matchMedia(MEDIA.phone).matches) return "phone";
    if (window.matchMedia(MEDIA.full).matches) return "full";
    return "compact";
  }
  // jsdom and very old browsers: fall back to the viewport width.
  return layoutModeFor(window.innerWidth);
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return () => {};
  const queries = [window.matchMedia(MEDIA.phone), window.matchMedia(MEDIA.full)];
  for (const q of queries) q.addEventListener?.("change", onChange);
  return () => {
    for (const q of queries) q.removeEventListener?.("change", onChange);
  };
}

/**
 * The layout mode the viewport is in: "phone" | "compact" | "full".
 *
 * Use it only for behaviour that CSS cannot express (a Modal that becomes a
 * full-screen Sheet, a Select that opens as a bottom panel, where the page
 * header renders). Pure styling differences stay in CSS media queries built
 * from the same breakpoints, so the first paint is right before hydration.
 * During hydration the hook reports SERVER_LAYOUT_MODE and switches to the
 * real mode right after, which is what the static export needs.
 */
export function useLayoutMode(): LayoutMode {
  return React.useSyncExternalStore(
    subscribe,
    currentMode,
    () => SERVER_LAYOUT_MODE,
  );
}

/** True below 768px. */
export function useIsPhone(): boolean {
  return useLayoutMode() === "phone";
}

/**
 * Mirrors the mode onto `<html data-layout-mode="…">` so a stylesheet can key
 * on it for states that only JavaScript knows. Mounted once in AppLayout (and
 * in the Storybook preview). CSS must not depend on the attribute for the
 * first paint: it is set in an effect, after hydration.
 */
export function LayoutModeSync(): null {
  const mode = useLayoutMode();
  React.useEffect(() => {
    document.documentElement.dataset.layoutMode = mode;
  }, [mode]);
  return null;
}
