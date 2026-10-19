"use client";

import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { ExternalLinkIcon, FolderGit2Icon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import InlineLink from "@/components/InlineLink";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import PageContainer from "@/layouts/PageContainer";
import { usePageHeader } from "@/theme/shell/pageHeader";
const GroupsTable = lazy(() => import("@/modules/groups/table/GroupsTable"));

export default function GroupsPage() {
  const { permission } = usePermissions();
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("groups.page:page.text.organizePeersUsersAndResources")}{" "}
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
        label: t("common:word.groups"),
        href: "/groups",
        icon: <FolderGit2Icon size={14} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("common:word.groups"),
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess hasAccess={permission.groups.read} page={"Groups"}>
        <Suspense fallback={<SkeletonTable />}>
          <GroupsTable />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
