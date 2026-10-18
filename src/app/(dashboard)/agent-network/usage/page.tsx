"use client";

import SkeletonTable from "@components/skeletons/SkeletonTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import dayjs from "dayjs";
import { LayoutDashboard, ScrollText } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useMemo, useState } from "react";
import AgentNetworkIcon from "@/assets/icons/AgentNetworkIcon";
import GroupsProvider from "@/contexts/GroupsProvider";
import PeersProvider from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ServerPaginationProvider from "@/contexts/ServerPaginationProvider";
import { t } from "@/i18n";
import PageContainer from "@/layouts/PageContainer";
import AgentAccessLogTable from "@/modules/agent-network/AgentAccessLogTable";
import AgentOverviewPanel from "@/modules/agent-network/AgentOverviewPanel";
import AIProvidersProvider from "@/modules/agent-network/AIProvidersProvider";
import { useMyAgentNetworkSetup } from "@/modules/agent-network/useMyAgentNetworkSetup";
import { usePageHeader } from "@/theme/shell/pageHeader";
// Tab ids — kept stable so ?tab=<id> URL hand-off works (e.g.
// /agent-network/usage?tab=access-logs), the same way Settings deep-links tabs.
const TAB_USAGE = "usage";
const TAB_ACCESS_LOGS = "access-logs";

// UsageAndLogsPage surfaces the live access log and the spend dashboard.
// Budget rules and log-collection controls live under the separate
// Configuration entry. Providers are mounted once at the top so switching
// tabs is instant — no re-fetch on tab change.
export default function UsageAndLogsPage() {
  const { permission } = usePermissions();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const canReadUsage = !!permission?.["agent_network.usage"]?.read;
  const canReadLogs = !!permission?.["agent_network.logs"]?.read;
  // Callers without the account-wide grants still get this page once their
  // own Agent Network setup is configured: the server self-scopes the usage
  // and log endpoints to them, so the same tabs render their own data.
  const { configured: mySetupConfigured } = useMyAgentNetworkSetup();
  const canUseUsage = canReadUsage || mySetupConfigured;
  const canUseLogs = canReadLogs || mySetupConfigured;

  // Each tab maps to its own permission submodule (usage_viewer, for one,
  // reads usage but not the request-level log). Only permitted tabs are
  // selectable; a deep link to a forbidden or unknown tab falls back to the
  // first permitted one.
  const allowedTabs = useMemo(() => {
    const tabs = new Set<string>();
    if (canUseUsage) tabs.add(TAB_USAGE);
    if (canUseLogs) tabs.add(TAB_ACCESS_LOGS);
    return tabs;
  }, [canUseUsage, canUseLogs]);
  const defaultTab = canUseUsage ? TAB_USAGE : TAB_ACCESS_LOGS;

  // The ?tab= query is the single source of truth; onTabChange below pushes
  // it, so deep links, back/forward and clicks all resolve the same way.
  const queryTab = searchParams.get("tab") ?? "";
  const tab = allowedTabs.has(queryTab) ? queryTab : defaultTab;

  // Access-log view mode: flat per-request rows, or grouped by provider session.
  // Each mode hits its own endpoint and the provider is remounted on toggle
  // (keyed below) so the two response shapes never cross.
  const [groupBySession, setGroupBySession] = useState(false);

  // Default the access-log view to the last 14 days. Computed once on mount so
  // the window is stable across re-renders; resetting filters returns here.
  const defaultAccessLogFilters = useMemo(
    () => ({
      start_date: dayjs().subtract(14, "day").startOf("day").toISOString(),
      end_date: dayjs().endOf("day").toISOString(),
    }),
    [],
  );

  // Reflect the active tab in the URL so it's shareable, like Settings.
  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => <>{t("agent-network.page:page.text.perRequestAuditWithReal")}</>,
    [],
  );
  const pageCrumbs = React.useMemo(
    () => [
      {
        label: t("agent-network.page:page.label.agentNetwork"),
        href: "/agent-network/providers",
        icon: <AgentNetworkIcon size={16} />,
      },
      {
        label: t("agent-network.page:page.label.usageLogs"),
        href: "/agent-network/usage",
      },
    ],
    [],
  );
  usePageHeader({
    title: t("agent-network.page:page.label.usageLogs"),
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess
        page={"Usage & Logs"}
        hasAccess={canUseUsage || canUseLogs}
      >
        <GroupsProvider>
          <PeersProvider>
            <AIProvidersProvider>
              <Tabs
                value={tab}
                onValueChange={onTabChange}
                className={"pt-4 pb-0 mb-0"}
              >
                <TabsList justify={"start"} className={"px-8"}>
                  {canUseUsage && (
                    <TabsTrigger value={TAB_USAGE}>
                      <LayoutDashboard size={16} />
                      {t("agent-network.page:page.text.usage")}
                    </TabsTrigger>
                  )}
                  {canUseLogs && (
                    <TabsTrigger value={TAB_ACCESS_LOGS}>
                      <ScrollText size={16} />
                      {t("agent-network.page:page.text.accessLogs")}
                    </TabsTrigger>
                  )}
                </TabsList>

                {canUseUsage && (
                  <TabsContent value={TAB_USAGE} className={"pb-8"}>
                    <Suspense fallback={<SkeletonTable />}>
                      <AgentOverviewPanel selfScoped={!canReadUsage} />
                    </Suspense>
                  </TabsContent>
                )}

                {canUseLogs && (
                  <TabsContent value={TAB_ACCESS_LOGS} className={"pb-8"}>
                    <Suspense fallback={<SkeletonTable />}>
                      <ServerPaginationProvider
                        key={groupBySession ? "sessions" : "flat"}
                        url={
                          groupBySession
                            ? "/agent-network/access-log-sessions"
                            : "/agent-network/access-logs"
                        }
                        defaultPageSize={25}
                        defaultFilters={defaultAccessLogFilters}
                      >
                        <AgentAccessLogTable
                          grouped={groupBySession}
                          onGroupedChange={setGroupBySession}
                          selfScoped={!canReadLogs}
                        />
                      </ServerPaginationProvider>
                    </Suspense>
                  </TabsContent>
                )}
              </Tabs>
            </AIProvidersProvider>
          </PeersProvider>
        </GroupsProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
