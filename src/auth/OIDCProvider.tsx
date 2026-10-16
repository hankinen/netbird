"use client";

import {
  AuthorityConfiguration,
  OidcConfiguration,
  OidcProvider,
} from "@axa-fr/react-oidc";
import FullScreenLoading from "@components/ui/FullScreenLoading";
import { buildExtras } from "@utils/config";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { OIDCError } from "@/auth/OIDCError";
import { SecureProvider } from "@/auth/SecureProvider";
import { useRuntimeConfig } from "@/config/runtime/RuntimeConfigProvider";

type Props = {
  children: React.ReactNode;
};

/**
 * Unfortunately Auth0 https://<DOMAIN>/.well-known/openid-configuration doesn't contain end_session_endpoint that
 * is required for doing logout. Therefore, we need to hardcode the config for auth
 */
const auth0AuthorityConfig = (authority: string): AuthorityConfiguration => ({
  authorization_endpoint: new URL("authorize", authority).href,
  token_endpoint: new URL("oauth/token", authority).href,
  revocation_endpoint: new URL("oauth/revoke", authority).href,
  end_session_endpoint: new URL("v2/logout", authority).href,
  userinfo_endpoint: new URL("userinfo", authority).href,
  issuer: new URL("", authority).href,
});

const onEvent = (configurationName: any, eventName: any, data: any) => {
  if (process.env.NODE_ENV !== "production") {
    //console.info(`oidc:${configurationName}:${eventName}`, data);
  }
};

export default function OIDCProvider({ children }: Props) {
  const config = useRuntimeConfig();
  const router = useRouter();
  const path = usePathname();

  const withCustomHistory = () => {
    return {
      replaceState: (url: any) => {
        window?.location?.replace(url);
      },
    };
  };

  // Built from the runtime config, which is loaded before this renders; the
  // static export never renders it (RuntimeConfigProvider shows the loader).
  const providerConfig = useMemo<OidcConfiguration>(
    () => ({
      authority: config.authority,
      client_id: config.clientId,
      redirect_uri: window.location.origin + config.redirectURI,
      refresh_time_before_tokens_expiration_in_second: 30,
      silent_redirect_uri: window.location.origin + config.silentRedirectURI,
      scope: config.scopesSupported,
      // disabling service worker
      service_worker_only: false,
      authority_configuration: config.auth0Auth
        ? auth0AuthorityConfig(config.authority)
        : undefined,
      extras: buildExtras(config),
    }),
    [config],
  );

  // We bypass authentication for pages that do not require auth.
  // E.g., when we just want to show installation steps for public.
  // Or the instance setup wizard for first-time setup.
  // Or the invite acceptance page for new users.
  if (path === "/install" || path === "/setup" || path?.startsWith("/invite"))
    return children;

  return (
    <OidcProvider
      configuration={providerConfig}
      withCustomHistory={withCustomHistory}
      authenticatingComponent={FullScreenLoading}
      authenticatingErrorComponent={OIDCError}
      loadingComponent={FullScreenLoading}
      callbackSuccessComponent={FullScreenLoading}
      onEvent={onEvent}
      onSessionLost={() => void 0}
      //sessionLostComponent={SessionLost}
    >
      <SecureProvider>{children}</SecureProvider>
    </OidcProvider>
  );
}
