"use client";

import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import FullScreenLoading from "@components/ui/FullScreenLoading";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useRedirect from "@hooks/useRedirect";
import useFetchApi from "@utils/api";
import React, { Suspense, useMemo } from "react";
import MSPIcon from "@/assets/icons/MSPIcon";
import { useMSP } from "@/cloud/msp/contexts/MSPProvider";
import { TenantsProvider } from "@/cloud/msp/contexts/TenantsProvider";
import { Tenant } from "@/cloud/msp/interfaces/Tenant";
import { MSPTenantDocsLink } from "@/cloud/msp/MSPTenantDocsLink";
import MSPTenantsTable from "@/cloud/msp/MSPTenantsTable";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { t } from "@/i18n";
import { User } from "@/interfaces/User";
import PageContainer from "@/layouts/PageContainer";
import { usePageHeader } from "@/theme/shell/pageHeader";
export default function TenantsPage() {
  const { isActive, isMSPInMSPContext, isMspInfoLoading } = useMSP();
  const { isOwnerOrAdmin } = useLoggedInUser();

  const show = useMemo(() => {
    if (!isActive) return false;
    return isMSPInMSPContext && isOwnerOrAdmin;
  }, [isActive, isMSPInMSPContext, isOwnerOrAdmin]);

  if (isMspInfoLoading) return <FullScreenLoading fullScreen={false} />;
  if (!show) return <Redirect />;
  return <TenantsPageContent />;
}

const Redirect = () => {
  useRedirect("/peers");
  return <FullScreenLoading fullScreen={false} />;
};

const TenantsPageContent = () => {
  const { permission } = usePermissions();
  const { data: tenants, isLoading } = useFetchApi<Tenant[]>(
    "/integrations/msp/tenants",
  );

  useFetchApi<User[]>("/users", true);
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => <>{t("tenants.page:page.text.aListOfAllTenants")}</>,
    [],
  );
  const pageCrumbs = React.useMemo(
    () => [
      {
        label: t("common:word.tenants"),
        href: "/tenants",
        icon: <MSPIcon size={15} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("common:word.tenants"),
    count: tenants?.length,
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Paragraph>
          <MSPTenantDocsLink />
          {t("tenants.page:page.text.inOurDocumentation")}
        </Paragraph>
      </div>
      <RestrictedAccess page={"Tenants"} hasAccess={permission.tenants.read}>
        <Suspense fallback={<SkeletonTable />}>
          <TenantsProvider>
            <MSPTenantsTable isLoading={isLoading} tenants={tenants} />
          </TenantsProvider>
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
};
