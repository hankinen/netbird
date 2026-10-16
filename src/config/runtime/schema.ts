/**
 * Public runtime configuration of a dashboard deployment.
 *
 * The container generates /runtime-config.json from its environment at start
 * (docker/gen_runtime_config.sh) and the client fetches it before any auth or
 * API client exists. Built JS therefore contains no deployment values and can
 * be cached as immutable. Everything in here is public: never add secrets
 * (the OIDC client secret is deliberately not part of the contract).
 *
 * Compatibility rules (rollback-safe):
 * - unknown fields are ignored (older client + newer file),
 * - optional fields may be missing (newer client + older file),
 * - a different major schemaVersion is rejected as incompatible.
 */
export const RUNTIME_CONFIG_SCHEMA_VERSION = 1;

export const DEFAULT_REDIRECT_URI = "/#callback";
export const DEFAULT_SILENT_REDIRECT_URI = "/#silent-callback";
export const DEFAULT_TOKEN_SOURCE = "accessToken";
export const DEFAULT_WASM_PATH = "https://pkgs.netbird.io/wasm/client/v0.76.3";

export interface RuntimeConfig {
  schemaVersion: number;
  // sha256 of the canonical config body, set by the generator. Informational.
  configRevision: string;
  auth0Auth: boolean;
  authority: string;
  clientId: string;
  scopesSupported: string;
  apiOrigin: string;
  grpcApiOrigin: string;
  audience: string;
  redirectURI: string;
  silentRedirectURI: string;
  tokenSource: string;
  dragQueryParams: boolean;
  hotjarTrackID?: number;
  googleAnalyticsID?: string;
  googleTagManagerID?: string;
  authServiceUrl?: string;
  wasmPath: string;
  licensed: boolean;
  cloud: boolean;
  // agentNetworkOnly: dedicated Agent Network surface — the regular UI
  // (network routing, DNS, reverse proxy, activity) is hidden, no Beta badge.
  // agentNetworkEnabled: the regular UI plus the Agent Network menu item (Beta).
  agentNetworkOnly: boolean;
  agentNetworkEnabled: boolean;
  hubspotPortalId?: string;
  hubspotSignupFormId?: string;
  hubspotOnboardingFormId?: string;
  hubspotSurveyFormId?: string;
  analyticsExcludedEmails: string[];
  // announcement: text the operator wants every user of this deployment to
  // see in a permanent banner (NETBIRD_ANNOUNCEMENT). Unset for none.
  announcement?: string;
}

export const REQUIRED_STRING_FIELDS = [
  "authority",
  "clientId",
  "apiOrigin",
  "scopesSupported",
] as const;

export const OPTIONAL_STRING_FIELDS = [
  "grpcApiOrigin",
  "audience",
  "redirectURI",
  "silentRedirectURI",
  "tokenSource",
  "googleAnalyticsID",
  "googleTagManagerID",
  "authServiceUrl",
  "wasmPath",
  "hubspotPortalId",
  "hubspotSignupFormId",
  "hubspotOnboardingFormId",
  "hubspotSurveyFormId",
  "announcement",
  "configRevision",
] as const;

export const BOOLEAN_FIELDS = [
  "auth0Auth",
  "dragQueryParams",
  "licensed",
  "cloud",
  "agentNetworkOnly",
  "agentNetworkEnabled",
] as const;
