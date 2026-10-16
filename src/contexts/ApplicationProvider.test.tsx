import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@axa-fr/react-oidc", () => ({
  useOidcUser: () => ({ oidcUser: { sub: "u1" } }),
}));
vi.mock("@utils/version", () => ({
  getLatestNetbirdRelease: vi.fn(async () => undefined),
}));
vi.mock("@utils/responsive", () => ({ useIsMd: () => false }));

const fetchSpy = vi.fn(async () => new Response("[]"));
vi.stubGlobal("fetch", fetchSpy);

const { default: ApplicationProvider } = await import(
  "@/contexts/ApplicationProvider"
);

describe("ApplicationProvider", () => {
  afterEach(() => fetchSpy.mockClear());

  it("renders children at once and sends no management request", () => {
    render(
      <ApplicationProvider>
        <p>workspace</p>
      </ApplicationProvider>,
    );
    expect(screen.getByText("workspace")).toBeTruthy();
    const managementCalls = fetchSpy.mock.calls.filter((call) =>
      String((call as unknown[])[0]).includes("/api/"),
    );
    expect(managementCalls).toEqual([]);
  });
});
