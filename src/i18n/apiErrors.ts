import { t } from "@/i18n";

/**
 * Maps known English error messages of the management API to translated text.
 * Unknown messages are returned unchanged. Phase 1 covers a few common
 * messages; extend the list (and errors.api in common) in phase 2.
 */
const patterns = [
  { match: /^token expired$/i, key: "common:apiError.tokenExpired" },
  { match: /^token invalid$/i, key: "common:apiError.tokenInvalid" },
  {
    match: /^no valid authentication provided$/i,
    key: "common:apiError.noAuth",
  },
  { match: /^internal server error$/i, key: "common:apiError.internal" },
  {
    match: /permission denied|not allowed|forbidden/i,
    key: "common:apiError.permissionDenied",
  },
  { match: /already exists/i, key: "common:apiError.alreadyExists" },
  { match: /not found/i, key: "common:apiError.notFound" },
  {
    match: /^failed to fetch$|network ?error/i,
    key: "common:apiError.network",
  },
  { match: /pending approval/i, key: "common:apiError.pendingApproval" },
  { match: /^something went wrong/i, key: "common:apiError.unknown" },
] as const;

export function translateApiError(message?: string): string | undefined {
  if (!message) return message;
  const hit = patterns.find((p) => p.match.test(message.trim()));
  if (!hit) return message;
  const translated = String(t(hit.key));
  // Keep the server text visible when the user reads a translation of a pattern match.
  return /^(\^)/.test(hit.match.source)
    ? translated
    : `${translated} (${message})`;
}
