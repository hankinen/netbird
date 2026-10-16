import { authContextId } from "./fingerprint";
import type { RuntimeConfig } from "./schema";

/** localStorage key holding the id of the auth context this browser last used. */
export const AUTH_CONTEXT_STORAGE_KEY = "netbird-auth-context";

// Storage that belongs to a login against one issuer/client/API. Anything not
// listed here (theme, language, navigation state, onboarding, announcements)
// is user preference and survives a config change.
const LOCAL_KEYS = ["netbird-api-params", "netbird-query-params"];
const LOCAL_PREFIXES = ["netbird-licensed:"];
// @axa-fr/oidc-client keeps tokens, nonce, PKCE verifier and login state in
// sessionStorage as `oidc.<key>.<configurationName>` / `oidc.<configurationName>`.
const SESSION_PREFIXES = ["oidc."];

type Stores = { local: Storage; session: Storage };

const keysOf = (storage: Storage) => {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key !== null) keys.push(key);
  }
  return keys;
};

/**
 * Removes login state left behind by a different auth context (issuer, client,
 * API origin, audience or token source changed in the runtime config), so a
 * reconfigured deployment never reuses stale tokens or tenant parameters.
 *
 * Must run before the OIDC client initialises. Returns true when old state was
 * removed. The first run on a browser without a stored id only records the id:
 * the upgrade itself does not change the auth context, so existing sessions
 * keep working.
 */
export function cleanupStaleAuthContext(
  config: RuntimeConfig,
  stores?: Stores,
): boolean {
  let local: Storage;
  let session: Storage;
  try {
    local = stores?.local ?? window.localStorage;
    session = stores?.session ?? window.sessionStorage;
  } catch (e) {
    return false; // storage disabled; nothing to clean
  }

  const current = authContextId(config);
  try {
    const previous = local.getItem(AUTH_CONTEXT_STORAGE_KEY);
    if (previous === current) return false;
    local.setItem(AUTH_CONTEXT_STORAGE_KEY, current);
    if (previous === null) return false;

    for (const key of keysOf(local)) {
      if (
        LOCAL_KEYS.includes(key) ||
        LOCAL_PREFIXES.some((prefix) => key.startsWith(prefix))
      ) {
        local.removeItem(key);
      }
    }
    for (const key of keysOf(session)) {
      if (SESSION_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        session.removeItem(key);
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}
