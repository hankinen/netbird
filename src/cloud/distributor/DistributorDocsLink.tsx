import InlineLink from "@components/InlineLink";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
export const DistributorDocsLink = () => {
  return (
    <>
      {t("common:word.learnMoreAbout")}
      <InlineLink
        href={"https://docs.netbird.io/manage/for-partners/distributor-portal"}
        target={"_blank"}
      >
        {t("common:word.customers")}
        <ExternalLinkIcon size={12} />
      </InlineLink>
    </>
  );
};
