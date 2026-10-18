import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@axa-fr/react-oidc", () => ({
  useOidcUser: () => ({ oidcUser: { sub: "u1" } }),
}));
const getLatestNetbirdRelease = vi.fn(async () => undefined);
vi.mock("@utils/version", () => ({ getLatestNetbirdRelease }));
vi.mock("@utils/responsive", () => ({ useIsMd: () => false }));

const fetchSpy = vi.fn(async () => new Response("[]"));
vi.stubGlobal("fetch", fetchSpy);

const { default: ApplicationProvider, useApplicationContext } = await import(
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

  // @theme: the GitHub release check is disabled (src/theme/README.md "版本信息卡片").
  it("does not ask GitHub for the latest release", () => {
    render(
      <ApplicationProvider>
        <p>workspace</p>
      </ApplicationProvider>,
    );
    expect(getLatestNetbirdRelease).not.toHaveBeenCalled();
    const githubCalls = fetchSpy.mock.calls.filter((call) =>
      String((call as unknown[])[0]).includes("api.github.com"),
    );
    expect(githubCalls).toEqual([]);
  });

  it("ignores a release cached by an older build", () => {
    localStorage.setItem(
      "netbird-latest-release",
      JSON.stringify({ latest_version: "0.1.0", url: "https://example.com" }),
    );
    const Latest = () => (
      <p>latest:{useApplicationContext().latestVersion ?? "none"}</p>
    );
    render(
      <ApplicationProvider>
        <Latest />
      </ApplicationProvider>,
    );
    expect(screen.getByText("latest:none")).toBeTruthy();
    localStorage.removeItem("netbird-latest-release");
  });
});
