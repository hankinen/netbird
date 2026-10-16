"use client";

import "../app/globals.css";
import { useOidcUser } from "@axa-fr/react-oidc";
import Button from "@components/Button";
import { UserAvatar } from "@components/ui/UserAvatar";
import { cn } from "@utils/helpers";
import { isNetBirdCloud } from "@utils/netbird";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import React from "react";
import { NetBirdCloudProvider } from "@/cloud/contexts/NetBirdCloudProvider";
import DistributorProvider from "@/cloud/distributor/contexts/DistributorProvider";
import MSPProvider from "@/cloud/msp/contexts/MSPProvider";
import AnnouncementProvider, {
  useAnnouncement,
} from "@/contexts/AnnouncementProvider";
import ApplicationProvider, {
  useApplicationContext,
} from "@/contexts/ApplicationProvider";
import BillingProvider from "@/contexts/BillingProvider";
import CountryProvider from "@/contexts/CountryProvider";
import GroupsProvider from "@/contexts/GroupsProvider";
import UsersProvider from "@/contexts/UsersProvider";
import Navigation from "@/layouts/Navigation";
import { OnboardingProvider } from "@/modules/onboarding/OnboardingProvider";
import Header, { headerHeight } from "./Header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ApplicationProvider>
      <DistributorProvider>
        <MSPProvider>
          <UsersProvider>
            <AnnouncementProvider>
              <BillingProvider>
                <GroupsProvider>
                  <CountryProvider>
                    <NetBirdCloudProvider />
                    {!isNetBirdCloud() && <OnboardingProvider />}
                    <DashboardPageContent>{children}</DashboardPageContent>
                  </CountryProvider>
                </GroupsProvider>
              </BillingProvider>
            </AnnouncementProvider>
          </UsersProvider>
        </MSPProvider>
      </DistributorProvider>
    </ApplicationProvider>
  );
}

function DashboardPageContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { oidcUser: user } = useOidcUser();
  const { mobileNavOpen, toggleMobileNav } = useApplicationContext();
  // The sidebar renders for every role: Peers is visible to all of them, so
  // there is always at least one item, and each remaining item decides for
  // itself in Navigation. Gating the sidebar itself here once emptied it for
  // the limited (user role) view, whose items were the Agent Network ones.
  const { bannerHeight } = useAnnouncement();
  // @theme: mobile nav is an "over" drawer (Material sidenav): fixed above a
  // still page with a backdrop. While open: page scroll locked, Esc closes,
  // focus moves into the drawer (page is inert) and returns to the opener.
  const drawerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const close = drawerRef.current?.querySelector("button");
    close?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close?.click();
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [mobileNavOpen]);
  return (
    <div className={cn("flex flex-col h-screen", mobileNavOpen && "flex")}>
      {mobileNavOpen && (
        <motion.div
          onClick={toggleMobileNav}
          className={"fixed inset-0 z-[999] bg-black/40"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      {mobileNavOpen && (
        <motion.div
          ref={drawerRef}
          role={"dialog"}
          aria-modal={true}
          className={
            "fixed inset-y-0 left-0 z-[1000] h-dvh overflow-y-auto overscroll-contain shadow-xl bg-nb-gray-950 w-11/12 max-w-[22rem]"
          }
          transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
          animate={{ x: 0 }}
          initial={{ x: "-100%" }}
        >
          <div
            className={
              "flex items-center justify-between gap-3 pl-4 pr-8 pt-8 pb-3 w-11/12"
            }
          >
            <div className={"flex items-center gap-3 max-w-[22rem]"}>
              <UserAvatar size={"small"} />
              <div className="flex flex-col space-y-1">
                <p className="font-medium leading-none dark:text-gray-300">
                  {user?.name}
                </p>
                <p className="text-xs leading-none dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              className={"!px-3"}
              variant={"default-outline"}
              size={"xs"}
              onClick={toggleMobileNav}
            >
              <div>
                <XIcon size={16} className={"relative"} />
              </div>
            </Button>
          </div>
          <Navigation fullWidth />
        </motion.div>
      )}
      <AnimatePresence mode={"wait"}>
        <motion.div
          // @theme: upstream had layout={"position"} here. With the document
          // scrolled even 1px (Chrome Android: 100vh > visible height), framer
          // drops this box's x/y slide and the page covers the mobile drawer.
          // @theme: the page no longer shrinks/slides when the drawer opens
          // (upstream scaled it to 75%, rounded, offset, 90vh); it stays still.
          inert={mobileNavOpen}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
            duration: 0.45,
            mass: 0.1,
          }}
          animate={{
            x: 0,
            width: "100%",
            height: "auto",
            y: 0,
          }}
        >
          <motion.div
            layout={"position"}
            className={"relative"}
            animate={{
              scale: 1,
              height: "auto",
              originX: 0,
              originY: 0,
            }}
            transition={{
              type: "spring",
              duration: 0.45,
              stiffness: 500,
              damping: 25,
              mass: 0.1,
            }}
          >
            <Header />
            <div
              className={"flex flex-row flex-grow"}
              style={{
                height: `calc(100vh - ${headerHeight + bannerHeight}px)`,
              }}
            >
              <Navigation hideOnMobile />
              <React.Fragment key={"page"}>{children}</React.Fragment>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
