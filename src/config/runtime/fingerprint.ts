import type { RuntimeConfig } from "./schema";

// cyrb53: small, fast, synchronous 53-bit string hash. Not cryptographic; it
// only has to tell auth contexts apart for storage namespacing.
const cyrb53 = (str: string, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const normalise = (value: string | undefined) =>
  (value ?? "").trim().replace(/\/+$/, "").toLowerCase();

type AuthContextFields = Pick<
  RuntimeConfig,
  "authority" | "clientId" | "apiOrigin" | "audience" | "tokenSource"
>;

/**
 * Stable short id of the auth context (issuer, client, API, audience, token
 * source). Storage that belongs to a login (OIDC tokens, tenant params,
 * licence cache) is namespaced by it, so pointing a deployment at another
 * issuer or API never reuses state from the previous one.
 */
export function authContextId(config: AuthContextFields): string {
  const material = [
    normalise(config.authority),
    (config.clientId ?? "").trim(),
    normalise(config.apiOrigin),
    (config.audience ?? "").trim(),
    (config.tokenSource ?? "").trim().toLowerCase(),
  ].join("|");
  return cyrb53(material).toString(36);
}
