import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import Badge, { TAG_ROLE, TAG_SIZE } from "./Badge";

afterEach(cleanup);

const badge = (ui: React.ReactElement) =>
  render(ui).container.firstElementChild as HTMLElement;

describe("Badge adapter", () => {
  it("renders the upstream badge and writes the role and size of its variant", () => {
    const b = badge(
      <Badge variant={"green"} size={"xs"}>
        online
      </Badge>,
    );
    expect(b.dataset.nbTag).toBe("success");
    expect(b.dataset.nbSize).toBe("xs");
    expect(b.dataset.nbHover).toBeUndefined();
    // Upstream's classes stay: dark and the themeless builds render as before.
    expect(b.className).toContain("rounded-md");
    expect(b.textContent).toBe("online");
  });

  it("defaults to upstream's blue (info) and the default size", () => {
    const b = badge(<Badge>3</Badge>);
    expect(b.dataset.nbTag).toBe("info");
    expect(b.dataset.nbSize).toBe("default");
  });

  it("maps every upstream variant and size", () => {
    for (const [variant, role] of Object.entries(TAG_ROLE)) {
      const b = badge(
        <Badge variant={variant as keyof typeof TAG_ROLE}>x</Badge>,
      );
      expect(b.dataset.nbTag, variant).toBe(role);
      cleanup();
    }
    for (const [size, mapped] of Object.entries(TAG_SIZE)) {
      const b = badge(<Badge size={size as keyof typeof TAG_SIZE}>x</Badge>);
      expect(b.dataset.nbSize, size).toBe(mapped);
      cleanup();
    }
  });

  it("marks hoverable badges and forwards the other props", () => {
    const b = badge(
      <Badge variant={"gray"} useHover className={"ml-2"} data-testid={"g"}>
        2 Groups
      </Badge>,
    );
    expect(b.hasAttribute("data-nb-hover")).toBe(true);
    expect(b.dataset.testid).toBe("g");
    expect(b.className).toContain("ml-2");
  });
});
