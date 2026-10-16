import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_CONTEXT_STORAGE_KEY,
  cleanupStaleAuthContext,
} from "./authContextCleanup";
import { authContextId } from "./fingerprint";
import { testRuntimeConfig } from "./testing-fixtures";

const seed = () => {
  localStorage.setItem("netbird-api-params", '{"account":"a1"}');
  localStorage.setItem("netbird-query-params", '{"tab":"x"}');
  localStorage.setItem("netbird-licensed:old", '{"value":true,"ts":1}');
  localStorage.setItem("netbird-theme", "dark");
  localStorage.setItem("netbird-language", "zh-CN");
  localStorage.setItem("netbird-nav-collapsed", "true");
  sessionStorage.setItem("oidc.default", '{"tokens":{"access_token":"t"}}');
  sessionStorage.setItem("oidc.code_verifier.default", "v");
  sessionStorage.setItem("unrelated", "keep");
};

const preferencesKept = () => {
  expect(localStorage.getItem("netbird-theme")).toBe("dark");
  expect(localStorage.getItem("netbird-language")).toBe("zh-CN");
  expect(localStorage.getItem("netbird-nav-collapsed")).toBe("true");
  expect(sessionStorage.getItem("unrelated")).toBe("keep");
};

describe("cleanupStaleAuthContext", () => {
  const base = testRuntimeConfig();

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("first run records the id and keeps existing sessions", () => {
    seed();
    expect(cleanupStaleAuthContext(base)).toBe(false);
    expect(localStorage.getItem(AUTH_CONTEXT_STORAGE_KEY)).toBe(
      authContextId(base),
    );
    expect(sessionStorage.getItem("oidc.default")).not.toBeNull();
    expect(localStorage.getItem("netbird-api-params")).not.toBeNull();
  });

  it("same context keeps everything", () => {
    cleanupStaleAuthContext(base);
    seed();
    expect(cleanupStaleAuthContext(base)).toBe(false);
    expect(sessionStorage.getItem("oidc.default")).not.toBeNull();
    expect(localStorage.getItem("netbird-api-params")).not.toBeNull();
    preferencesKept();
  });

  it.each([
    ["issuer", { authority: "https://other-idp.example.com" }],
    ["client", { clientId: "another-client" }],
    ["API", { apiOrigin: "https://api2.example.com" }],
    ["audience", { audience: "other-audience" }],
  ])("changed %s clears login state only", (_name, overrides) => {
    cleanupStaleAuthContext(base);
    seed();
    const next = testRuntimeConfig(overrides);
    expect(cleanupStaleAuthContext(next)).toBe(true);
    expect(localStorage.getItem(AUTH_CONTEXT_STORAGE_KEY)).toBe(
      authContextId(next),
    );
    expect(localStorage.getItem("netbird-api-params")).toBeNull();
    expect(localStorage.getItem("netbird-query-params")).toBeNull();
    expect(localStorage.getItem("netbird-licensed:old")).toBeNull();
    expect(sessionStorage.getItem("oidc.default")).toBeNull();
    expect(sessionStorage.getItem("oidc.code_verifier.default")).toBeNull();
    preferencesKept();
  });

  it("non-auth settings do not change the context", () => {
    cleanupStaleAuthContext(base);
    seed();
    expect(
      cleanupStaleAuthContext(
        testRuntimeConfig({ announcement: "new banner" }),
      ),
    ).toBe(false);
    expect(sessionStorage.getItem("oidc.default")).not.toBeNull();
  });
});
