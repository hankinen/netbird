import {
  BOOLEAN_FIELDS,
  DEFAULT_REDIRECT_URI,
  DEFAULT_SILENT_REDIRECT_URI,
  DEFAULT_TOKEN_SOURCE,
  DEFAULT_WASM_PATH,
  OPTIONAL_STRING_FIELDS,
  REQUIRED_STRING_FIELDS,
  RUNTIME_CONFIG_SCHEMA_VERSION,
  RuntimeConfig,
} from "./schema";

export type RuntimeConfigErrorKind =
  | "missing"
  | "invalid"
  | "incompatible"
  | "timeout"
  | "network";

export type ParseResult =
  | { ok: true; config: RuntimeConfig }
  | { ok: false; kind: RuntimeConfigErrorKind; details: string };

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const invalid = (details: string): ParseResult => ({
  ok: false,
  kind: "invalid",
  details,
});

/**
 * Validates and normalises the JSON served at /runtime-config.json.
 * Accepts the parsed JSON value (not the raw text).
 */
export function parseRuntimeConfig(json: unknown): ParseResult {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return invalid("runtime config is not a JSON object");
  }
  const raw = json as Record<string, unknown>;

  const version = raw.schemaVersion;
  if (typeof version !== "number" || !Number.isInteger(version)) {
    return invalid("schemaVersion must be an integer");
  }
  if (version !== RUNTIME_CONFIG_SCHEMA_VERSION) {
    return {
      ok: false,
      kind: "incompatible",
      details: `schemaVersion ${version} is not supported (expected ${RUNTIME_CONFIG_SCHEMA_VERSION})`,
    };
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = raw[field];
    if (typeof value !== "string" || value.trim() === "") {
      return invalid(`${field} is required`);
    }
  }
  for (const field of OPTIONAL_STRING_FIELDS) {
    const value = raw[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      return invalid(`${field} must be a string`);
    }
  }
  for (const field of BOOLEAN_FIELDS) {
    const value = raw[field];
    if (value !== undefined && value !== null && typeof value !== "boolean") {
      return invalid(`${field} must be a boolean`);
    }
  }

  const hotjar = raw.hotjarTrackID;
  if (
    hotjar !== undefined &&
    hotjar !== null &&
    (typeof hotjar !== "number" || !Number.isFinite(hotjar))
  ) {
    return invalid("hotjarTrackID must be a number");
  }

  const emails = raw.analyticsExcludedEmails;
  if (
    emails !== undefined &&
    emails !== null &&
    (!Array.isArray(emails) || emails.some((e) => typeof e !== "string"))
  ) {
    return invalid("analyticsExcludedEmails must be an array of strings");
  }

  const str = (field: string) => {
    const value = raw[field];
    return typeof value === "string" && value !== "" ? value : undefined;
  };
  const bool = (field: string) => raw[field] === true;

  // Same normalisation the build-time loader applied.
  const authority = (raw.authority as string).trim().replace(/\/+$/, "");
  if (!isHttpUrl(authority)) {
    return invalid("authority must be an http(s) URL");
  }
  const apiOrigin = (raw.apiOrigin as string)
    .trim()
    .replace(/\/+$/, "")
    .replace(/(:80|:443)$/, "");

  const config: RuntimeConfig = {
    schemaVersion: version,
    configRevision: str("configRevision") ?? "",
    auth0Auth: bool("auth0Auth"),
    authority,
    clientId: (raw.clientId as string).trim(),
    scopesSupported: (raw.scopesSupported as string).trim(),
    apiOrigin,
    grpcApiOrigin: str("grpcApiOrigin") ?? "",
    audience: str("audience") ?? "",
    redirectURI: str("redirectURI") ?? DEFAULT_REDIRECT_URI,
    silentRedirectURI: str("silentRedirectURI") ?? DEFAULT_SILENT_REDIRECT_URI,
    tokenSource: str("tokenSource") ?? DEFAULT_TOKEN_SOURCE,
    dragQueryParams: bool("dragQueryParams"),
    hotjarTrackID: typeof hotjar === "number" ? hotjar : undefined,
    googleAnalyticsID: str("googleAnalyticsID"),
    googleTagManagerID: str("googleTagManagerID"),
    authServiceUrl: str("authServiceUrl"),
    wasmPath: str("wasmPath") ?? DEFAULT_WASM_PATH,
    licensed: bool("licensed"),
    cloud: bool("cloud"),
    agentNetworkOnly: bool("agentNetworkOnly"),
    agentNetworkEnabled: bool("agentNetworkEnabled"),
    hubspotPortalId: str("hubspotPortalId"),
    hubspotSignupFormId: str("hubspotSignupFormId"),
    hubspotOnboardingFormId: str("hubspotOnboardingFormId"),
    hubspotSurveyFormId: str("hubspotSurveyFormId"),
    analyticsExcludedEmails: ((emails as string[] | undefined) ?? [])
      .map((e) => e.trim())
      .filter(Boolean),
    announcement: str("announcement"),
  };
  return { ok: true, config };
}
