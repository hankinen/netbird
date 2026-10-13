import FullTooltip from "@components/FullTooltip";
import InlineLink from "@components/InlineLink";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
type Props = {
  children: React.ReactNode;
  hoverButton?: boolean;
};
export const ExitNodeHelpTooltip = ({
  children,
  hoverButton = false,
}: Props) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <FullTooltip
        hoverButton={hoverButton}
        content={
          <div className={"text-xs max-w-xs"}>
            {t("exit-node.main:exitNodeHelpTooltip.text.anExitNodeIsA")}
            <div className={"mt-2"}>
              {t("common:word.learnMoreAbout")}{" "}
              <InlineLink
                href={
                  "https://docs.netbird.io/how-to/configuring-default-routes-for-internet-traffic"
                }
                target={"_blank"}
                className={"mr-1"}
              >
                {t("exit-node.main:exitNodeHelpTooltip.text.exitNodes")}
                <ExternalLinkIcon size={10} />
              </InlineLink>
              {t("exit-node.main:exitNodeHelpTooltip.text.inOurDocumentation")}
            </div>
          </div>
        }
      >
        {children}
      </FullTooltip>
    </div>
  );
};
