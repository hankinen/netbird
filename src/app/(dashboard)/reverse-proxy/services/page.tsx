"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import { ExternalLinkIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ReverseProxiesProvider from "@/contexts/ReverseProxiesProvider";
import { REVERSE_PROXY_DOCS_LINK } from "@/interfaces/ReverseProxy";
import PageContainer from "@/layouts/PageContainer";
import { Callout } from "@components/Callout";
import { isNetBirdCloud } from "@utils/netbird";

import { t } from "@/i18n";
const ReverseProxyTable = lazy(
  () => import("@/modules/reverse-proxy/table/ReverseProxyTable"),
);

export default function ReverseProxyServicesPage() {
  const { permission } = usePermissions();

  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/reverse-proxy/services"}
            label={t("reverse-proxy.page:page.label.reverseProxy")}
            icon={<ReverseProxyIcon size={16} />}
          />
          <Breadcrumbs.Item
            href={"/reverse-proxy/services"}
            label={t("common:countWord.services")}
            active={true}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>{t("common:countWord.services")}</h1>
        <Paragraph>
          {t(
            "reverse-proxy.page:page.text.exposeServicesSecurelyThroughNetBird",
          )}{" "}
          <InlineLink href={REVERSE_PROXY_DOCS_LINK} target={"_blank"}>
            {t("common:word.learnMore")}
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </Paragraph>

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
            <ReverseProxyTable headingTarget={portalTarget} />
          </Suspense>
        </ReverseProxiesProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
