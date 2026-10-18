"use client";

import { XIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import NetBirdLogoFull from "@/assets/netbird-full.svg";
import { useApplicationContext } from "@/contexts/ApplicationProvider";
import { t } from "@/i18n";
import Navigation from "@/layouts/Navigation";
import { SiderContext } from "./siderContext";

/**
 * Phone navigation: an "over" drawer (Material sidenav) above a still page.
 * While open the page scroll is locked, Escape closes, focus moves to the
 * close button and returns to the opener; the shell marks the page inert.
 * Styled like the sider; it hosts the same upstream navigation tree.
 */
export function NavDrawer() {
  const { mobileNavOpen, toggleMobileNav } = useApplicationContext();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const close = ref.current?.querySelector<HTMLButtonElement>(
      "[data-drawer-close]",
    );
    close?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close?.click();
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [mobileNavOpen]);

  if (!mobileNavOpen) return null;

  return (
    <>
      <div className={"nb-drawer__backdrop"} onClick={toggleMobileNav} />
      <div
        ref={ref}
        role={"dialog"}
        aria-modal={true}
        aria-label={t("nav:shell.label.mainNavigation")}
        className={"nb-drawer"}
        data-testid={"nav-drawer"}
      >
        <div className={"nb-drawer__header"}>
          <Image src={NetBirdLogoFull} height={22} alt={"NetBird"} />
          <button
            type={"button"}
            data-drawer-close
            className={"nb-drawer__close"}
            aria-label={t("nav:shell.label.closeMenu")}
            onClick={toggleMobileNav}
          >
            <XIcon size={18} />
          </button>
        </div>
        <div className={"nb-navhost nb-drawer__nav"}>
          <SiderContext.Provider value={{ collapsed: false }}>
            <Navigation fullWidth />
          </SiderContext.Provider>
        </div>
      </div>
    </>
  );
}
