import { describe, expect, it } from "vitest";
import { authContextId } from "./fingerprint";
import { testRuntimeConfig } from "./testing-fixtures";

describe("authContextId", () => {
  it("is stable for the same auth context and ignores cosmetic differences", () => {
    const a = authContextId(testRuntimeConfig());
    const b = authContextId(
      testRuntimeConfig({
        authority: "https://IDP.example.com/",
        announcement: "other",
        cloud: true,
      }),
    );
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-z]+$/);
  });

  it.each([
    ["authority", { authority: "https://other-idp.example.com" }],
    ["clientId", { clientId: "other-client" }],
    ["apiOrigin", { apiOrigin: "https://other-api.example.com" }],
    ["audience", { audience: "other" }],
    ["tokenSource", { tokenSource: "idToken" }],
  ])("changes when %s changes", (_, override) => {
    expect(authContextId(testRuntimeConfig(override))).not.toBe(
      authContextId(testRuntimeConfig()),
    );
  });
});
