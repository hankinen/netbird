import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

afterEach(cleanup);

describe("Input adapter", () => {
  it("renders the upstream input with the default role", () => {
    const { container } = render(<Input placeholder={"Name"} />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.dataset.nbInput).toBe("default");
    expect(input.placeholder).toBe("Name");
    // Upstream's wrapper and classes stay.
    expect(input.parentElement?.className).toContain("relative");
    expect(input.className).toContain("rounded-md");
  });

  it("marks errors, from the error text or the error variant", () => {
    const a = render(<Input error={"Required"} />).container;
    expect(a.querySelector("input")?.dataset.nbInput).toBe("error");
    expect(a.textContent).toContain("Required");
    cleanup();
    const b = render(<Input variant={"error"} />).container;
    expect(b.querySelector("input")?.dataset.nbInput).toBe("error");
    cleanup();
    const c = render(<Input variant={"darker"} />).container;
    expect(c.querySelector("input")?.dataset.nbInput).toBe("default");
  });

  it("forwards the ref and the other props", () => {
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(
      <Input ref={ref} data-testid={"t"} disabled className={"w-20"} />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(ref.current).toBe(input);
    expect(input.dataset.testid).toBe("t");
    expect(input.disabled).toBe(true);
    expect(input.className).toContain("w-20");
  });
});

describe("Textarea adapter", () => {
  it("renders the upstream textarea with its role", () => {
    const a = render(<Textarea placeholder={"Notes"} />).container;
    const ta = a.querySelector("textarea") as HTMLTextAreaElement;
    expect(ta.dataset.nbTextarea).toBe("default");
    expect(ta.placeholder).toBe("Notes");
    cleanup();
    const b = render(<Textarea error={"Too long"} />).container;
    expect(b.querySelector("textarea")?.dataset.nbTextarea).toBe("error");
    expect(b.textContent).toContain("Too long");
  });

  it("forwards the ref", () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    const { container } = render(<Textarea ref={ref} rows={3} />);
    expect(ref.current).toBe(container.querySelector("textarea"));
    expect(ref.current?.rows).toBe(3);
  });
});
