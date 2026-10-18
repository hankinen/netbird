"use client";

import InlineLink from "@components/InlineLink";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import dayjs from "dayjs";
import { ExternalLinkIcon } from "lucide-react";
import React, { useMemo } from "react";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import PeersProvider from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ServerPaginationProvider from "@/contexts/ServerPaginationProvider";
import { t } from "@/i18n";
import { REVERSE_PROXY_EVENTS_DOCS_LINK } from "@/interfaces/ReverseProxy";
import PageContainer from "@/layouts/PageContainer";
import ReverseProxyEventsTable from "@/modules/reverse-proxy/events/ReverseProxyEventsTable";
import { usePageHeader } from "@/theme/shell/pageHeader";
export default function ProxyLogsPage() {
  const { permission } = usePermissions();

  const defaultFilters = useMemo(
    () => ({
      start_date: dayjs().subtract(7, "day").startOf("day").toISOString(),
      end_date: dayjs().endOf("day").toISOString(),
      sort_by: "timestamp",
      sort_order: "desc",
    }),
    [],
  );
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("reverse-proxy.page:page.text.viewAccessLogsForYour")}{" "}
        <InlineLink href={REVERSE_PROXY_EVENTS_DOCS_LINK} target="_blank">
          {t("common:word.learnMore")} <ExternalLinkIcon size={12} />
        </InlineLink>
      </>
    ),
    [],
  );
  const pageCrumbs = React.useMemo(
    () => [
      {
        label: t("reverse-proxy.page:page.label.reverseProxy"),
        icon: <ReverseProxyIcon size={15} />,
      },
      {
        label: t("reverse-proxy.page:page.label.accessLogs"),
        href: "/reverse-proxy/logs",
        icon: <ReverseProxyIcon size={15} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("reverse-proxy.page:page.label.accessLogs"),
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess
        page="Access Logs"
        hasAccess={permission?.services?.read}
      >
        <ServerPaginationProvider
          url="/events/proxy"
          defaultPageSize={25}
          defaultFilters={defaultFilters}
        >
          <PeersProvider>
            <ReverseProxyEventsTable />
          </PeersProvider>
        </ServerPaginationProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
