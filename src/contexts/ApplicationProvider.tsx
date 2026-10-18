import { useOidcUser } from "@axa-fr/react-oidc";
import { Params } from "@utils/api";
import { useIsMd } from "@utils/responsive";
// @theme: GitHub release check disabled, see the effect below.
// import { getLatestNetbirdRelease } from "@utils/version";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { NetbirdRelease } from "@/interfaces/Version";

type Props = {
  children: React.ReactNode;
};

const ApplicationContext = React.createContext(
  {} as {
    latestVersion: string | undefined;
    latestUrl: string | undefined;
    toggleMobileNav: () => void;
    mobileNavOpen: boolean;
    user: any;
    globalApiParams?: Params;
    setGlobalApiParams?: (p?: Params) => void;
    isNavigationCollapsed: boolean;
    toggleNavigation: () => void;
  },
);

export default function ApplicationProvider({ children }: Props) {
  // @theme: no latest release without the GitHub check below; an old copy
  // in localStorage would never refresh, so it is not read either.
  const latestRelease = undefined as NetbirdRelease | undefined;
  // const [latestRelease, setLatestRelease] = useLocalStorage<
  //   NetbirdRelease | undefined
  // >("netbird-latest-release", undefined);
  const { oidcUser: user } = useOidcUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMd = useIsMd();
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useLocalStorage(
    "netbird-nav-collapsed",
    false,
  );

  const [globalApiParams, setGlobalApiParams] = useLocalStorage<
    Params | undefined
  >("netbird-api-params", undefined);

  const toggleNavigation = useCallback(() => {
    setIsNavigationCollapsed((prev) => !prev);
  }, []);

  // Hide mobile nav when windows gets resized
  useEffect(() => {
    if (isMd) {
      setMobileNavOpen(false);
    }
  }, [isMd]);

  // @theme: GitHub release check disabled (src/theme/README.md "版本信息卡片").
  // Upstream asked api.github.com for the latest NetBird release on load and
  // every 30 minutes. Its only consumer is latestVersion / latestUrl, so the
  // Peers table's "update available" arrow (PeerVersionCell) is gone too.
  // To restore, uncomment this effect, the getLatestNetbirdRelease import and
  // the useLocalStorage line above, and drop `const latestRelease = undefined`.
  // useEffect(() => {
  //   async function fetchLatestRelease() {
  //     const release = await getLatestNetbirdRelease(latestRelease);
  //     setLatestRelease(release);
  //   }
  //   fetchLatestRelease().then();
  //   const interval = setInterval(
  //     fetchLatestRelease,
  //     1000 * 60 * 30, // Run every 30 minutes
  //   );
  //   return () => clearInterval(interval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const latestVersion = useMemo(
    () => latestRelease?.latest_version,
    [latestRelease],
  );
  const latestUrl = useMemo(() => latestRelease?.url, [latestRelease]);

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  // No request gates rendering here any more: UsersProvider's /users/current
  // is the single user gate (it also provisions the account on first login).
  return (
    <ApplicationContext.Provider
      value={{
        latestVersion,
        toggleMobileNav,
        latestUrl,
        mobileNavOpen,
        user,
        globalApiParams,
        setGlobalApiParams,
        isNavigationCollapsed,
        toggleNavigation,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplicationContext() {
  return useContext(ApplicationContext);
}
