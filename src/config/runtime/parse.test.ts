import { describe, expect, it } from "vitest";
import { parseRuntimeConfig } from "./parse";
import { validRuntimeConfigJson } from "./testing-fixtures";

describe("parseRuntimeConfig", () => {
  it("accepts a valid file and normalises like the old loader", () => {
    const res = parseRuntimeConfig(validRuntimeConfigJson());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.config.authority).toBe("https://idp.example.com/oauth2");
    expect(res.config.apiOrigin).toBe("https://api.example.com");
    expect(res.config.redirectURI).toBe("/nb-auth");
    expect(res.config.hotjarTrackID).toBeUndefined();
    expect(res.config.googleTagManagerID).toBeUndefined();
    expect(res.config.wasmPath).toMatch(/^https:\/\/pkgs\.netbird\.io/);
    expect(res.config.analyticsExcludedEmails).toEqual([]);
  });

  it("applies defaults for missing optional fields (newer client, older file)", () => {
    const res = parseRuntimeConfig({
      schemaVersion: 1,
      authority: "http://localhost:8080",
      clientId: "c",
      apiOrigin: "http://localhost:80",
      scopesSupported: "openid",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.config.redirectURI).toBe("/#callback");
    expect(res.config.silentRedirectURI).toBe("/#silent-callback");
    expect(res.config.tokenSource).toBe("accessToken");
    expect(res.config.apiOrigin).toBe("http://localhost");
    expect(res.config.auth0Auth).toBe(false);
  });

  it.each(["authority", "clientId", "apiOrigin", "scopesSupported"])(
    "rejects a missing %s as invalid",
    (field) => {
      const json: Record<string, unknown> = validRuntimeConfigJson();
      delete json[field];
      const res = parseRuntimeConfig(json);
      expect(res).toMatchObject({ ok: false, kind: "invalid" });
    },
  );

  it("rejects legacy string booleans", () => {
    const res = parseRuntimeConfig({
      ...validRuntimeConfigJson(),
      auth0Auth: "true",
    });
    expect(res).toMatchObject({ ok: false, kind: "invalid" });
  });

  it("rejects a non-URL authority", () => {
    const res = parseRuntimeConfig({
      ...validRuntimeConfigJson(),
      authority: "$AUTH_AUTHORITY",
    });
    expect(res).toMatchObject({ ok: false, kind: "invalid" });
  });

  it("rejects an unknown schemaVersion as incompatible", () => {
    const res = parseRuntimeConfig({
      ...validRuntimeConfigJson(),
      schemaVersion: 2,
    });
    expect(res).toMatchObject({ ok: false, kind: "incompatible" });
  });

  it("rejects a missing schemaVersion and non-objects as invalid", () => {
    const json: Record<string, unknown> = validRuntimeConfigJson();
    delete json.schemaVersion;
    expect(parseRuntimeConfig(json)).toMatchObject({ kind: "invalid" });
    expect(parseRuntimeConfig(null)).toMatchObject({ kind: "invalid" });
    expect(parseRuntimeConfig([])).toMatchObject({ kind: "invalid" });
  });

  it("ignores unknown fields (older client, newer file)", () => {
    const res = parseRuntimeConfig({
      ...validRuntimeConfigJson(),
      someFutureField: { x: 1 },
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.config).not.toHaveProperty("someFutureField");
  });

  it("never carries a client secret", () => {
    const res = parseRuntimeConfig({
      ...validRuntimeConfigJson(),
      authClientSecret: "s3cr3t",
      client_secret: "s3cr3t",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(JSON.stringify(res.config)).not.toContain("s3cr3t");
  });

  it("keeps typed values", () => {
    const res = parseRuntimeConfig({
      ...validRuntimeConfigJson(),
      hotjarTrackID: 1234,
      cloud: true,
      analyticsExcludedEmails: [" a@b.c ", ""],
      announcement: `quote " dollar $HOME & amp`,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.config.hotjarTrackID).toBe(1234);
    expect(res.config.cloud).toBe(true);
    expect(res.config.analyticsExcludedEmails).toEqual(["a@b.c"]);
    expect(res.config.announcement).toBe(`quote " dollar $HOME & amp`);
  });
});
