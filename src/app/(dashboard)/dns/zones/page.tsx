"use client";

import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useFetchApi from "@utils/api";
import { ExternalLinkIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import DNSIcon from "@/assets/icons/DNSIcon";
import DNSZoneIcon from "@/assets/icons/DNSZoneIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { DNS_ZONE_DOCS_LINK, DNSZone } from "@/interfaces/DNS";
import PageContainer from "@/layouts/PageContainer";
import { DNSZonesProvider } from "@/modules/dns/zones/DNSZonesProvider";
import { usePageHeader } from "@/theme/shell/pageHeader";
const DNSZonesTable = lazy(
  () => import("@/modules/dns/zones/table/DNSZonesTable"),
);

export default function DNSZonePage() {
  const { permission } = usePermissions();

  const { data: zones, isLoading } = useFetchApi<DNSZone[]>("/dns/zones");
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("dns.page:page.text.manageDNSZonesToControl")}{" "}
        <InlineLink href={DNS_ZONE_DOCS_LINK} target={"_blank"}>
          {t("common:word.learnMore")}
          <ExternalLinkIcon size={12} />
        </InlineLink>
      </>
    ),
    [],
  );
  const pageCrumbs = React.useMemo(
    () => [
      { label: "DNS", icon: <DNSIcon size={13} /> },
      {
        label: t("dns.page:page.label.zones"),
        href: "/dns/zones",
        icon: <DNSZoneIcon size={16} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("dns.page:page.label.zones"),
    count: zones?.length,
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess page={"DNS Zones"} hasAccess={permission?.dns?.read}>
        <Suspense fallback={<SkeletonTable />}>
          <DNSZonesProvider>
            <DNSZonesTable isLoading={isLoading} data={zones} />
          </DNSZonesProvider>
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
