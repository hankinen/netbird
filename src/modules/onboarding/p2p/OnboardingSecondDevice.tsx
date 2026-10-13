import Button from "@components/Button";
import Code from "@components/Code";
import InlineLink from "@components/InlineLink";
import { Modal, ModalContent } from "@components/modal/Modal";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { getInstallUrl } from "@utils/netbird";
import { ArrowUpRightIcon, ShareIcon } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { useDialog } from "@/contexts/DialogProvider";
import { t } from "@/i18n";
import { Peer } from "@/interfaces/Peer";
import { SetupKey } from "@/interfaces/SetupKey";
import { SetupModalContent } from "@/modules/setup-netbird-modal/SetupModal";
type Props = {
  secondDevice?: Peer;
  onFinish?: () => void;
};

export const OnboardingSecondDevice = ({ secondDevice, onFinish }: Props) => {
  const setupKeyRequest = useApiCall<SetupKey>("/setup-keys", true);
  const [setupKey, setSetupKey] = useState<SetupKey>();
  const { confirm } = useDialog();

  const [open, setOpen] = useState(false);
  const isShareSupported = navigator.share !== undefined;

  /**
   * Continue to next step once second device is recognized
   */
  useEffect(() => {
    secondDevice && onFinish?.();
  }, [secondDevice]);

  const openNavigatorShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t("common:word.installNetBird"),
        text: t("onboarding.p2p:onboardingSecondDevice.text.installNetBirdOnAnotherDevice"),
        url: getInstallUrl(),
      });
    }
  };

  const installUsingSetupKey = async () => {
    const choice = await confirm({
      title: t("onboarding.p2p:onboardingSecondDevice.title.createASetupKey"),
      description:
        t("onboarding.p2p:onboardingSecondDevice.description.ifYouContinueAOne"),
      confirmText: t("common:word.continue"),
      cancelText: t("common:word.cancel"),
      type: "default",
    });
    if (!choice) return;

    await setupKeyRequest
      .post({
        name: "Onboarding (Second Device)",
        type: "one-off",
        expires_in: 24 * 60 * 60, // 1 day expiration
        revoked: false,
        auto_groups: [],
        usage_limit: 1,
        ephemeral: false,
        allow_extra_dns_labels: false,
      })
      .then((setupKey) => {
        setOpen(true);
        setSetupKey(setupKey);
      });
  };

  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center max-w-sm mx-auto"}>
          {t("onboarding.p2p:onboardingSecondDevice.text.timeToBringInYour")}
        </h1>
        <div className="text-sm text-nb-gray-300 font-light mt-2 block text-center">
            {t("onboarding.p2p:onboardingSecondDevice.text.eachDeviceAKA")}
        </div>
        <div className="text-sm text-nb-gray-300 font-light mt-2 block text-center">
            {t("onboarding.p2p:onboardingSecondDevice.text.toCompleteTheSetupJust")}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap sm:flex-nowrap md:!flex-wrap gap-3 items-center justify-center",
        )}
      >
        <div>
          <Code
            message={t("onboarding.p2p:onboardingSecondDevice.message.installationLinkSuccessfullyCopied")}
            className={"text-[0.8rem]"}
          >
            {getInstallUrl()}
          </Code>
        </div>
        {isShareSupported && (
          <Button
            variant={"input"}
            onClick={openNavigatorShare}
            className={"h-[42px]"}
          >
            <ShareIcon size={16} />
            <span className={"lg:hidden"}>{t("onboarding.p2p:onboardingSecondDevice.text.shareLink")}</span>
          </Button>
        )}
      </div>
      <div className="text-sm text-nb-gray-300 font-light mt-2 block text-center sm:px-4">
          {t("onboarding.p2p:onboardingSecondDevice.text.useTheHeadlessSetupTo")}{" "}
        <InlineLink onClick={installUsingSetupKey} href={"#"}>
          {t("onboarding.p2p:onboardingSecondDevice.text.installWithASetupKey")}
          <ArrowUpRightIcon size={12} />
        </InlineLink>{" "}
      </div>

      {setupKey && (
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent>
            <SetupModalContent
              title={t("common:word.installNetBird")}
              setupKey={setupKey.key}
            />
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};
