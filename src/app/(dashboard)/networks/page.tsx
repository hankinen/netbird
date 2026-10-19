"use client";

import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useFetchApi from "@utils/api";
import { ExternalLinkIcon } from "lucide-react";
import React, { Suspense } from "react";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { Network } from "@/interfaces/Network";
import PageContainer from "@/layouts/PageContainer";
import NetworksTable from "@/modules/networks/table/NetworksTable";
import { usePageHeader } from "@/theme/shell/pageHeader";
export default function Networks() {
  const { data: networks, isLoading } = useFetchApi<Network[]>("/networks");
  const { permission } = usePermissions();
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("networks.page:page.text.accessInternalResourcesInLANs")}{" "}
        <InlineLink
          href={"https://docs.netbird.io/how-to/networks"}
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
        label: t("common:word.networkRouting"),
        icon: <NetworkRoutesIcon size={13} />,
      },
      { label: t("common:word.networks"), href: "/networks" },
    ],
    [],
  );
  usePageHeader({
    title: t("common:word.networks"),
    count: networks?.length,
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess hasAccess={permission.networks.read}>
        <Suspense fallback={<SkeletonTable />}>
          <NetworksTable data={networks} isLoading={isLoading} />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
