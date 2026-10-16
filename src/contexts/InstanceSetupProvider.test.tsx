import { cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchInstanceStatus = vi.fn();
const replace = vi.fn();
let pathname = "/peers";
let cloud = false;

vi.mock("@/utils/unauthenticatedApi", () => ({
  fetchInstanceStatus: () => fetchInstanceStatus(),
}));
vi.mock("@utils/config", () => ({
  default: () => ({ apiOrigin: "https://api.example.com" }),
}));
vi.mock("@utils/netbird", () => ({ isNetBirdCloud: () => cloud }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
}));
vi.mock("@/components/ui/FullScreenLoading", () => ({
  default: () => <p>loading</p>,
}));

const {
  default: InstanceSetupProvider,
  prefetchInstanceStatus,
  resetInstanceStatusRequest,
} = await import("@/contexts/InstanceSetupProvider");

const renderProvider = () =>
  render(
    <InstanceSetupProvider>
      <p>app</p>
    </InstanceSetupProvider>,
  );

describe("InstanceSetupProvider", () => {
  beforeEach(() => {
    resetInstanceStatusRequest();
    fetchInstanceStatus.mockReset();
    replace.mockReset();
    pathname = "/peers";
    cloud = false;
  });
  afterEach(cleanup);

  it("prefetch and provider share exactly one request", async () => {
    fetchInstanceStatus.mockResolvedValue({ setup_required: false });
    prefetchInstanceStatus();
    renderProvider();
    expect(await screen.findByText("app")).toBeTruthy();
    expect(fetchInstanceStatus).toHaveBeenCalledTimes(1);
  });

  it("redirects to /setup when setup is required", async () => {
    fetchInstanceStatus.mockResolvedValue({ setup_required: true });
    renderProvider();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/setup"));
    expect(screen.queryByText("app")).toBeNull();
  });

  it("continues when the endpoint fails (older management)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchInstanceStatus.mockRejectedValue({ code: 404, message: "Not Found" });
    prefetchInstanceStatus();
    renderProvider();
    expect(await screen.findByText("app")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
    expect(fetchInstanceStatus).toHaveBeenCalledTimes(1);
  });

  it("cloud skips the check", async () => {
    cloud = true;
    prefetchInstanceStatus();
    renderProvider();
    expect(await screen.findByText("app")).toBeTruthy();
    expect(fetchInstanceStatus).not.toHaveBeenCalled();
  });
});
