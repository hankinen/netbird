"use client";

import { useSyncExternalStore } from "react";

/**
 * Which node the pointer is over, as a tiny external store: the node
 * primitives write it on pointer enter / leave and every edge reads it with
 * a selector that only flips when the edge's own endpoints are involved, so
 * a hover re-renders the handful of connected edges and nothing else.
 */
let hovered: string | null = null;
const listeners = new Set<() => void>();

export const graphHover = {
  get: () => hovered,
  set(id: string | null) {
    if (hovered === id) return;
    hovered = id;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export type EdgeEmphasis = "none" | "hover";

const none = () => "none" as const;

/** True while the pointer is over either endpoint of the edge. */
export function useGraphEdgeEmphasis(
  source: string,
  target: string,
): EdgeEmphasis {
  return useSyncExternalStore(
    graphHover.subscribe,
    () => {
      const h = hovered;
      return h !== null && (h === source || h === target) ? "hover" : "none";
    },
    none,
  );
}

/** Pointer handlers a node root spreads to report itself as hovered. */
export const hoverHandlers = (id: string | undefined) =>
  id
    ? {
        onPointerEnter: () => graphHover.set(id),
        onPointerLeave: () => {
          if (hovered === id) graphHover.set(null);
        },
      }
    : {};
