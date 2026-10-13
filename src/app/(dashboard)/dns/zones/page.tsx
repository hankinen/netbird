"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import useFetchApi from "@utils/api";
import { ExternalLinkIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import DNSIcon from "@/assets/icons/DNSIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { DNS_ZONE_DOCS_LINK, DNSZone } from "@/interfaces/DNS";
import PageContainer from "@/layouts/PageContainer";
import { DNSZonesProvider } from "@/modules/dns/zones/DNSZonesProvider";
import DNSZoneIcon from "@/assets/icons/DNSZoneIcon";

import { t } from "@/i18n";
const DNSZonesTable = lazy(
  () => import("@/modules/dns/zones/table/DNSZonesTable"),
);

export default function DNSZonePage() {
  const { permission } = usePermissions();

  const { data: zones, isLoading } = useFetchApi<DNSZone[]>("/dns/zones");

  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item label={"DNS"} icon={<DNSIcon size={13} />} />
          <Breadcrumbs.Item
            href={"/dns/zones"}
            label={t("dns.page:page.label.zones")}
            active
            icon={<DNSZoneIcon size={16} />}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>{t("dns.page:page.label.zones")}</h1>
        <Paragraph>
          {t("dns.page:page.text.manageDNSZonesToControl")}{" "}
          <InlineLink href={DNS_ZONE_DOCS_LINK} target={"_blank"}>
            {t("common:word.learnMore")}
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </Paragraph>
      </div>

      <RestrictedAccess page={"DNS Zones"} hasAccess={permission?.dns?.read}>
        <Suspense fallback={<SkeletonTable />}>
          <DNSZonesProvider>
            <DNSZonesTable
              isLoading={isLoading}
              headingTarget={portalTarget}
              data={zones}
            />
          </DNSZonesProvider>
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
