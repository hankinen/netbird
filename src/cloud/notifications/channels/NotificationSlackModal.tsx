import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import Steps from "@components/Steps";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Mark } from "@components/ui/Mark";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { cn, validator } from "@utils/helpers";
import { isEmpty } from "lodash";
import {
  ExternalLinkIcon,
  GlobeIcon,
  PlusCircle,
  Repeat,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import slackImage from "@/assets/integrations/slack.png";
import { t } from "@/i18n";
import { NotificationWebhookChannel as SlackTarget } from "@/interfaces/NotificationChannel";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (target: SlackTarget) => void;
};

export default function NotificationSlackModal({
  open,
  onOpenChange,
  onSave,
}: Readonly<Props>) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
      {open && (
        <SlackModalContent
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
  onSave: (target: SlackTarget) => void;
};

function SlackModalContent({ onSave }: Readonly<ModalContentProps>) {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");

  const urlError = useMemo(() => {
    if (url === "") return "";
    if (!validator.isValidUrl(url)) {
      return t("cloud.notifications:notificationSlackModal.text.pleaseEnterAValidUrl");
    }
    return "";
  }, [url]);

  const canConnect = !isEmpty(url) && urlError === "";

  const handleConnect = () => {
    onSave({ url });
  };

  const maxSteps = 2;

  return (
    <ModalContent
      maxWidthClass={cn("relative", "max-w-xl")}
      showClose={true}
      onEscapeKeyDown={(e) => step > 0 && e.preventDefault()}
      onInteractOutside={(e) => step > 0 && e.preventDefault()}
      onPointerDownOutside={(e) => step > 0 && e.preventDefault()}
    >
      <GradientFadedBackground />

      <div className={"flex gap-2 w-full items-center justify-center mb-4"}>
        {Array.from({ length: maxSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-8 h-1 rounded-full bg-nb-gray-800",
              step >= index + 1 && "bg-netbird",
            )}
          />
        ))}
      </div>

      <IntegrationModalHeader
        image={slackImage}
        title={t("cloud.notifications:notificationSlackModal.title.connectNetBirdWithSlack")}
        description={t("cloud.notifications:notificationSlackModal.description.receiveNetBirdNotificationEventsDirectly")}
      />

      {step === 0 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 mb-3"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <PlusCircle size={18} />
            {t("cloud.notifications:notificationSlackModal.text.createASlackApp")}
          </p>

          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("cloud.notifications:notificationSlackModal.text.open")}{" "}
                <InlineLink
                  href={"https://api.slack.com/apps?new_app=1"}
                  target={"_blank"}
                >
                  {t("cloud.notifications:notificationSlackModal.text.slackAppManagement")}
                  <ExternalLinkIcon size={12} />
                </InlineLink>{" "}
                {t("cloud.notifications:notificationSlackModal.text.click")}{" "}<Mark>Create an app</Mark> <br />
                {t("cloud.notifications:notificationSlackModal.text.andChoose")}{" "}<Mark>From scratch</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t("cloud.notifications:notificationSlackModal.text.setTheAppNameTo")}{" "}
                <Mark copy={true}>NetBird Notifications</Mark>{" "}{t("cloud.notifications:notificationSlackModal.text.andSelectYourWorkspaceAfter")}{" "}<Mark>Create App</Mark>
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step === 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <GlobeIcon size={18} />
            {t("cloud.notifications:notificationSlackModal.text.configureIncomingWebhook")}
          </p>

          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("cloud.notifications:notificationSlackModal.text.inTheAppSettingsGo")}{" "}<Mark>Incoming Webhooks</Mark>{" "}{t("cloud.notifications:notificationSlackModal.text.andToggle")}{" "}<Mark>Activate Incoming Webhooks</Mark>{" "}{t("cloud.notifications:notificationSlackModal.text.to")}{" "}<Mark>On</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("common:word.click")}{" "}<Mark>Add New Webhook</Mark>{" "}{t("cloud.notifications:notificationSlackModal.text.andSelectTheChannelWhere")}{" "}
                <Mark>Allow</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t("cloud.notifications:notificationSlackModal.text.copyTheGenerated")}{" "}<Mark>Webhook URL</Mark>{" "}{t("cloud.notifications:notificationSlackModal.text.andPasteItBelow")}
              </p>
            </Steps.Step>
          </Steps>

          <div className={"mb-4"}>
            <Input
              autoFocus={true}
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"flex items-center gap-2"}>
                  <GlobeIcon size={14} />
                </div>
              }
              placeholder={t("cloud.notifications:notificationSlackModal.placeholder.httpsHooksSlackComServices")}
              value={url}
              error={urlError}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="slack-webhook-url-input"
            />
          </div>
        </div>
      )}

      <ModalFooter className={"items-center gap-4"}>
        {step === 0 && (
          <ModalClose asChild={true}>
            <Button variant={"secondary"} className={"w-full"}>
              {t("common:word.cancel")}
            </Button>
          </ModalClose>
        )}
        {step > 0 && (
          <Button
            variant={"secondary"}
            className={"w-full"}
            onClick={() => setStep(step - 1)}
          >
            <IconArrowLeft size={16} />
            {t("common:word.back")}
          </Button>
        )}
        {step < maxSteps - 1 && (
          <Button
            variant={"primary"}
            className={"w-full"}
            onClick={() => setStep(step + 1)}
            data-testid="slack-continue"
          >
            {t("common:word.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step === maxSteps - 1 && (
          <Button
            variant={"primary"}
            className={"w-full"}
            disabled={!canConnect}
            onClick={handleConnect}
            data-testid="slack-connect"
          >
            <Repeat size={16} />
            {t("common:word.connect")}
          </Button>
        )}
      </ModalFooter>
    </ModalContent>
  );
}
