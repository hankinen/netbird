"use client";

import "../../app/globals.css";
import { isNetBirdCloud } from "@utils/netbird";
import React from "react";
import { NetBirdCloudProvider } from "@/cloud/contexts/NetBirdCloudProvider";
import DistributorProvider from "@/cloud/distributor/contexts/DistributorProvider";
import MSPProvider from "@/cloud/msp/contexts/MSPProvider";
import AnnouncementProvider from "@/contexts/AnnouncementProvider";
import ApplicationProvider from "@/contexts/ApplicationProvider";
import BillingProvider from "@/contexts/BillingProvider";
import CountryProvider from "@/contexts/CountryProvider";
import GroupsProvider from "@/contexts/GroupsProvider";
import UsersProvider from "@/contexts/UsersProvider";
import { OnboardingProvider } from "@/modules/onboarding/OnboardingProvider";
import { AppShell } from "./AppShell";

/**
 * Replaces src/layouts/DashboardLayout.tsx through the
 * `@/layouts/DashboardLayout` alias (src/app/(dashboard)/layout.tsx and the
 * story helper import it). The provider stack is upstream's, copied as is;
 * the chrome is the shell. check-selectors pins the upstream file so a
 * change to the stack there is reviewed here.
 * @replaces-file src/layouts/DashboardLayout.tsx sha256:cc554f026431397d
 */
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
                    <AppShell>{children}</AppShell>
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
