import ButtonGroup from "@components/ButtonGroup";
import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Button, { BUTTON_ROLE, BUTTON_SIZE } from "./Button";

afterEach(cleanup);

const button = (ui: React.ReactElement) =>
  render(ui).container.querySelector("button") as HTMLButtonElement;

describe("Button adapter", () => {
  it("renders the upstream button and writes the role and size of its variant", () => {
    const b = button(
      <Button variant={"primary"} size={"xs"}>
        Add
      </Button>,
    );
    expect(b.dataset.nbBtn).toBe("primary");
    expect(b.dataset.nbSize).toBe("sm");
    expect(b.dataset.nbGrouped).toBeUndefined();
    // Upstream's classes stay: dark and the themeless builds render as before.
    expect(b.className).toContain("inline-flex");
    expect(b.getAttribute("type")).toBe("button");
  });

  it("defaults to the default role and the md size", () => {
    const b = button(<Button>Plain</Button>);
    expect(b.dataset.nbBtn).toBe("default");
    expect(b.dataset.nbSize).toBe("md");
  });

  it("maps every upstream variant and size", () => {
    for (const [variant, role] of Object.entries(BUTTON_ROLE)) {
      const b = button(
        <Button variant={variant as keyof typeof BUTTON_ROLE}>x</Button>,
      );
      expect(b.dataset.nbBtn, variant).toBe(role);
      cleanup();
    }
    for (const [size, mapped] of Object.entries(BUTTON_SIZE)) {
      const b = button(
        <Button size={size as keyof typeof BUTTON_SIZE}>x</Button>,
      );
      expect(b.dataset.nbSize, size).toBe(mapped);
      cleanup();
    }
  });

  it("marks ButtonGroup segments (upstream passes border={2})", () => {
    const { container } = render(
      <ButtonGroup>
        <ButtonGroup.Button variant={"tertiary"}>A</ButtonGroup.Button>
        <ButtonGroup.Button variant={"secondary"}>B</ButtonGroup.Button>
      </ButtonGroup>,
    );
    const [a, b] = Array.from(container.querySelectorAll("button"));
    expect(a.hasAttribute("data-nb-grouped")).toBe(true);
    expect(a.dataset.nbBtn).toBe("active");
    expect(b.hasAttribute("data-nb-grouped")).toBe(true);
    expect(b.dataset.nbBtn).toBe("default");
  });

  it("forwards the ref, the other props and clicks", () => {
    const ref = React.createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    const b = button(
      <Button ref={ref} onClick={onClick} data-testid={"go"} className={"px-3"}>
        Go
      </Button>,
    );
    expect(ref.current).toBe(b);
    expect(b.dataset.testid).toBe("go");
    expect(b.className).toContain("px-3");
    b.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
