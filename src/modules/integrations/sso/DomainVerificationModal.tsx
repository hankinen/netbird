import Button from "@components/Button";
import Card from "@components/Card";
import InlineLink from "@components/InlineLink";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import Steps from "@components/Steps";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Mark } from "@components/ui/Mark";
import { cn } from "@utils/helpers";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  token: string;
  onVerify: () => Promise<unknown>;
};
export const DomainVerificationModal = ({
  open,
  onOpenChange,
  domain,
  token,
  onVerify,
}: Props) => {
  const startVerification = async () => {
    notify({
      title: t(
        "integrations.sso:domainVerificationModal.title.domainVerification",
      ),
      description: t(
        "integrations.sso:domainVerificationModal.description.verificationForHasStarted",
        { domain },
      ),
      promise: onVerify().then(() => {
        onOpenChange(false);
      }),
      loadingMessage: t(
        "integrations.sso:domainVerificationModal.loadingMessage.startingDomainVerification",
      ),
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        maxWidthClass={cn("relative", "max-w-xl")}
        showClose={true}
        className={""}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <GradientFadedBackground />
        <ModalHeader
          icon={<GlobeIcon size={20} />}
          title={t(
            "integrations.sso:domainVerificationModal.title.verifyDomainOwnership",
          )}
          description={domain}
          color={"netbird"}
        />
        <div className={"px-8 flex flex-col gap-0"}>
          <Steps className={"pt-0"}>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t(
                  "integrations.sso:domainVerificationModal.text.signInToYourDomain",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t("common:word.copyThe")} <Mark>TXT record</Mark>{" "}
                {t(
                  "integrations.sso:domainVerificationModal.text.belowAndAddItTo",
                )}{" "}
                <Mark>{domain}</Mark>
              </p>
            </Steps.Step>
          </Steps>
          <Card className={"w-full"}>
            <Card.List>
              <Card.ListItem
                copy
                copyText={t(
                  "integrations.sso:domainVerificationModal.copyText.tXTHost",
                )}
                label={t("integrations.sso:domainVerificationModal.label.host")}
                value={domain}
              />
              <Card.ListItem
                copy
                copyText={t(
                  "integrations.sso:domainVerificationModal.copyText.tXTValue",
                )}
                label={t("common:word.value")}
                value={`nb-verification=${token}`}
              />
            </Card.List>
          </Card>

          <Paragraph className={"text-sm mt-4"}>
            {t(
              "integrations.sso:domainVerificationModal.text.noteDNSChangesMayTake",
            )}
          </Paragraph>

          <div
            className={
              "bg-nb-gray-900/70 px-4 py-3 rounded-md border border-nb-gray-800/70 my-6 !text-nb-gray-300 text-sm"
            }
          >
            {t("integrations.sso:domainVerificationModal.text.ifYouDoNotHave")}{" "}
            <InlineLink
              href={"mailto:support@netbird.io"}
              className={"inline font-medium"}
            >
              {" "}
              {t(
                "integrations.sso:domainVerificationModal.text.supportNetbirdIo",
              )}
            </InlineLink>
            {t(
              "integrations.sso:domainVerificationModal.text.theEmailShouldBeSent",
            )}
          </div>
        </div>
        <ModalFooter className={"items-center"}>
          <div className={"w-full"}>
            <Paragraph className={"text-sm mt-auto"}>
              {t("common:word.learnMoreAbout")}
              <InlineLink href={"#"} target={"_blank"}>
                {t(
                  "integrations.sso:domainVerificationModal.title.domainVerification",
                )}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </Paragraph>
          </div>
          <div className={"flex gap-3 w-full justify-end"}>
            <ModalClose asChild={true}>
              <Button variant={"secondary"}>
                {t("integrations.sso:domainVerificationModal.text.verifyLater")}
              </Button>
            </ModalClose>

            <Button variant={"primary"} onClick={startVerification}>
              {t(
                "integrations.sso:domainVerificationModal.text.startVerification",
              )}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
