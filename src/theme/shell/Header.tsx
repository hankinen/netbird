"use client";

import HelpAndSupportButton from "@components/ui/HelpAndSupportButton";
import UserDropdown from "@components/ui/UserDropdown";
import { ChevronRightIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { DistributorTransferAccountModal } from "@/cloud/distributor/DistributorTransferAccountModal";
import { MSPTenantsSwitcher } from "@/cloud/msp/MSPTenantsSwitcher";
import { MSPTransferAccountModal } from "@/cloud/msp/MSPTransferAccountModal";
import { useApplicationContext } from "@/contexts/ApplicationProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { type PageCrumb, usePageCrumbs, usePageHeaderSpec } from "./pageHeader";
import { useDocumentPageName } from "./useDocumentTitle";

/**
 * The top bar of the shell, replacing src/layouts/Header.tsx through the
 * `@/layouts/Header` alias.
 * @replaces-file src/layouts/Header.tsx sha256:b7992d4920f7e7df
 *
 * One component for every layout mode; CSS (shell.css) decides what shows:
 * desktops get the breadcrumb (or the page name) on the left, phones get the
 * menu button and the page title. The right side is the same everywhere:
 * MSP / distributor widgets, help, user. `headerHeight` is still exported
 * for VerticalTabs and the sidebar modal, which offset by it.
 */
export const headerHeight = 48;

export default function Header() {
  const spec = usePageHeaderSpec();
  const crumbs = usePageCrumbs();
  const pageName = useDocumentPageName();
  const { toggleMobileNav } = useApplicationContext();
  const { isRestricted } = usePermissions();
  const lastCrumb = crumbs?.length ? crumbs[crumbs.length - 1].label : null;
  const title = spec?.title ?? lastCrumb ?? pageName;

  return (
    <header className={"nb-topbar"} data-testid={"app-topbar"}>
      {!isRestricted && (
        <button
          type={"button"}
          className={"nb-topbar__menu"}
          aria-label={t("nav:shell.label.openMenu")}
          onClick={toggleMobileNav}
        >
          <MenuIcon size={20} />
        </button>
      )}
      <div className={"nb-topbar__lead"}>
        {crumbs?.length ? (
          <Crumbs items={crumbs} className={"nb-topbar__crumbs"} />
        ) : (
          <span className={"nb-topbar__crumbs nb-topbar__where"}>{title}</span>
        )}
        <span className={"nb-topbar__title"}>{title}</span>
      </div>
      <div className={"nb-topbar__actions"}>
        <MSPTransferAccountModal />
        <DistributorTransferAccountModal />
        <MSPTenantsSwitcher />
        <HelpAndSupportButton />
        <UserDropdown />
      </div>
    </header>
  );
}

export function Crumbs({
  items,
  className,
}: {
  items: PageCrumb[];
  className?: string;
}) {
  const last = items.length - 1;
  return (
    <nav aria-label={t("nav:shell.label.breadcrumb")} className={className}>
      <ol className={"nb-crumbs"}>
        {items.map((item, i) => (
          <li key={i} className={"nb-crumbs__item"}>
            {i > 0 && (
              <ChevronRightIcon size={14} className={"nb-crumbs__sep"} />
            )}
            {item.icon && (
              <span className={"nb-crumbs__icon"}>{item.icon}</span>
            )}
            {item.href && i < last ? (
              <Link href={item.href} data-testid={"breadcrumb-item"}>
                {item.label}
              </Link>
            ) : (
              <span aria-current={i === last ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
