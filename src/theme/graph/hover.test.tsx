import { act, cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { graphHover, hoverHandlers, useGraphEdgeEmphasis } from "./hover";

afterEach(() => {
  cleanup();
  graphHover.set(null);
});

function Edge({ source, target }: { source: string; target: string }) {
  const emphasis = useGraphEdgeEmphasis(source, target);
  return <span data-testid={`${source}-${target}`}>{emphasis}</span>;
}

describe("graph hover store", () => {
  it("emphasises only the edges touching the hovered node", () => {
    render(
      <>
        <Edge source={"a"} target={"b"} />
        <Edge source={"b"} target={"c"} />
        <Edge source={"c"} target={"d"} />
      </>,
    );
    act(() => graphHover.set("b"));
    expect(screen.getByTestId("a-b").textContent).toBe("hover");
    expect(screen.getByTestId("b-c").textContent).toBe("hover");
    expect(screen.getByTestId("c-d").textContent).toBe("none");
    act(() => graphHover.set(null));
    expect(screen.getByTestId("a-b").textContent).toBe("none");
  });

  it("clears on leave only when the leaving node is the hovered one", () => {
    const a = hoverHandlers("a");
    const b = hoverHandlers("b");
    act(() => a.onPointerEnter?.());
    act(() => b.onPointerEnter?.());
    // A late leave of the previous node must not drop the current hover.
    act(() => a.onPointerLeave?.());
    expect(graphHover.get()).toBe("b");
    act(() => b.onPointerLeave?.());
    expect(graphHover.get()).toBeNull();
  });

  it("gives a node without an id no handlers", () => {
    expect(hoverHandlers(undefined)).toEqual({});
  });
});
