import Breadcrumbs from "@components/Breadcrumbs";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import { SkeletonIntegration } from "@components/skeletons/SkeletonIntegration";
import * as Tabs from "@radix-ui/react-tabs";
import { isNetBirdCloud } from "@utils/netbird";
import { ExternalLinkIcon, FingerprintIcon } from "lucide-react";
import React from "react";
import IntegrationIcon from "@/assets/icons/IntegrationIcon";
import { useAccount } from "@/modules/account/useAccount";
import { LockedFeatureInfoCard } from "@/modules/billing/locked-feature/LockedFeatureInfoCard";
import { LockedFeatureOverlay } from "@/modules/billing/locked-feature/LockedFeatureOverlay";
import { AzureAD } from "@/modules/integrations/idp-sync/azure-ad/AzureAD";
import { EntraSCIM } from "@/modules/integrations/idp-sync/entra-scim/EntraSCIM";
import { GenericSCIM } from "@/modules/integrations/idp-sync/generic-scim/GenericSCIM";
import { GoogleWorkspace } from "@/modules/integrations/idp-sync/google-workspace/GoogleWorkspace";
import { Jumpcloud } from "@/modules/integrations/idp-sync/jumpcloud/Jumpcloud";
import { Okta } from "@/modules/integrations/idp-sync/okta-scim/Okta";
import { useIntegrations } from "@/modules/integrations/idp-sync/useIntegrations";
import { Callout } from "@components/Callout";

import { t } from "@/i18n";
export default function IdentityProviderTab() {
  const account = useAccount();

  useIntegrations();

  return (
    <Tabs.Content value={"identity-provider"}>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/integrations"}
            label={t("common:word.integrations")}
            icon={<IntegrationIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings?tab=identity-provider"}
            label={t(
              "integrations.idp-sync:identityProviderCard.title.identityProviderSync",
            )}
            icon={<FingerprintIcon size={14} />}
            active
          />
        </Breadcrumbs>
        <h1>
          {t(
            "integrations.idp-sync:identityProviderCard.title.identityProviderSync",
          )}
        </h1>
        <Paragraph>
          {t(
            "integrations.idp-sync:identityProviderTab.text.configureYourPreferredIdentityProvider",
          )}
        </Paragraph>
        <Paragraph>
          <InlineLink
            href={"https://docs.netbird.io/how-to/idp-sync"}
            target={"_blank"}
          >
            {t("common:word.learnMore")}
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </Paragraph>

        <LockedFeatureInfoCard
          featureText={t(
            "integrations.idp-sync:identityProviderTab.featureText.identityProviderIdPSync",
          )}
          feature={"IDP_SYNC"}
        />

        <LockedFeatureOverlay feature={"IDP_SYNC"} opacity={100}>
          <div
            className={
              "gap-6 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr"
            }
          >
            {!account ? (
              <>
                <SkeletonIntegration loadingHeight={196} />
                <SkeletonIntegration loadingHeight={196} />
                <SkeletonIntegration loadingHeight={196} />
                <SkeletonIntegration loadingHeight={196} />
              </>
            ) : (
              <>
                <GoogleWorkspace />
                <AzureAD />
                <EntraSCIM />
                <Okta />
                <Jumpcloud />
                <GenericSCIM />
              </>
            )}
          </div>
          {isNetBirdCloud() && (
            <Callout variant={"warning"} className={"max-w-lg mt-6"}>
              {t(
                "integrations.idp-sync:identityProviderTab.text.lookingToEnableACustom",
              )}{" "}
              <br />
              {t(
                "integrations.idp-sync:identityProviderTab.text.pleaseContactUsAt",
              )}{" "}
              <InlineLink
                href={"mailto:support@netbird.io"}
                className={"inline !text-netbird-500 font-medium"}
              >
                {" "}
                {t(
                  "integrations.idp-sync:identityProviderTab.text.supportNetbirdIo",
                )}
              </InlineLink>{" "}
            </Callout>
          )}
        </LockedFeatureOverlay>
      </div>
    </Tabs.Content>
  );
}
