import React from "react";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { TabsContent } from "@components/Tabs";
import { GlobeIcon } from "lucide-react";
import { AuthenticationSettings } from "@/cloud/webhooks/WebhookAuthenticationSettings";
import { WebhookConfig } from "@/cloud/webhooks/useWebhookConfig";

import { t } from "@/i18n";
type Props = {
  value: WebhookConfig;
  urlHelpText?: string;
  mask?: boolean;
};

export function WebhookGeneralTabContent({
  value,
  urlHelpText = t(
    "cloud.webhooks:webhookGeneralTabContent.text.fullHTTPSURLWhere",
  ),
  mask,
}: Readonly<Props>) {
  return (
    <TabsContent value={"general"} className={"px-8 text-sm"}>
      <div className={"mb-6"}>
        <Label>
          {value.isEditing
            ? t("cloud.webhooks:webhookGeneralTabContent.text.endpointURL")
            : t(
                "cloud.webhooks:webhookGeneralTabContent.text.enterYourEndpointURL",
              )}
        </Label>
        <HelpText>{urlHelpText}</HelpText>
        <Input
          customPrefix={<GlobeIcon size={16} />}
          placeholder={t(
            "cloud.webhooks:webhookGeneralTabContent.placeholder.httpsApiExampleComWebhook",
          )}
          maxWidthClass="w-full"
          value={value.url}
          error={value.urlError}
          onChange={(e) => value.setUrl(e.target.value)}
          data-testid="webhook-url-input"
        />
      </div>

      <Label>
        {t("cloud.webhooks:webhookGeneralTabContent.text.authentication")}
      </Label>
      <HelpText>
        {t(
          "cloud.webhooks:webhookGeneralTabContent.text.selectYourPreferredAuthenticationMethod",
        )}
      </HelpText>
      <AuthenticationSettings value={value} mask={mask} />
    </TabsContent>
  );
}
