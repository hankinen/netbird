"use client";

import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
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
import { usePageHeader } from "@/theme/shell/pageHeader";
const AccessControlTable = lazy(
  () => import("@/modules/access-control/table/AccessControlTable"),
);
export default function AccessControlPage() {
  const { permission } = usePermissions();

  const { data: policies, isLoading } = useFetchApi<Policy[]>("/policies");
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("access-control.page:page.text.policiesConnectUsersAndAgents")}{" "}
        <InlineLink
          href={"https://docs.netbird.io/how-to/manage-network-access"}
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
        label: t("access-control.page:page.label.accessControl"),
        href: "/access-control",
        icon: <AccessControlIcon size={14} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("access-control.page:page.text.accessControlPolicies"),
    count: policies?.length,
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <GroupsProvider>
        <RestrictedAccess
          page={"Access Control"}
          hasAccess={permission.policies.read}
        >
          <PoliciesProvider>
            <Suspense fallback={<SkeletonTable />}>
              <AccessControlTable isLoading={isLoading} policies={policies} />
            </Suspense>
          </PoliciesProvider>
        </RestrictedAccess>
      </GroupsProvider>
    </PageContainer>
  );
}
