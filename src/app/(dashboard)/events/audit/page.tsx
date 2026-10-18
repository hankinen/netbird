"use client";

import InlineLink from "@components/InlineLink";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useFetchApi from "@utils/api";
import { ExternalLinkIcon, LogsIcon } from "lucide-react";
import React from "react";
import ActivityIcon from "@/assets/icons/ActivityIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { ActivityEvent } from "@/interfaces/ActivityEvent";
import PageContainer from "@/layouts/PageContainer";
import ActivityTable from "@/modules/activity/ActivityTable";
import { EventStreamingCard } from "@/modules/integrations/event-streaming/EventStreamingCard";
import { usePageHeader } from "@/theme/shell/pageHeader";
export default function Activity() {
  const { permission } = usePermissions();

  const { data: events, isLoading } =
    useFetchApi<ActivityEvent[]>("/events/audit");
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("events.page:page.text.auditConfigurationChangesAccessPolicy")}{" "}
        <InlineLink
          href={"https://docs.netbird.io/how-to/audit-events-logging"}
          target={"_blank"}
        >
          {t("common:word.learnMore")}
          <ExternalLinkIcon size={12} />
        </InlineLink>
      </>
    ),
    [],
  );
  const pageCrumbs = React.useMemo(
    () => [
      {
        label: t("events.page:page.label.activity"),
        icon: <ActivityIcon size={13} />,
      },
      {
        label: t("events.page:page.label.auditEvents"),
        href: "/events/audit",
        icon: <LogsIcon size={18} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("events.page:page.label.auditEvents"),
    count: events?.length,
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess page={"Activity"} hasAccess={permission.events.read}>
        <EventStreamingCard />
        <ActivityTable events={events} isLoading={isLoading} />
      </RestrictedAccess>
    </PageContainer>
  );
}
