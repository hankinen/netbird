import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadRuntimeConfig, resetRuntimeConfigLoader } from "./loader";
import { validRuntimeConfigJson } from "./testing-fixtures";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => resetRuntimeConfigLoader());
afterEach(() => vi.useRealTimers());

describe("loadRuntimeConfig", () => {
  it("fetches /runtime-config.json without caching and parses it", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(validRuntimeConfigJson()));
    const res = await loadRuntimeConfig({ fetchImpl });
    expect(res.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      "/runtime-config.json",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("reports 404 as missing", async () => {
    const fetchImpl = vi.fn(async () => new Response("Not Found", { status: 404 }));
    expect(await loadRuntimeConfig({ fetchImpl })).toMatchObject({
      ok: false,
      kind: "missing",
    });
  });

  it("reports an HTML fallback page as invalid", async () => {
    const fetchImpl = vi.fn(async () => new Response("<!DOCTYPE html>", { status: 200 }));
    expect(await loadRuntimeConfig({ fetchImpl })).toMatchObject({
      ok: false,
      kind: "invalid",
    });
  });

  it("reports schemaVersion 2 as incompatible", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ ...validRuntimeConfigJson(), schemaVersion: 2 }),
    );
    expect(await loadRuntimeConfig({ fetchImpl })).toMatchObject({
      ok: false,
      kind: "incompatible",
    });
  });

  it("reports server errors and fetch failures as network", async () => {
    expect(
      await loadRuntimeConfig({
        fetchImpl: vi.fn(async () => new Response("", { status: 502 })),
      }),
    ).toMatchObject({ ok: false, kind: "network" });
    expect(
      await loadRuntimeConfig({
        fetchImpl: vi.fn(async () => {
          throw new TypeError("Failed to fetch");
        }),
      }),
    ).toMatchObject({ ok: false, kind: "network" });
  });

  it("times out instead of waiting forever", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const pending = loadRuntimeConfig({ fetchImpl, timeoutMs: 10_000 });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await pending).toMatchObject({ ok: false, kind: "timeout" });
  });

  it("shares one request between concurrent callers and keeps a success", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(validRuntimeConfigJson()));
    const [a, b] = await Promise.all([
      loadRuntimeConfig({ fetchImpl }),
      loadRuntimeConfig({ fetchImpl }),
    ]);
    await loadRuntimeConfig({ fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("fetches again after a failure (retry)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(jsonResponse(validRuntimeConfigJson()));
    expect((await loadRuntimeConfig({ fetchImpl })).ok).toBe(false);
    expect((await loadRuntimeConfig({ fetchImpl })).ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
