"use client";

import FeatureCard from "@components/FeatureCard";
import { HelpTooltip } from "@components/HelpTooltip";
import useCopyToClipboard from "@hooks/useCopyToClipboard";
import { CheckIcon, CopyIcon, GlobeIcon } from "lucide-react";
import React from "react";
import { t } from "@/i18n";
// The tooltip is shared with the providers page's empty state, which shows the
// same card before an endpoint exists.
// Rendered through a component so the text is translated at render time.
const EndpointHelpText = () => (
  <>
    {t("agent-network.main:endpointBadge.helpText.useThisUrl")}
    <code className={"font-mono"}> base_url</code>
    {t("agent-network.main:endpointBadge.helpText.anthropics")}{" "}
    <code className={"font-mono"}>baseURL</code>
    {t("agent-network.main:endpointBadge.helpText.orAnyHttpClient")}
  </>
);
export const ENDPOINT_HELP_TEXT = <EndpointHelpText />;

// EndpointBadge is the "API Base URL" card — the one presentation of the
// endpoint everywhere it appears (providers page, Connect Agent). It shows the
// URL and copies it; the per-tool config that goes with it lives inline on the
// Connect Agent page, which is the only place it belongs.
export default function EndpointBadge({
  endpoint,
  variant = "default",
}: {
  // Bare endpoint host, e.g. "sailcloth.eu.proxy.netbird.io".
  endpoint: string;
  // "plain" drops the icon and shrinks the label, so the URL leads — the
  // shape the Connect Agent page wants, where the URL is the whole point.
  variant?: "default" | "plain";
}) {
  const [, copy, copied] = useCopyToClipboard(`https://${endpoint}`);

  return (
    <FeatureCard
      variant={variant}
      // The card widens with the URL instead of stopping at FeatureCard's
      // default cap, which let a long endpoint run under the copy button.
      className={"max-w-fit"}
      icon={<GlobeIcon size={16} />}
      title={
        <>
          {t(
            "agent-network.agent-overview-panel:endpointBadge.text.aPIBaseURL",
          )}
          <HelpTooltip iconSize={11} content={ENDPOINT_HELP_TEXT} />
        </>
      }
      trailing={
        <button
          type={"button"}
          className={
            "inline-flex items-center gap-1.5 rounded-md border border-nb-gray-700 bg-nb-gray-800/60 px-2.5 py-1.5 text-[11px] font-medium text-nb-gray-200 hover:bg-nb-gray-800 hover:text-white transition-colors shrink-0"
          }
          onClick={() =>
            copy(
              t(
                "agent-network.agent-overview-panel:endpointBadge.text.endpointCopiedToClipboard",
              ),
            )
          }
          aria-label={t(
            "agent-network.agent-overview-panel:endpointBadge.ariaLabel.copyEndpoint",
          )}
        >
          {copied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
          {t("agent-network.agent-overview-panel:endpointBadge.text.copy")}
        </button>
      }
      description={
        <code className={"font-mono !text-nb-gray-100 whitespace-nowrap"}>
          https://{endpoint}
        </code>
      }
    />
  );
}
