import React, { useMemo, useState } from "react";
import Button from "@components/Button";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { Tabs, TabsList, TabsTrigger } from "@components/Tabs";
import {
  ExternalLinkIcon,
  FileCode2Icon,
  GlobeIcon,
  Repeat,
  TextIcon,
} from "lucide-react";
import {
  NOTIFICATION_CHANNELS_WEBHOOK_DOCS_LINK,
  NotificationChannel,
  NotificationWebhookChannel as WebhookTarget,
} from "@/interfaces/NotificationChannel";
import Paragraph from "@components/Paragraph";
import InlineLink from "@components/InlineLink";
import { useWebhookConfig } from "@/cloud/webhooks/useWebhookConfig";
import { WebhookGeneralTabContent } from "@/cloud/webhooks/WebhookGeneralTabContent";
import { WebhookHeadersTabContent } from "@/cloud/webhooks/WebhookHeadersTabContent";

import { t } from "@/i18n";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: NotificationChannel;
  onSave: (target: WebhookTarget) => void;
};

export default function NotificationWebhookModal({
  open,
  onOpenChange,
  channel,
  onSave,
}: Readonly<Props>) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
      {open && (
        <NotificationWebhookModalContent
          channel={channel}
          onSave={(target) => {
            onSave(target);
            onOpenChange(false);
          }}
        />
      )}
    </Modal>
  );
}

type ModalContentProps = {
  channel: NotificationChannel;
  onSave: (target: WebhookTarget) => void;
};

function NotificationWebhookModalContent({
  channel,
  onSave,
}: Readonly<ModalContentProps>) {
  const target = channel.target as WebhookTarget | undefined;

  const config = useWebhookConfig({
    initialUrl: target?.url,
    initialHeaders: target?.headers,
  });

  const [tab, setTab] = useState("general");
  const modalWidth = useMemo(
    () => (tab === "general" ? "max-w-xl" : "max-w-2xl"),
    [tab],
  );

  const handleSave = () => {
    onSave({
      url: config.url,
      headers: config.formatHeaders(),
    });
  };

  return (
    <ModalContent maxWidthClass={modalWidth}>
      <ModalHeader
        icon={<GlobeIcon size={16} />}
        title={
          config.isEditing
            ? t(
                "cloud.notifications:notificationWebhookModal.text.webhookConfiguration",
              )
            : t(
                "cloud.notifications:notificationWebhookModal.text.connectWebhook",
              )
        }
        description={
          config.isEditing
            ? t(
                "cloud.notifications:notificationWebhookModal.text.updateYourWebhookEndpointAnd",
              )
            : t(
                "cloud.notifications:notificationWebhookModal.text.configureAWebhookEndpointTo",
              )
        }
      />

      <Tabs defaultValue={tab} value={tab} onValueChange={(v) => setTab(v)}>
        <TabsList justify={"start"} className={"px-8"}>
          <TabsTrigger value={"general"} data-testid="webhook-tab-general">
            <TextIcon
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("common:word.general")}
          </TabsTrigger>
          <TabsTrigger
            value={"headers"}
            disabled={!config.canContinueToHeaders}
            data-testid="webhook-tab-headers"
          >
            <FileCode2Icon
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("cloud.notifications:notificationWebhookModal.text.headers")}
          </TabsTrigger>
        </TabsList>

        <WebhookGeneralTabContent
          value={config}
          urlHelpText="Full HTTP(S) URL where notification events will be sent via a POST request."
          mask={config.isEditing}
        />
        <WebhookHeadersTabContent value={config} />
      </Tabs>

      <div className={"h-6"}></div>
      <ModalFooter className={"items-center"}>
        <div className={"w-full"}>
          <Paragraph className={"text-sm mt-auto"}>
            {t("common:word.learnMoreAbout")}
            <InlineLink
              href={NOTIFICATION_CHANNELS_WEBHOOK_DOCS_LINK}
              target={"_blank"}
            >
              {t(
                "cloud.notifications:notificationWebhookChannel.title.webhookNotifications",
              )}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>
        <div className={"flex gap-3 w-full justify-end"}>
          {config.isEditing ? (
            <>
              <ModalClose asChild={true}>
                <Button variant={"secondary"}>{t("common:word.cancel")}</Button>
              </ModalClose>
              <Button
                variant={"primary"}
                onClick={handleSave}
                disabled={!config.canSave}
                data-testid="webhook-save"
              >
                {t("common:word.saveChanges")}
              </Button>
            </>
          ) : (
            <>
              {tab === "general" && (
                <>
                  <ModalClose asChild={true}>
                    <Button variant={"secondary"}>
                      {t("common:word.cancel")}
                    </Button>
                  </ModalClose>
                  <Button
                    variant={"primary"}
                    disabled={!config.canContinueToHeaders}
                    onClick={() => setTab("headers")}
                    data-testid="webhook-continue"
                  >
                    {t("common:word.continue")}
                  </Button>
                </>
              )}
              {tab === "headers" && (
                <>
                  <Button
                    variant={"secondary"}
                    onClick={() => setTab("general")}
                  >
                    {t("common:word.back")}
                  </Button>
                  <Button
                    variant={"primary"}
                    disabled={!config.canSave}
                    onClick={handleSave}
                    data-testid="webhook-save"
                  >
                    <Repeat size={16} />
                    {t("common:word.connect")}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </ModalFooter>
    </ModalContent>
  );
}
