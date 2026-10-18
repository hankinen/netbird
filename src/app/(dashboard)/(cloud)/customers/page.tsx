"use client";

import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import FullScreenLoading from "@components/ui/FullScreenLoading";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useFetchApi from "@utils/api";
import React, { Suspense } from "react";
import MSPIcon from "@/assets/icons/MSPIcon";
import { CustomersProvider } from "@/cloud/distributor/contexts/CustomersProvider";
import { useDistributor } from "@/cloud/distributor/contexts/DistributorProvider";
import { DistributorDocsLink } from "@/cloud/distributor/DistributorDocsLink";
import { DistributorCustomer } from "@/cloud/distributor/interfaces/Distributor";
import DistributorCustomersTable from "@/cloud/distributor/table/DistributorCustomersTable";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import PageContainer from "@/layouts/PageContainer";
import { usePageHeader } from "@/theme/shell/pageHeader";
export default function CustomersPage() {
  const { isDistributorInfoLoading } = useDistributor();
  if (isDistributorInfoLoading) return <FullScreenLoading fullScreen={false} />;
  return <CustomersPageContent />;
}

const CustomersPageContent = () => {
  const { permission } = usePermissions();
  const { data: customers, isLoading } = useFetchApi<DistributorCustomer[]>(
    "/integrations/msp/reseller/msps",
  );
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => <>{t("customers.page:page.text.useThisViewToManage")}</>,
    [],
  );
  const pageCrumbs = React.useMemo(
    () => [
      {
        label: t("common:word.customers"),
        href: "/customers",
        icon: <MSPIcon size={15} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("common:word.customers"),
    count: customers?.length,
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Paragraph>
          <DistributorDocsLink />
          {t("customers.page:page.text.inOurDocumentation")}
        </Paragraph>
      </div>
      <RestrictedAccess
        page={"Customers"}
        hasAccess={permission.tenants.create}
      >
        <Suspense fallback={<SkeletonTable />}>
          <CustomersProvider>
            <DistributorCustomersTable
              isLoading={isLoading}
              customers={customers}
            />
          </CustomersProvider>
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
};
