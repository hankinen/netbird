"use client";

import loadConfig from "@utils/config";
import { isNetBirdCloud } from "@utils/netbird";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import FullScreenLoading from "@/components/ui/FullScreenLoading";
import type { InstanceStatus } from "@/interfaces/Instance";
import { fetchInstanceStatus } from "@/utils/unauthenticatedApi";

interface InstanceSetupContextType {
  setupRequired: boolean;
  loading: boolean;
}

const InstanceSetupContext = createContext<InstanceSetupContextType>({
  setupRequired: false,
  loading: true,
});

export const useInstanceSetup = () => useContext(InstanceSetupContext);

// Check if we're in an OIDC callback flow (hash-based routing)
const isOIDCCallback = () => {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  return hash.startsWith("#callback") || hash.startsWith("#silent-callback");
};

// Routes that don't need setup check
const bypassRoutes = ["/install"];

// One /api/instance request per page load and API origin, shared by the
// early prefetch and the provider below. Setup ends with a full reload, so a
// cached setup_required never outlives it.
let instanceStatusRequest:
  | { origin: string; promise: Promise<InstanceStatus> }
  | undefined;

export const getInstanceStatusOnce = (): Promise<InstanceStatus> => {
  const origin = loadConfig().apiOrigin;
  if (instanceStatusRequest?.origin !== origin) {
    instanceStatusRequest = { origin, promise: fetchInstanceStatus() };
  }
  return instanceStatusRequest.promise;
};

/**
 * Starts the instance check as soon as the runtime config is known, so it
 * runs in parallel with OIDC initialisation instead of after it.
 */
export const prefetchInstanceStatus = () => {
  if (typeof window === "undefined") return;
  if (isNetBirdCloud() || isOIDCCallback()) return;
  if (bypassRoutes.includes(window.location.pathname)) return;
  getInstanceStatusOnce().catch(() => {});
};

export const resetInstanceStatusRequest = () => {
  instanceStatusRequest = undefined;
};

export default function InstanceSetupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [setupRequired, setSetupRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const shouldBypass = bypassRoutes.includes(pathname) || isOIDCCallback();

  // Skip setup check for NetBird hosted (cloud) deployments
  const isCloud = isNetBirdCloud();
  const isSetupPage = pathname === "/setup";

  // Check instance status on mount
  useEffect(() => {
    // Skip check for cloud deployments or bypass routes
    if (isCloud || shouldBypass) {
      setLoading(false);
      return;
    }

    // Check if instance setup is required (usually already in flight)
    getInstanceStatusOnce()
      .then((status) => {
        if (status.setup_required) {
          setSetupRequired(true);
        }
      })
      .catch((err) => {
        // If API fails (e.g., endpoint doesn't exist on older versions),
        // assume setup is not required and continue normally
        console.warn("Instance status check failed:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shouldBypass, isCloud]);

  // Handle redirect separately to avoid setState during render conflicts
  useEffect(() => {
    if (setupRequired && !shouldBypass && !isSetupPage) {
      router.replace("/setup");
    }
  }, [setupRequired, shouldBypass, router, isSetupPage]);

  // Show loading while checking (only for non-cloud, non-bypass routes)
  if (loading && !shouldBypass && !isCloud) {
    return <FullScreenLoading />;
  }

  // If setup required and not on setup page, wait for redirect
  if (setupRequired && !shouldBypass && !isSetupPage) {
    return <FullScreenLoading />;
  }

  return (
    <InstanceSetupContext.Provider value={{ setupRequired, loading }}>
      {children}
    </InstanceSetupContext.Provider>
  );
}
