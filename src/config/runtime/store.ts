import type { RuntimeConfig } from "./schema";

// Module-level holder for code that runs outside React (API helpers, feature
// flags). RuntimeConfigProvider fills it before rendering anything that may
// read it, so reading it from render code and event handlers below the
// provider is safe; reading it at module top level is not.
let current: RuntimeConfig | undefined;

export function setRuntimeConfig(config: RuntimeConfig) {
  current = config;
}

export function hasRuntimeConfig() {
  return current !== undefined;
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!current) {
    throw new Error(
      "Runtime config is not loaded yet: read it below RuntimeConfigProvider, never at module top level.",
    );
  }
  return current;
}

// Tests only.
export function resetRuntimeConfig() {
  current = undefined;
}
