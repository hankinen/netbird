"use client";

import { Callout } from "@components/Callout";
import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useFetchApi from "@utils/api";
import { ArrowUpRightIcon, ExternalLinkIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import PeersProvider from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import RoutesProvider from "@/contexts/RoutesProvider";
import { t } from "@/i18n";
import { Route } from "@/interfaces/Route";
import PageContainer from "@/layouts/PageContainer";
import useGroupedRoutes from "@/modules/route-group/useGroupedRoutes";
import { usePageHeader } from "@/theme/shell/pageHeader";
const NetworkRoutesTable = lazy(
  () => import("@/modules/route-group/NetworkRoutesTable"),
);

export default function NetworkRoutes() {
  const { permission } = usePermissions();
  const { data: routes, isLoading } = useFetchApi<Route[]>("/routes");
  const groupedRoutes = useGroupedRoutes({ routes });
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("network-routes.page:page.text.accessOtherNetworksLikeLANs")}{" "}
        <InlineLink
          href={
            "https://docs.netbird.io/how-to/routing-traffic-to-private-networks"
          }
          target={"_blank"}
          aria-label={t(
            "network-routes.page:page.ariaLabel.learnMoreAboutRoutingTraffic",
          )}
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
        label: t("common:word.networkRouting"),
        icon: <NetworkRoutesIcon size={13} />,
      },
      {
        label: t("network-routes.page:page.label.routes"),
        href: "/network-routes",
      },
    ],
    [],
  );
  usePageHeader({
    title: t("network-routes.page:page.label.routes"),
    count: routes?.length,
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RoutesProvider>
        <PeersProvider>
          <div className={"p-default py-6"}>
            <Callout className={"max-w-xl mt-5"} variant={"warning"}>
              <span>
                {t("network-routes.page:page.text.weRecommendUsingTheNew")}{" "}
                <InlineLink href={"/networks"}>
                  {t("network-routes.page:page.text.goToNetworks")}
                  <ArrowUpRightIcon size={14} />
                </InlineLink>
              </span>
            </Callout>
          </div>

          <RestrictedAccess hasAccess={permission.routes.read}>
            <Suspense fallback={<SkeletonTable />}>
              <NetworkRoutesTable
                isLoading={isLoading}
                groupedRoutes={groupedRoutes}
                routes={routes}
              />
            </Suspense>
          </RestrictedAccess>
        </PeersProvider>
      </RoutesProvider>
    </PageContainer>
  );
}
