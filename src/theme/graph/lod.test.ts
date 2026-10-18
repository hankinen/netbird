import { describe, expect, it } from "vitest";
import { LOD_ZOOM_1, LOD_ZOOM_2, lodLevel } from "./lod";

describe("lodLevel", () => {
  it("shows everything at and above the first threshold", () => {
    expect(lodLevel(1.6)).toBe(0);
    expect(lodLevel(0.8)).toBe(0);
    expect(lodLevel(LOD_ZOOM_1)).toBe(0);
  });

  it("hides the secondary line between the thresholds", () => {
    expect(lodLevel(LOD_ZOOM_1 - 0.01)).toBe(1);
    expect(lodLevel(LOD_ZOOM_2)).toBe(1);
  });

  it("keeps only tiles and dots below the second threshold", () => {
    expect(lodLevel(LOD_ZOOM_2 - 0.01)).toBe(2);
    expect(lodLevel(0.2)).toBe(2);
  });

  it("orders the thresholds", () => {
    expect(LOD_ZOOM_2).toBeLessThan(LOD_ZOOM_1);
  });
});
