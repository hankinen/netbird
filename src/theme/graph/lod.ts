"use client";

import { useStore } from "@xyflow/react";
import { useLayoutEffect } from "react";

/**
 * Semantic zoom ("level of detail") for the canvas. Below LOD_ZOOM_1 the
 * secondary line of every node (address, counts, protocol tag) is hidden;
 * below LOD_ZOOM_2 only the icon tile and the status dot remain. graph.css
 * keys the rules on `data-lod` of the `.react-flow` element, so no node
 * subscribes to the zoom itself: one component writes the attribute.
 */
export const LOD_ZOOM_1 = 0.6;
export const LOD_ZOOM_2 = 0.35;

export type LodLevel = 0 | 1 | 2;

export const lodLevel = (zoom: number): LodLevel =>
  zoom < LOD_ZOOM_2 ? 2 : zoom < LOD_ZOOM_1 ? 1 : 0;

const selectLevel = (s: { transform: [number, number, number] }) =>
  lodLevel(s.transform[2]);
const selectDom = (s: { domNode: HTMLDivElement | null }) => s.domNode;

/** Mount once inside a ReactFlowProvider; renders nothing. */
export function GraphLodSync() {
  const level = useStore(selectLevel);
  const dom = useStore(selectDom);
  useLayoutEffect(() => {
    if (!dom) return;
    dom.setAttribute("data-lod", String(level));
    return () => dom.removeAttribute("data-lod");
  }, [dom, level]);
  return null;
}
