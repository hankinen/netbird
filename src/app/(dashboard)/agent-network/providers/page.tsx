"use client";

import FeatureCard from "@components/FeatureCard";
import { HelpTooltip } from "@components/HelpTooltip";
import InlineLink from "@components/InlineLink";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { ExternalLinkIcon } from "lucide-react";
import React, { Suspense } from "react";
import AgentNetworkIcon from "@/assets/icons/AgentNetworkIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import PageContainer from "@/layouts/PageContainer";
import AIProviderModal from "@/modules/agent-network/AIProviderModal";
import AIProvidersProvider, {
  useAIProviders,
} from "@/modules/agent-network/AIProvidersProvider";
import EndpointBadge, {
  ENDPOINT_HELP_TEXT,
} from "@/modules/agent-network/EndpointBadge";
import AgentProvidersTable from "@/modules/agent-network/table/AgentProvidersTable";
import { usePageHeader } from "@/theme/shell/pageHeader";
function EndpointHeader() {
  const { settings, settingsLoading, openWizard } = useAIProviders();
  const { permission } = usePermissions();
  if (settingsLoading) return null;
  if (!settings) {
    // The bootstrap CTA opens the provider wizard, so only callers who can
    // actually connect a provider get it; read-only viewers (usage_viewer)
    // see nothing until an admin sets the endpoint up.
    if (!permission?.["agent_network.providers"]?.create) return null;
    return (
      <FeatureCard
        variant={"plain"}
        onClick={openWizard}
        className={
          "border-dashed bg-nb-gray-900/20 hover:border-nb-gray-700 hover:bg-nb-gray-900/40"
        }
        title={
          <>
            {t("agent-network.page:page.text.aPIBaseURL")}
            <span onClick={(e) => e.stopPropagation()}>
              <HelpTooltip iconSize={11} content={ENDPOINT_HELP_TEXT} />
            </span>
          </>
        }
        description={t(
          "agent-network.page:page.description.connectYourFirstProviderTo",
        )}
      />
    );
  }
  return <EndpointBadge endpoint={settings.endpoint} variant={"plain"} />;
}

function PageBody({
  headingTarget,
}: {
  headingTarget: HTMLHeadingElement | null;
}) {
  const { isWizardOpen, closeWizard } = useAIProviders();

  return (
    <>
      <Suspense fallback={<SkeletonTable />}>
        <AgentProvidersTable headingTarget={headingTarget} />
      </Suspense>
      <AIProviderModal open={isWizardOpen} onOpenChange={closeWizard} />
    </>
  );
}

export default function AgentNetworkProvidersPage() {
  const { permission } = usePermissions();
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("agent-network.page:page.text.connectAIProvidersAndGateways")}
        <InlineLink
          href={"https://docs.netbird.io/agent-network/providers"}
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
        label: t("agent-network.page:page.label.agentNetwork"),
        href: "/agent-network/providers",
        icon: <AgentNetworkIcon size={16} />,
      },
      { label: t("common:word.providers"), href: "/agent-network/providers" },
    ],
    [],
  );
  usePageHeader({
    title: t("common:word.providers"),
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      {/* Gate the whole surface: AIProvidersProvider and EndpointHeader fetch
          agent-network state, so they must not mount for users without
          read on the providers submodule. */}
      <RestrictedAccess
        page={"Providers"}
        hasAccess={permission?.["agent_network.providers"]?.read}
      >
        <AIProvidersProvider>
          <div className={"p-default py-6"}>
            {/* Same 24px step the users and activity pages put between their
                description and the card below it. */}
            <div className={"mt-6"}>
              <EndpointHeader />
            </div>
          </div>

          <PageBody headingTarget={null} />
        </AIProvidersProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
