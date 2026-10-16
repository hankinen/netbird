import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRuntimeConfigLoader } from "./loader";
import { RuntimeConfigProvider, useRuntimeConfig } from "./RuntimeConfigProvider";
import { getRuntimeConfig, resetRuntimeConfig } from "./store";
import { validRuntimeConfigJson } from "./testing-fixtures";

vi.mock("@/assets/icons/NetBirdIcon", () => ({ default: () => null }));

const Child = () => <div data-testid={"child"}>{useRuntimeConfig().clientId}</div>;

const ok = () =>
  new Response(JSON.stringify(validRuntimeConfigJson()), { status: 200 });

beforeEach(() => {
  resetRuntimeConfigLoader();
  resetRuntimeConfig();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RuntimeConfigProvider", () => {
  it("renders children only after the config is loaded and stored", async () => {
    const fetchMock = vi.fn(async () => ok());
    vi.stubGlobal("fetch", fetchMock);
    const onLoaded = vi.fn();
    render(
      <RuntimeConfigProvider onLoaded={onLoaded}>
        <Child />
      </RuntimeConfigProvider>,
    );
    expect(screen.queryByTestId("child")).toBeNull();
    expect((await screen.findByTestId("child")).textContent).toBe(
      "netbird-dashboard",
    );
    expect(getRuntimeConfig().clientId).toBe("netbird-dashboard");
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it("shows the error screen instead of spinning, and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);
    render(
      <RuntimeConfigProvider>
        <Child />
      </RuntimeConfigProvider>,
    );
    const error = await screen.findByTestId("runtime-config-error");
    expect(error.getAttribute("data-kind")).toBe("missing");
    expect(error.textContent).toContain("Dashboard configuration not found");
    fireEvent.click(screen.getByText("Try again"));
    expect(await screen.findByTestId("child")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
