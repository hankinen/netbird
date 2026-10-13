"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
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
export default function NetworkTrafficPage() {
  const account = useAccount();
  const { permission } = usePermissions();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();
  const isTrafficEventsLocked = useIsFeatureLocked("TRAFFIC_EVENTS");

  const isEnabled = !!account?.settings?.extra?.network_traffic_logs_enabled;

  const defaultFilters = useMemo(
    () => ({
      start_date: dayjs().subtract(7, "day").startOf("day").toISOString(),
      end_date: dayjs().endOf("day").toISOString(),
    }),
    [],
  );

  return (
    <PageContainer>
      <div className="p-default py-6">
        <Breadcrumbs>
          <Breadcrumbs.Item
            label={t("events.page:page.label.activity")}
            disabled
            icon={<ActivityIcon size={13} />}
          />
          <Breadcrumbs.Item
            href="/events/traffic"
            label={t("events.page:page.label.trafficEvents")}
            icon={<ArrowLeftRightIcon size={15} />}
          />
        </Breadcrumbs>

        <h1 ref={headingRef}>{t("events.page:page.label.trafficEvents")}</h1>

        <Paragraph>
          {t("events.page:page.text.trafficEventsIsAnExperimental")}
        </Paragraph>

        <Paragraph>
          {t("common:word.learnMoreAbout")}{" "}
          <InlineLink href={TRAFFIC_EVENTS_DOC_LINK} target="_blank">
            {t("events.page:page.label.trafficEvents")}{" "}
            <ExternalLinkIcon size={12} />
          </InlineLink>{" "}
          {t("events.page:page.text.inOurDocumentation")}
        </Paragraph>
      </div>

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
              <TrafficEventsTable
                headingTarget={portalTarget}
                isSettingEnabled={isEnabled}
              />
            </ServerPaginationProvider>
          </PeersProvider>
        </LockedFeatureOverlay>
      </RestrictedAccess>
    </PageContainer>
  );
}
