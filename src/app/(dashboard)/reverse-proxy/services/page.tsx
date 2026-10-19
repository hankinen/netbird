"use client";

import { Callout } from "@components/Callout";
import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { isNetBirdCloud } from "@utils/netbird";
import { ExternalLinkIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ReverseProxiesProvider from "@/contexts/ReverseProxiesProvider";
import { t } from "@/i18n";
import { REVERSE_PROXY_DOCS_LINK } from "@/interfaces/ReverseProxy";
import PageContainer from "@/layouts/PageContainer";
import { usePageHeader } from "@/theme/shell/pageHeader";
const ReverseProxyTable = lazy(
  () => import("@/modules/reverse-proxy/table/ReverseProxyTable"),
);

export default function ReverseProxyServicesPage() {
  const { permission } = usePermissions();
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("reverse-proxy.page:page.text.exposeServicesSecurelyThroughNetBird")}{" "}
        <InlineLink href={REVERSE_PROXY_DOCS_LINK} target={"_blank"}>
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
        label: t("common:countWord.services"),
        href: "/reverse-proxy/services",
      },
    ],
    [],
  );
  usePageHeader({
    title: t("common:countWord.services"),
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        {isNetBirdCloud() ? (
          <Callout className={"max-w-xl mt-5"} variant={"info"}>
            {t("reverse-proxy.page:page.text.netBirdAposSReverseProxy")}
          </Callout>
        ) : (
          <Callout className={"max-w-xl mt-5"} variant={"info"}>
            {t("reverse-proxy.page:page.text.netBirdAposSReverseProxy2")} <br />{" "}
            {t(
              "reverse-proxy.page:page.text.featuresAndFunctionalityAreSubject",
            )}
          </Callout>
        )}
      </div>

      <RestrictedAccess
        page={"Services"}
        hasAccess={permission?.services?.read}
      >
        <ReverseProxiesProvider>
          <Suspense fallback={<SkeletonTable />}>
            <ReverseProxyTable />
          </Suspense>
        </ReverseProxiesProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
