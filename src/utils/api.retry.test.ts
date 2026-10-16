import { describe, expect, it, vi } from "vitest";

vi.mock("@utils/config", () => ({ default: () => ({}) }));
vi.mock("@utils/helpers", () => ({ sleep: vi.fn(async () => undefined) }));

const { withTransientRetries } = await import("@utils/api");

describe("withTransientRetries", () => {
  it("retries network errors and 5xx up to the limit", async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce({ code: 502, message: "bad gateway" })
      .mockResolvedValueOnce("ok");
    await expect(withTransientRetries(request, 3)).resolves.toBe("ok");
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("gives up after the limit", async () => {
    const request = vi.fn().mockRejectedValue({ code: 500, message: "x" });
    await expect(withTransientRetries(request, 3)).rejects.toEqual({
      code: 500,
      message: "x",
    });
    expect(request).toHaveBeenCalledTimes(4);
  });

  it.each([401, 403, 404])("does not retry %i", async (code) => {
    const request = vi.fn().mockRejectedValue({ code, message: "x" });
    await expect(withTransientRetries(request, 3)).rejects.toBeTruthy();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("does not retry by default", async () => {
    const request = vi.fn().mockRejectedValue(new TypeError("offline"));
    await expect(withTransientRetries(request)).rejects.toBeTruthy();
    expect(request).toHaveBeenCalledTimes(1);
  });
});
