"use client";

import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { ExternalLinkIcon } from "lucide-react";
import React, { Suspense } from "react";
import AgentNetworkIcon from "@/assets/icons/AgentNetworkIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import PageContainer from "@/layouts/PageContainer";
import AgentPoliciesTable from "@/modules/agent-network/AgentPoliciesTable";
import AIProvidersProvider from "@/modules/agent-network/AIProvidersProvider";
import { usePageHeader } from "@/theme/shell/pageHeader";
export default function AgentNetworkPoliciesPage() {
  const { permission } = usePermissions();
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => <>{t("agent-network.page:page.text.bindIdPGroupsToProviders")}</>,
    [],
  );
  const pageCrumbs = React.useMemo(
    () => [
      {
        label: t("agent-network.page:page.label.agentNetwork"),
        href: "/agent-network/providers",
        icon: <AgentNetworkIcon size={16} />,
      },
      {
        label: t("common:countWord.policies"),
        href: "/agent-network/policies",
      },
    ],
    [],
  );
  usePageHeader({
    title: t("common:countWord.policies"),
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <RestrictedAccess
        page={"Policies"}
        hasAccess={permission?.["agent_network.policies"]?.read}
      >
        <AIProvidersProvider>
          <Suspense fallback={<SkeletonTable />}>
            <AgentPoliciesTable />
          </Suspense>
        </AIProvidersProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
