#!/usr/bin/env node
// Writes the runtime config the dashboard fetches at /runtime-config.json for
// local development and e2e test builds, from the legacy string-valued
// .local-config.json / .test-config.json (the files create-test-env.sh and
// developers already have). Production containers generate the file with
// docker/gen_runtime_config.sh instead.
//
//   node scripts/runtime-config/write-dev-config.mjs [--test] [--source f] [--out f]
//     --test    read .test-config.json (default .local-config.json)
//     --out     default public/runtime-config.json
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const isTest = args.includes("--test") || process.env.APP_ENV === "test";
const source = opt("--source") ?? (isTest ? ".test-config.json" : ".local-config.json");
const out = opt("--out") ?? "public/runtime-config.json";

if (!fs.existsSync(source)) {
  console.warn(
    `write-dev-config: ${source} not found; ${out} not written (the app will show the missing-config screen).`,
  );
  process.exit(0);
}

const legacy = JSON.parse(fs.readFileSync(source, "utf8"));

// Unsubstituted "$VAR" placeholders and empty strings mean "unset".
const str = (v) =>
  typeof v === "string" && v !== "" && !/^\$[A-Z0-9_]+$/.test(v) ? v : "";
const bool = (v) => v === true || v === "true";

const toRuntimeConfig = (c) => ({
  schemaVersion: 1,
  configRevision: "dev",
  auth0Auth: bool(c.auth0Auth),
  authority: str(c.authAuthority),
  clientId: str(c.authClientId),
  scopesSupported: str(c.authScopesSupported),
  audience: str(c.authAudience),
  apiOrigin: str(c.apiOrigin),
  grpcApiOrigin: str(c.grpcApiOrigin),
  redirectURI: str(c.redirectURI),
  silentRedirectURI: str(c.silentRedirectURI),
  tokenSource: str(c.tokenSource),
  dragQueryParams: bool(c.dragQueryParams),
  hotjarTrackID: /^\d+$/.test(str(c.hotjarTrackID)) ? Number(c.hotjarTrackID) : null,
  googleAnalyticsID: str(c.googleAnalyticsID),
  googleTagManagerID: str(c.googleTagManagerID),
  authServiceUrl: str(c.authServiceUrl),
  wasmPath: str(c.wasmPath),
  licensed: bool(c.licensed),
  cloud: bool(c.cloud),
  agentNetworkOnly: bool(c.agentNetworkOnly),
  agentNetworkEnabled: bool(c.agentNetworkEnabled),
  hubspotPortalId: str(c.hubspotPortalId),
  hubspotSignupFormId: str(c.hubspotSignupFormId),
  hubspotOnboardingFormId: str(c.hubspotOnboardingFormId),
  hubspotSurveyFormId: str(c.hubspotSurveyFormId),
  analyticsExcludedEmails: Array.isArray(c.analyticsExcludedEmails)
    ? c.analyticsExcludedEmails
    : str(c.analyticsExcludedEmails)
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
  announcement: str(c.announcement),
});

// A file that already follows the runtime schema is copied as is.
const config = typeof legacy.schemaVersion === "number" ? legacy : toRuntimeConfig(legacy);
if (legacy.authClientSecret) {
  console.warn("write-dev-config: authClientSecret is ignored (never served to the browser).");
}
delete config.authClientSecret;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(config, null, 2) + "\n");
console.log(`write-dev-config: ${source} -> ${out}`);
