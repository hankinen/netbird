"use client";

import InlineLink from "@components/InlineLink";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import dayjs from "dayjs";
import { ArrowLeftRightIcon, ExternalLinkIcon } from "lucide-react";
import React, { useMemo } from "react";
import ActivityIcon from "@/assets/icons/ActivityIcon";
import { useIsFeatureLocked } from "@/cloud/cloud-hooks/useIsFeatureLocked";
import { TRAFFIC_EVENTS_DOC_LINK } from "@/cloud/traffic-events/TrafficEventSetting";
import TrafficEventsTable from "@/cloud/traffic-events/TrafficEventsTable";
import PeersProvider from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ServerPaginationProvider from "@/contexts/ServerPaginationProvider";
import { t } from "@/i18n";
import PageContainer from "@/layouts/PageContainer";
import { useAccount } from "@/modules/account/useAccount";
import { LockedFeatureInfoCard } from "@/modules/billing/locked-feature/LockedFeatureInfoCard";
import { LockedFeatureOverlay } from "@/modules/billing/locked-feature/LockedFeatureOverlay";
import { EventStreamingCard } from "@/modules/integrations/event-streaming/EventStreamingCard";
import { usePageHeader } from "@/theme/shell/pageHeader";
export default function NetworkTrafficPage() {
  const account = useAccount();
  const { permission } = usePermissions();
  const isTrafficEventsLocked = useIsFeatureLocked("TRAFFIC_EVENTS");

  const isEnabled = !!account?.settings?.extra?.network_traffic_logs_enabled;

  const defaultFilters = useMemo(
    () => ({
      start_date: dayjs().subtract(7, "day").startOf("day").toISOString(),
      end_date: dayjs().endOf("day").toISOString(),
    }),
    [],
  );
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        <p>{t("events.page:page.text.trafficEventsIsAnExperimental")}</p>
        <p>
          {t("common:word.learnMoreAbout")}{" "}
          <InlineLink href={TRAFFIC_EVENTS_DOC_LINK} target="_blank">
            {t("events.page:page.label.trafficEvents")}{" "}
            <ExternalLinkIcon size={12} />
          </InlineLink>{" "}
          {t("events.page:page.text.inOurDocumentation")}
        </p>
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
        label: t("events.page:page.label.trafficEvents"),
        href: "/events/traffic",
        icon: <ArrowLeftRightIcon size={15} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("events.page:page.label.trafficEvents"),
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess
        page="Traffic Events"
        hasAccess={permission.events.read}
      >
        <div className={"p-default"}>
          <LockedFeatureInfoCard
            className={"mb-6"}
            feature={"TRAFFIC_EVENTS"}
            featureText={t("events.page:page.label.trafficEvents")}
          />
        </div>
        <LockedFeatureOverlay feature={"TRAFFIC_EVENTS"}>
          <EventStreamingCard />
          <PeersProvider>
            <ServerPaginationProvider
              url={"/events/network-traffic"}
              defaultPageSize={10}
              defaultFilters={defaultFilters}
              enabled={!isTrafficEventsLocked}
            >
              <TrafficEventsTable isSettingEnabled={isEnabled} />
            </ServerPaginationProvider>
          </PeersProvider>
        </LockedFeatureOverlay>
      </RestrictedAccess>
    </PageContainer>
  );
}
