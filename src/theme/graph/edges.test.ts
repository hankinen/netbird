import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { EDGE_TONES, edgeTone, markerId, resolveAnchors } from "./edges";

const rect = (x: number, y: number, width = 200, height = 50) => ({
  x,
  y,
  width,
  height,
});

describe("resolveAnchors", () => {
  it("leaves a source on its right and enters a target on its left when the source is left of the target", () => {
    const a = resolveAnchors(rect(0, 0), rect(500, 100));
    expect(a.sourcePosition).toBe(Position.Right);
    expect(a.targetPosition).toBe(Position.Left);
    expect(a.sx).toBe(200);
    expect(a.sy).toBe(25);
    expect(a.tx).toBe(500);
    expect(a.ty).toBe(125);
  });

  it("mirrors the sides when the source is right of the target", () => {
    const a = resolveAnchors(rect(500, 0), rect(0, 0));
    expect(a.sourcePosition).toBe(Position.Left);
    expect(a.targetPosition).toBe(Position.Right);
    expect(a.sx).toBe(500);
    expect(a.tx).toBe(200);
  });

  it("keeps a policy's sides fixed whatever the layout did", () => {
    // A mirrored policy (sources to its right) still takes them on its left
    // and sends destinations from its right.
    const a = resolveAnchors(rect(500, 0), rect(0, 0), { target: true });
    expect(a.sourcePosition).toBe(Position.Left);
    expect(a.targetPosition).toBe(Position.Left);
    expect(a.tx).toBe(0);
    const b = resolveAnchors(rect(500, 0), rect(0, 0), { source: true });
    expect(b.sourcePosition).toBe(Position.Right);
    expect(b.sx).toBe(700);
  });
});

describe("edge tones", () => {
  it("ranks disabled over emphasis over draft", () => {
    expect(edgeTone({ enabled: false, emphasis: true, draft: true })).toBe(
      "disabled",
    );
    expect(edgeTone({ enabled: true, emphasis: true, draft: true })).toBe(
      "emphasis",
    );
    expect(edgeTone({ enabled: true, draft: true })).toBe("draft");
    expect(edgeTone({ enabled: true })).toBe("default");
  });

  it("has one marker id per tone, the default one unsuffixed", () => {
    expect(markerId("default")).toBe("nb-graph-arrow");
    expect(new Set(EDGE_TONES.map(markerId)).size).toBe(EDGE_TONES.length);
    for (const tone of EDGE_TONES)
      expect(markerId(tone)).toMatch(/^nb-graph-arrow/);
  });
});
