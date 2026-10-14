import FancyToggleSwitch from "@components/FancyToggleSwitch";
import InlineLink from "@components/InlineLink";
import { ExternalLinkIcon, GaugeIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
};
export const CrowdStrikeZtaToggle = ({ value, onChange }: Props) => {
  return (
    <FancyToggleSwitch
      value={value}
      onChange={onChange}
      label={
        <>
          <GaugeIcon size={15} />
          {t(
            "integrations.edr:crowdStrikeZtaToggle.text.useZeroTrustAssessmentScore",
          )}
        </>
      }
      helpText={
        <div>
          {t("integrations.edr:crowdStrikeZtaToggle.text.the")}{" "}
          <InlineLink
            href={
              "https://www.crowdstrike.com/resources/white-papers/falcon-zero-trust-risk-score/"
            }
            target={"_blank"}
          >
            {t("integrations.edr:crowdStrikeZtaToggle.text.zTAScore")}
            <ExternalLinkIcon
              size={12}
              className={"shrink-0 relative -top-[1px] mr-[1px]"}
            />
          </InlineLink>{" "}
          {t(
            "integrations.edr:crowdStrikeZtaToggle.text.isAParameterThatAllows",
          )}
        </div>
      }
    />
  );
};
