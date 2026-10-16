import Button from "@components/Button";
import { ArrowRightIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import {
  AgentConnectTabs,
  connectExample,
} from "@/modules/agent-network/AgentConnectTabs";
import { useAIProviders } from "@/modules/agent-network/AIProvidersProvider";
type Props = {
  onBack: () => void;
  onNext: () => void;
};

// OnboardingAgentConfigure covers the quickstart's "Configure Your Agent"
// step. The per-tool snippets (Claude Code, Codex, an SDK, cURL) are shown
// inline via AgentConnectTabs, with the endpoint pre-filled and the SDK and
// cURL requests in the connected provider's API shape.
export const OnboardingAgentConfigure = ({ onBack, onNext }: Props) => {
  const { settings, providers } = useAIProviders();

  // Open the tab that matches the connected provider: Anthropic and Kimi
  // (whose upstream also speaks the Anthropic Messages API) get the Claude
  // Code config, everything else is OpenAI-shaped so default to cURL.
  const defaultTab = providers.some(
    (p) => p.providerId === "anthropic_api" || p.providerId === "kimi_api",
  )
    ? "claude-code"
    : "curl";

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center"}>
          {t(
            "onboarding.agent-network:onboardingAgentConfigure.text.configureYourAgent",
          )}
        </h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t(
            "onboarding.agent-network:onboardingAgentConfigure.text.pointYourAgentToThe",
          )}
        </div>
      </div>

      {settings ? (
        <AgentConnectTabs
          endpoint={settings.endpoint}
          listClassName={"px-0"}
          contentClassName={"px-0 py-2"}
          defaultTab={defaultTab}
          providerIds={providers.map((p) => p.providerId)}
          example={connectExample(providers)}
        />
      ) : (
        <div
          className={
            "mt-2 text-center text-sm text-nb-gray-400 font-light sm:px-4"
          }
        >
          {t(
            "onboarding.agent-network:onboardingAgentConfigure.text.connectAProviderToGenerate",
          )}
        </div>
      )}

      <div className={"flex items-center justify-center mt-4 gap-3"}>
        <Button variant={"secondary"} onClick={onBack}>
          {t("onboarding.agent-network:onboardingAgentConfigure.text.goBack")}
        </Button>
        <Button variant={"primary"} onClick={onNext}>
          {t("common:word.continue")}
          <ArrowRightIcon size={16} />
        </Button>
      </div>
    </div>
  );
};
