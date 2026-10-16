"use client";

import FullScreenLoading from "@components/ui/FullScreenLoading";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { cleanupStaleAuthContext } from "./authContextCleanup";
import { ConfigErrorScreen } from "./ConfigErrorScreen";
import { loadRuntimeConfig } from "./loader";
import type { RuntimeConfigErrorKind } from "./parse";
import type { RuntimeConfig } from "./schema";
import { setRuntimeConfig } from "./store";

const RuntimeConfigContext = React.createContext<RuntimeConfig | undefined>(
  undefined,
);

// Start the request as soon as the layout chunk is evaluated, in parallel with
// i18n loading; the provider below reuses the same promise.
if (typeof window !== "undefined") void loadRuntimeConfig();

type State =
  | { status: "loading" }
  | { status: "ready"; config: RuntimeConfig }
  | { status: "error"; kind: RuntimeConfigErrorKind; details: string };

type Props = {
  children: React.ReactNode;
  // Called once with the loaded config before children render (auth-context
  // cleanup, early requests). Must not throw.
  onLoaded?: (config: RuntimeConfig) => void;
};

/**
 * Loads /runtime-config.json once, before anything that needs deployment
 * config (OIDC, API clients, analytics) renders. The static export always
 * prerenders the loading state, so there is no hydration mismatch.
 */
export function RuntimeConfigProvider({ children, onLoaded }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    loadRuntimeConfig().then((result) => {
      if (result.ok) {
        // Before the OIDC client reads sessionStorage.
        cleanupStaleAuthContext(result.config);
        setRuntimeConfig(result.config);
        onLoaded?.(result.config);
        setState({ status: "ready", config: result.config });
      } else {
        console.error("Runtime config:", result.kind, result.details);
        setState({
          status: "error",
          kind: result.kind,
          details: result.details,
        });
      }
    });
  }, [onLoaded]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === "loading") return <FullScreenLoading />;
  if (state.status === "error") {
    return (
      <ConfigErrorScreen
        kind={state.kind}
        details={state.details}
        onRetry={load}
      />
    );
  }
  return (
    <RuntimeConfigContext.Provider value={state.config}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig(): RuntimeConfig {
  const config = useContext(RuntimeConfigContext);
  if (!config) {
    throw new Error("useRuntimeConfig must be used below RuntimeConfigProvider");
  }
  return config;
}

/**
 * Tests and Storybook: provide a fixed config without fetching.
 */
export function StaticRuntimeConfigProvider({
  config,
  children,
}: {
  config: RuntimeConfig;
  children: React.ReactNode;
}) {
  setRuntimeConfig(config);
  return (
    <RuntimeConfigContext.Provider value={config}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}
