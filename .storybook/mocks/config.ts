/* The runtime config stories run with (the app fetches it from
   /runtime-config.json; preview.tsx stores this one before any story renders).
   The cloud flavour comes from the `flavor` global in the iframe URL; the
   toolbar switch reloads the preview. */
import type { RuntimeConfig } from "@/config/runtime/schema";

const cloud = /flavor:cloud/.test(
  new URLSearchParams(location.search).get("globals") ?? "",
);

const config: RuntimeConfig = {
  schemaVersion: 1,
  configRevision: "storybook",
  auth0Auth: false,
  authority: "https://auth.storybook.test",
  clientId: "storybook",
  scopesSupported: "openid profile email",
  audience: "storybook",
  apiOrigin: "https://api.storybook.test",
  grpcApiOrigin: "https://api.storybook.test",
  redirectURI: "/#callback",
  silentRedirectURI: "/#silent-callback",
  tokenSource: "accessToken",
  dragQueryParams: false,
  authServiceUrl: cloud ? "https://api.storybook.test" : undefined,
  wasmPath: "https://pkgs.netbird.io/wasm/client/v0.76.3",
  licensed: cloud,
  cloud,
  agentNetworkOnly: false,
  agentNetworkEnabled: true,
  analyticsExcludedEmails: [],
};

export default config;
