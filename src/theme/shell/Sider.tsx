"use client";

import { cn } from "@utils/helpers";
import { useGuardedRouter } from "@utils/navigation-guard";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import NetBirdLogoMark from "@/assets/netbird.svg";
import NetBirdLogoFull from "@/assets/netbird-full.svg";
import { useApplicationContext } from "@/contexts/ApplicationProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import Navigation from "@/layouts/Navigation";
import { useLayoutMode } from "@/theme/hooks/useLayoutMode";
import { SiderContext } from "./siderContext";

/**
 * The dark sider (decision 1). It hosts the upstream navigation tree
 * (src/layouts/Navigation.tsx: items, groups, permissions, usage and
 * version blocks) unchanged; shell.css neutralises that tree's own container
 * styling (@depends) and the SidebarItem adapter draws the items.
 * @replaces-file src/layouts/Navigation.tsx sha256:861f70446f3492d8
 *
 * Collapsed to a 56px icon rail: on desktops by the persisted preference
 * (ApplicationProvider), on tablets by default for the session. Groups open
 * as popovers while collapsed; nothing expands on hover.
 */
export function Sider() {
  const mode = useLayoutMode();
  const { isNavigationCollapsed, toggleNavigation } = useApplicationContext();
  const { isRestricted } = usePermissions();
  const router = useGuardedRouter();
  const [compactExpanded, setCompactExpanded] = React.useState(false);

  const compact = mode === "compact";
  const collapsed = compact ? !compactExpanded : isNavigationCollapsed;
  const toggle = compact
    ? () => setCompactExpanded((v) => !v)
    : toggleNavigation;

  return (
    <SiderContext.Provider value={{ collapsed }}>
      <aside
        className={"nb-sider"}
        data-navigation
        data-collapsed={collapsed || undefined}
        aria-label={t("nav:shell.label.mainNavigation")}
      >
        <div className={"nb-sider__brand"}>
          <button
            type={"button"}
            className={"nb-sider__logo"}
            aria-label={"NetBird"}
            onClick={() => router.push("/peers")}
          >
            <Image
              src={NetBirdLogoFull}
              height={22}
              alt={"NetBird"}
              className={cn("nb-sider__logo-full")}
            />
            <Image
              src={NetBirdLogoMark}
              width={26}
              alt={"NetBird"}
              className={cn("nb-sider__logo-mark")}
            />
          </button>
        </div>
        <div className={"nb-navhost nb-sider__nav"}>
          <Navigation fullWidth />
        </div>
        {!isRestricted && (
          <div className={"nb-sider__footer"}>
            <button
              type={"button"}
              data-navbar-colappse-toggle
              className={"nb-sider__toggle"}
              aria-label={
                collapsed
                  ? t("nav:shell.label.expandNavigation")
                  : t("nav:shell.label.collapseNavigation")
              }
              aria-expanded={!collapsed}
              onClick={toggle}
            >
              {collapsed ? (
                <PanelLeftOpenIcon size={16} />
              ) : (
                <PanelLeftCloseIcon size={16} />
              )}
              <span className={"nb-sider__toggle-label"}>
                {t("nav:shell.label.collapseNavigation")}
              </span>
            </button>
          </div>
        )}
      </aside>
    </SiderContext.Provider>
  );
}
