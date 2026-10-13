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
import AccessControlIcon from "@/assets/icons/AccessControlIcon";
import GroupsProvider from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import PoliciesProvider from "@/contexts/PoliciesProvider";
import { t } from "@/i18n";
import { Policy } from "@/interfaces/Policy";
import PageContainer from "@/layouts/PageContainer";
const AccessControlTable = lazy(
  () => import("@/modules/access-control/table/AccessControlTable"),
);
export default function AccessControlPage() {
  const { permission } = usePermissions();

  const { data: policies, isLoading } = useFetchApi<Policy[]>("/policies");

  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <GroupsProvider>
        <div className={"p-default py-6"}>
          <Breadcrumbs>
            <Breadcrumbs.Item
              href={"/access-control"}
              label={t("access-control.page:page.label.accessControl")}
              icon={<AccessControlIcon size={14} />}
            />
          </Breadcrumbs>
          <h1 ref={headingRef}>
            {t("access-control.page:page.text.accessControlPolicies")}
          </h1>
          <Paragraph>
            {t("access-control.page:page.text.policiesConnectUsersAndAgents")}{" "}
            <InlineLink
              href={"https://docs.netbird.io/how-to/manage-network-access"}
              target={"_blank"}
            >
              {t("common:word.learnMore")}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>

        <RestrictedAccess
          page={"Access Control"}
          hasAccess={permission.policies.read}
        >
          <PoliciesProvider>
            <Suspense fallback={<SkeletonTable />}>
              <AccessControlTable
                isLoading={isLoading}
                policies={policies}
                headingTarget={portalTarget}
              />
            </Suspense>
          </PoliciesProvider>
        </RestrictedAccess>
      </GroupsProvider>
    </PageContainer>
  );
}
