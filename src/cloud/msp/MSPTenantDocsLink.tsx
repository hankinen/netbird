import InlineLink from "@components/InlineLink";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
export const MSPTenantDocsLink = () => {
  return (
    <>
      {t("common:word.learnMoreAbout")}
      <InlineLink
        href={"https://docs.netbird.io/how-to/msp-portal"}
        target={"_blank"}
      >
        {t("cloud.msp:mSPTenantDocsLink.text.mSPPortal")}
        <ExternalLinkIcon size={12} />
      </InlineLink>
    </>
  );
};
