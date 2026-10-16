import { StringMap } from "@axa-fr/react-oidc";
import type { RuntimeConfig } from "@/config/runtime/schema";
import { getRuntimeConfig } from "@/config/runtime/store";

// The deployment config is no longer baked into the build: the container
// serves it at /runtime-config.json and RuntimeConfigProvider loads it before
// any consumer renders (see src/config/runtime).
export type Config = RuntimeConfig;

/**
 * The deployment config. Call it while rendering, in hooks, effects or event
 * handlers below RuntimeConfigProvider — never at module top level, where it
 * would run before the config is loaded (and throws).
 */
const loadConfig = (): Config => getRuntimeConfig();

/**
 * Build the extras object that will be passed to the auth layer
 */
export const buildExtras = (config: Config = loadConfig()) => {
  const extras: StringMap = {};

  if (config.dragQueryParams) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((value, key) => {
      extras[key] = value;
    });
  }

  if (config.audience) {
    extras.audience = config.audience;
  }
  return extras;
};

export default loadConfig;
