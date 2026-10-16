import { useOidcAccessToken, useOidcIdToken } from "@axa-fr/react-oidc";
import loadConfig from "@utils/config";
import { useMemo } from "react";
import { decodeToken } from "react-jwt";

export const useDomainCategory = () => {
  const tokenSource = loadConfig().tokenSource || "accessToken";
  const { idToken } = useOidcIdToken();
  const { accessToken } = useOidcAccessToken();
  const token = tokenSource.toLowerCase() == "idtoken" ? idToken : accessToken;

  const domainCategory = useMemo(() => {
    try {
      const decodedToken = token
        ? decodeToken<Record<any, any>>(token)
        : undefined;
      const key = decodedToken
        ? Object.keys(decodedToken)
            .filter((key) => key.includes("wt_account_domain_category"))
            .pop()
        : undefined;
      return key && decodedToken ? (decodedToken[key] as string) : undefined;
    } catch (e) {
      return undefined;
    }
  }, [token]);

  const isPrivate = useMemo(() => {
    return domainCategory === "private";
  }, [domainCategory]);

  return {
    domainCategory,
    isPrivate,
  };
};
