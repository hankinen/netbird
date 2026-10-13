import Button from "@components/Button";
import Code from "@components/Code";
import InlineLink from "@components/InlineLink";
import { Modal, ModalContent } from "@components/modal/Modal";
import Steps from "@components/Steps";
import { cn } from "@utils/helpers";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { useMemo, useState } from "react";
import { t } from "@/i18n";
import { NetworkResource } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import { SetupModalContent } from "@/modules/setup-netbird-modal/SetupModal";
type Props = {
  resource?: NetworkResource;
  device?: Peer;
  onNext?: () => void;
  onTroubleshootingClick?: () => void;
};

export const OnboardingTestResource = ({
  resource,
  device,
  onNext,
  onTroubleshootingClick,
}: Props) => {
  const [open, setOpen] = useState(false);

  const isSubnet = resource?.type === "subnet";
  const isWildCard = resource?.address.includes("*");
  const isHost = resource?.type === "host";

  const pingAddress = useMemo(() => {
    let a = resource?.address || "";
    if (isHost) {
      if (a.endsWith("/32")) a = a.slice(0, -3);
      else if (a.endsWith("/128")) a = a.slice(0, -4);
    }
    if (isWildCard) return `(any subdomain of ${a})`;
    return isSubnet ? `(resource ip in your subnet)` : a;
  }, [isWildCard, isHost, isSubnet, resource?.address]);

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center max-w-sm mx-auto"}>
          {t(
            "onboarding.networks:onboardingTestResource.text.letSPutThatConnection",
          )}
        </h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t(
            "onboarding.networks:onboardingTestResource.text.niceWorkConnectingYourClient",
          )}
        </div>
      </div>

      <Steps className={"stepper-bg-variant"}>
        <Steps.Step step={1}>
          <p className={"!text-nb-gray-300"}>
            {t(
              "onboarding.networks:onboardingTestResource.text.openYourCommandLineAnd",
            )}{" "}
            <span className={cn(device && "text-white")}>
              {device?.name ||
                t("onboarding.networks:onboardingTestResource.text.yourDevice")}
            </span>{" "}
            {t(
              "onboarding.networks:onboardingTestResource.text.toPingYourResource",
            )}
          </p>
          <Code showCopyIcon={!isSubnet && !isWildCard}>
            ping {pingAddress}
          </Code>
        </Steps.Step>
        <Steps.Step step={2} line={false} className={"pb-0"} disabled={!device}>
          <p className={"!text-nb-gray-300"}>
            {t(
              "onboarding.networks:onboardingTestResource.text.everythingWorkingGreatYouCan",
            )}{" "}
            <InlineLink
              href={"https://docs.netbird.io/how-to/troubleshooting-client"}
              target={"_blank"}
              onClick={onTroubleshootingClick}
            >
              {t(
                "onboarding.networks:onboardingTestResource.text.troubleshootingGuide",
              )}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </p>
          <div className={"mt-2"}>
            <Button
              variant={"secondaryLighter"}
              onClick={onNext}
              className={"w-full"}
            >
              {t(
                "onboarding.networks:onboardingTestResource.text.itWorksContinue",
              )}
            </Button>
          </div>
        </Steps.Step>
      </Steps>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <SetupModalContent title={t("common:word.installNetBird")} />
        </ModalContent>
      </Modal>
    </div>
  );
};
