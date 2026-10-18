import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GraphNodeCard } from "./GraphNodeCard";
import { GraphPill } from "./GraphPill";
import { graphHover } from "./hover";

afterEach(() => {
  cleanup();
  graphHover.set(null);
});

describe("GraphNodeCard", () => {
  it("renders title, meta and the state attributes graph.css keys on", () => {
    render(
      <GraphNodeCard
        kind={"group"}
        icon={<i />}
        title={"Developers"}
        meta={"5 Peers, 3 Users"}
        testId={"card"}
        state={{ selected: true, disabled: true, draft: true }}
      />,
    );
    const root = screen.getByTestId("card");
    expect(root).toHaveAttribute("data-kind", "group");
    expect(root).toHaveAttribute("data-variant", "card");
    expect(root).toHaveAttribute("data-selected");
    expect(root).toHaveAttribute("data-disabled");
    expect(root).toHaveAttribute("data-draft");
    expect(root).not.toHaveAttribute("data-drop-target");
    expect(root).not.toHaveAttribute("data-interactive");
    expect(screen.getByText("Developers")).toHaveAttribute(
      "data-graph-text",
      "title",
    );
    expect(screen.getByText("5 Peers, 3 Users")).toHaveAttribute(
      "data-graph-text",
      "meta",
    );
  });

  it("is interactive when it has a click handler and forwards the click", () => {
    const onClick = vi.fn();
    render(
      <GraphNodeCard
        kind={"peer"}
        icon={<i />}
        title={"laptop"}
        testId={"card"}
        onClick={onClick}
      />,
    );
    const root = screen.getByTestId("card");
    expect(root).toHaveAttribute("data-interactive");
    fireEvent.click(root);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("omits the meta line when there is none and keeps the label width as a CSS variable", () => {
    render(
      <GraphNodeCard
        kind={"peer"}
        icon={<i />}
        title={"laptop"}
        testId={"card"}
        labelMaxWidth={150}
      />,
    );
    const root = screen.getByTestId("card");
    expect(root.querySelector(".nb-graph-node__meta")).toBeNull();
    expect(root.style.getPropertyValue("--graph-label-max")).toBe("150px");
  });

  it("reports itself to the hover store while the pointer is over it", () => {
    render(
      <GraphNodeCard
        nodeId={"peer-1"}
        kind={"peer"}
        icon={<i />}
        title={"laptop"}
        testId={"card"}
      />,
    );
    const root = screen.getByTestId("card");
    fireEvent.pointerEnter(root);
    expect(graphHover.get()).toBe("peer-1");
    fireEvent.pointerLeave(root);
    expect(graphHover.get()).toBeNull();
  });
});

describe("GraphPill", () => {
  it("fades a disabled policy and shows its tag", () => {
    render(
      <GraphPill name={"Default"} tag={"TCP:22"} on={false} testId={"pill"} />,
    );
    const root = screen.getByTestId("pill");
    expect(root).toHaveAttribute("data-on", "false");
    expect(root).toHaveAttribute("data-disabled");
    expect(
      screen.getByText("TCP:22").closest("[data-graph-text]"),
    ).toHaveAttribute("data-graph-text", "tag");
  });
});
