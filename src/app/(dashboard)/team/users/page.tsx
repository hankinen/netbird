"use client";

import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useFetchApi from "@utils/api";
import { isNetBirdCloud } from "@utils/netbird";
import { ExternalLinkIcon, User2 } from "lucide-react";
import React, { lazy, Suspense } from "react";
import TeamIcon from "@/assets/icons/TeamIcon";
import { AccountMfaCard } from "@/cloud/mfa/AccountMFACard";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { User } from "@/interfaces/User";
import PageContainer from "@/layouts/PageContainer";
import { IdentityProviderCard } from "@/modules/integrations/idp-sync/IdentityProviderCard";
import { usePageHeader } from "@/theme/shell/pageHeader";
const UsersTable = lazy(() => import("@/modules/users/UsersTable"));

export default function TeamUsers() {
  const { isLoading: isGroupsLoading } = useGroups();
  const { permission } = usePermissions();
  const { data: users, isLoading } = useFetchApi<User[]>(
    "/users?service_user=false",
  );
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("team.page:page.text.manageUsersAndTheirPermissions")}{" "}
        <InlineLink
          href={"https://docs.netbird.io/how-to/add-users-to-your-network"}
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
        label: t("team.page:page.label.team"),
        href: "/team",
        icon: <TeamIcon size={13} />,
      },
      {
        label: t("common:word.users"),
        href: "/team/users",
        icon: <User2 size={16} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("common:word.users"),
    count: users?.length,
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess page={"Users"} hasAccess={permission.users.read}>
        <Suspense fallback={<SkeletonTable />}>
          {permission.settings.read && (
            <div className={"flex flex-wrap gap-4 p-default pb-6"}>
              {(permission?.idp?.read || !isNetBirdCloud()) && (
                <IdentityProviderCard />
              )}
              <AccountMfaCard />
            </div>
          )}
          <UsersTable users={users} isLoading={isLoading || isGroupsLoading} />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
