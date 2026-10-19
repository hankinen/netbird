"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/contexts/ThemeProvider";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";

/**
 * The colour mode the React Flow canvas renders in. Upstream hard-codes
 * `colorMode="dark"` and a dark <Background>; in the AntD build the canvas
 * follows the dashboard's theme so the `.dark` class React Flow puts on the
 * canvas (which also switches every Tailwind `dark:` variant inside the
 * nodes) agrees with the rest of the page. Builds without the AntD theme
 * keep upstream's values, pixel for pixel.
 */
export type GraphColorMode = "dark" | "light";

const query = "(prefers-color-scheme: light)";
const subscribe = (cb: () => void) => {
  if (typeof window === "undefined") return () => undefined;
  const mql = window.matchMedia(query);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const systemIsLight = () =>
  typeof window !== "undefined" && window.matchMedia(query).matches;
const serverIsLight = () => true;

export function useGraphColorMode(): GraphColorMode {
  const { theme } = useTheme();
  const light = useSyncExternalStore(subscribe, systemIsLight, serverIsLight);
  if (!ANTD_THEME_ENABLED) return "dark";
  const resolved = theme === "system" ? (light ? "light" : "dark") : theme;
  return resolved === "dark" ? "dark" : "light";
}

/** Props for the canvas <Background>: tokens in the AntD build, upstream's literals otherwise. */
export const GRAPH_BACKGROUND = ANTD_THEME_ENABLED
  ? { bgColor: "var(--graph-bg)", color: "var(--graph-grid)" }
  : { bgColor: "#181a1d", color: "#717171" };
