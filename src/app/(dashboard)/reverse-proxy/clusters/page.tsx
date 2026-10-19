"use client";

import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { ExternalLinkIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { REVERSE_PROXY_CLUSTERS_DOCS_LINK } from "@/interfaces/ReverseProxy";
import PageContainer from "@/layouts/PageContainer";
import { usePageHeader } from "@/theme/shell/pageHeader";
const ClustersTable = lazy(
  () => import("@/modules/reverse-proxy/clusters/ClustersTable"),
);

export default function ReverseProxyClustersPage() {
  const { permission } = usePermissions();
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("reverse-proxy.page:page.text.proxyClustersRouteInboundTraffic")}{" "}
        <InlineLink href={REVERSE_PROXY_CLUSTERS_DOCS_LINK} target={"_blank"}>
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
        label: t("reverse-proxy.page:page.label.reverseProxy"),
        href: "/reverse-proxy/services",
        icon: <ReverseProxyIcon size={16} />,
      },
      {
        label: t("reverse-proxy.page:page.label.clusters"),
        href: "/reverse-proxy/clusters",
      },
    ],
    [],
  );
  usePageHeader({
    title: t("reverse-proxy.page:page.label.clusters"),
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess
        page={"Clusters"}
        hasAccess={permission?.services?.read}
      >
        <Suspense fallback={<SkeletonTable />}>
          <ClustersTable />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
