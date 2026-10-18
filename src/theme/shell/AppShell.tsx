"use client";

import { AnnouncementBanner } from "@components/ui/AnnouncementBanner";
import React from "react";
import { useApplicationContext } from "@/contexts/ApplicationProvider";
import Header from "@/layouts/Header";
import { BottomBar } from "./BottomBar";
import { NavDrawer } from "./NavDrawer";
import { PageHeaderProvider } from "./pageHeader";
import { PageHeaderBar } from "./PageHeaderBar";
import { Sider } from "./Sider";

/**
 * The dashboard chrome (UI architecture, section 4.2): announcement row,
 * then sider + main column (top bar, page header bar, the page, bottom bar),
 * and the phone drawer. Every part renders in every layout mode and
 * shell.css shows or hides it with the contract's media queries, so the
 * first paint of the static export is right before hydration; only the
 * sider's tablet default and the drawer use JavaScript.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { mobileNavOpen } = useApplicationContext();
  return (
    <PageHeaderProvider>
      <div className={"nb-shell"}>
        <AnnouncementBanner />
        <div className={"nb-shell__body"} inert={mobileNavOpen || undefined}>
          <Sider />
          <div className={"nb-shell__main"}>
            <Header />
            <PageHeaderBar />
            <div className={"nb-shell__content"}>{children}</div>
            <BottomBar />
          </div>
        </div>
        <NavDrawer />
      </div>
    </PageHeaderProvider>
  );
}
