import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Callout } from "@components/Callout";
import React from "react";
import { CustomDomainSelector } from "./CustomDomainSelector";
import { isNetBirdCloud } from "@utils/netbird";
import InlineLink from "@components/InlineLink";

import { t } from "@/i18n";
type Props = {
  subdomain: string;
  onSubdomainChange: (value: string) => void;
  baseDomain: string;
  onBaseDomainChange: (value: string) => void;
  domainAlreadyExists: boolean;
  subdomainRequired?: boolean;
  clusterOffline?: {
    clusterName: string;
  };
};

export default function ReverseProxyDomainInput({
  subdomain,
  onSubdomainChange,
  baseDomain,
  onBaseDomainChange,
  domainAlreadyExists,
  subdomainRequired = false,
  clusterOffline,
}: Readonly<Props>) {
  return (
    <div>
      <Label>{t("common:word.domain")}</Label>
      <HelpText>
        {subdomainRequired
          ? t(
              "reverse-proxy.domain:reverseProxyDomainInput.text.enterASubdomainAndSelect",
            )
          : t(
              "reverse-proxy.domain:reverseProxyDomainInput.text.optionallyEnterASubdomainOr",
            )}
      </HelpText>
      <div className="flex items-start mt-2">
        <div className="flex-1 min-w-0">
          <Input
            autoFocus
            data-testid="proxy-subdomain-input"
            value={subdomain}
            onChange={(e) => {
              onSubdomainChange(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              );
            }}
            error={
              domainAlreadyExists
                ? t(
                    "reverse-proxy.domain:reverseProxyDomainInput.text.thisDomainIsAlreadyUsed",
                  )
                : undefined
            }
            placeholder={
              subdomainRequired
                ? t("reverse-proxy.domain:reverseProxyDomainInput.text.myapp")
                : t(
                    "reverse-proxy.domain:reverseProxyDomainInput.text.myappOptional",
                  )
            }
            className="!rounded-r-none !border-r-0"
          />
        </div>
        <div className="flex-1 min-w-0">
          <CustomDomainSelector
            value={baseDomain}
            onChange={onBaseDomainChange}
            className="!rounded-l-none"
            data-testid="proxy-domain-selector"
          />
        </div>
      </div>

      {clusterOffline &&
        (isNetBirdCloud() ? (
          <Callout variant={"warning"} className={"mt-3"}>
            {t("common:word.cluster")} {clusterOffline.clusterName}{" "}
            {t(
              "reverse-proxy.domain:reverseProxyDomainInput.text.isOfflinePleaseTryAgain",
            )}{" "}
            <InlineLink href={"https://status.netbird.io/"} target={"_blank"}>
              {t("reverse-proxy.domain:customDomainModal.text.netBirdStatus")}
            </InlineLink>{" "}
            {t("reverse-proxy.domain:customDomainModal.text.orReachOutTo")}
            {"  "}
            <InlineLink href={"mailto:support@netbird.io"}>
              {t(
                "reverse-proxy.domain:customDomainModal.text.supportNetbirdIo",
              )}
            </InlineLink>
          </Callout>
        ) : (
          <Callout variant={"error"} className={"mt-3"}>
            {t(
              "reverse-proxy.domain:reverseProxyDomainInput.text.clusterIsOfflineMakeSure",
              { clusterName: clusterOffline.clusterName },
            )}
          </Callout>
        ))}
    </div>
  );
}
