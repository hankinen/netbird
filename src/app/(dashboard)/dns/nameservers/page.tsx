"use client";

import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useFetchApi from "@utils/api";
import { ExternalLinkIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import DNSIcon from "@/assets/icons/DNSIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { NameserverGroup } from "@/interfaces/Nameserver";
import PageContainer from "@/layouts/PageContainer";
import { usePageHeader } from "@/theme/shell/pageHeader";
const NameserverGroupTable = lazy(
  () => import("@/modules/dns/nameservers/table/NameserverGroupTable"),
);

export default function NameServers() {
  const { permission } = usePermissions();

  const { data: nameserverGroups, isLoading } =
    useFetchApi<NameserverGroup[]>("/dns/nameservers");
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("dns.page:page.text.addNameserversForDomainName")}{" "}
        <InlineLink
          href={"https://docs.netbird.io/how-to/manage-dns-in-your-network"}
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
      { label: "DNS", href: "/dns/nameservers", icon: <DNSIcon size={13} /> },
      {
        label: t("dns.page:page.label.nameservers"),
        href: "/dns/nameservers",
        icon: <DNSIcon size={13} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("dns.page:page.label.nameservers"),
    count: nameserverGroups?.length,
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess
        page={"Nameservers"}
        hasAccess={permission.nameservers.read}
      >
        <Suspense fallback={<SkeletonTable />}>
          <NameserverGroupTable
            nameserverGroups={nameserverGroups}
            isLoading={isLoading}
          />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
