import { type ParseResult, parseRuntimeConfig } from "./parse";

export const RUNTIME_CONFIG_URL = "/runtime-config.json";
export const RUNTIME_CONFIG_TIMEOUT_MS = 10_000;

type Options = {
  timeoutMs?: number;
  url?: string;
  fetchImpl?: typeof fetch;
};

let inflight: Promise<ParseResult> | undefined;

/**
 * Fetches and validates /runtime-config.json. Concurrent callers share one
 * request; a successful result is kept for the page lifetime, a failure is
 * forgotten so a retry fetches again. Never rejects.
 */
export function loadRuntimeConfig(options: Options = {}): Promise<ParseResult> {
  if (inflight) return inflight;
  const request = fetchRuntimeConfig(options).then((result) => {
    if (!result.ok && inflight === request) inflight = undefined;
    return result;
  });
  inflight = request;
  return request;
}

async function fetchRuntimeConfig({
  timeoutMs = RUNTIME_CONFIG_TIMEOUT_MS,
  url = RUNTIME_CONFIG_URL,
  fetchImpl = fetch,
}: Options): Promise<ParseResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const timedOut = (): ParseResult => ({
    ok: false,
    kind: "timeout",
    details: `no response from ${url} within ${Math.round(timeoutMs / 1000)} s`,
  });
  try {
    const res = await fetchImpl(url, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (res.status === 404) {
      return { ok: false, kind: "missing", details: `${url} returned 404` };
    }
    if (!res.ok) {
      return {
        ok: false,
        kind: "network",
        details: `${url} returned HTTP ${res.status}`,
      };
    }
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      if (controller.signal.aborted) return timedOut();
      return { ok: false, kind: "invalid", details: `${url} is not JSON` };
    }
    return parseRuntimeConfig(json);
  } catch (e) {
    if (controller.signal.aborted) return timedOut();
    return {
      ok: false,
      kind: "network",
      details: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

// Tests only.
export function resetRuntimeConfigLoader() {
  inflight = undefined;
}
