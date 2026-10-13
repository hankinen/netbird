import Button from "@components/Button";
import Code from "@components/Code";
import InlineLink from "@components/InlineLink";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import Paragraph from "@components/Paragraph";
import { SegmentedTabs } from "@components/SegmentedTabs";
import Separator from "@components/Separator";
import Steps from "@components/Steps";
import { Lightbox } from "@components/ui/Lightbox";
import { Mark } from "@components/ui/Mark";
import { getOperatingSystem } from "@hooks/useOperatingSystem";
import { cn } from "@utils/helpers";
import { ExternalLinkIcon, PlusCircle, TerminalSquare } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import NetBirdIcon from "@/assets/icons/NetBirdIcon";
import sshImage from "@/assets/ssh/ssh-client.png";
import { t } from "@/i18n";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { Peer } from "@/interfaces/Peer";
import { PeerSSHPolicyModal } from "@/modules/peer/PeerSSHPolicyModal";
type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  peer?: Peer;
};

export const PeerSSHInstructions = ({
  open,
  onOpenChange,
  onSuccess,
  peer,
}: Props) => {
  const [client, setClient] = useState("cli");
  const [policyModal, setPolicyModal] = useState(false);

  // Enabling the SSH server and root login require root, or an administrator on
  // Windows, since they decide who may obtain a shell on that machine.
  const isWindows =
    !!peer?.os && getOperatingSystem(peer.os) === OperatingSystem.WINDOWS;
  const prefix = isWindows ? "" : "sudo ";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        maxWidthClass={cn("relative", "max-w-2xl")}
        showClose={true}
      >
        <ModalHeader
          icon={<TerminalSquare size={16} className={"text-netbird"} />}
          title={t("peer.main:peerSSHInstructions.title.enableSSHAccess")}
          description={t(
            "peer.main:peerSSHInstructions.description.allowRemoteSSHAccessFrom",
          )}
          color={"netbird"}
        />

        <Separator />

        <div className={"px-8 py-3 flex flex-col gap-0 z-0 mt-1"}>
          <SegmentedTabs value={client} onChange={setClient}>
            <SegmentedTabs.List className={"rounded-lg border"}>
              <SegmentedTabs.Trigger value={"cli"}>
                <TerminalSquare size={16} />
                CLI
              </SegmentedTabs.Trigger>
              <SegmentedTabs.Trigger value={"gui"}>
                <NetBirdIcon size={16} />
                {t("peer.main:peerSSHInstructions.text.desktopClient")}
              </SegmentedTabs.Trigger>
            </SegmentedTabs.List>
          </SegmentedTabs>

          <Steps>
            {client === "cli" ? (
              <Steps.Step step={1}>
                <p className={"font-normal"}>
                  {t("peer.main:peerSSHInstructions.text.ifYouAreUsingNetBird")}{" "}
                  {isWindows
                    ? t(
                        "peer.main:peerSSHInstructions.text.theseCommandsInAnElevated",
                      )
                    : t(
                        "peer.main:peerSSHInstructions.text.theseCommandsAsRoot",
                      )}
                  {t("peer.main:peerSSHInstructions.text.runTheFirstOneOnly")}
                </p>
                <Code codeToCopy={`${prefix}netbird down`}>
                  <Code.Line>{`${prefix}netbird down`}</Code.Line>
                </Code>
                <Code>
                  <Code.Line>{`${prefix}netbird up --allow-server-ssh --enable-ssh-root`}</Code.Line>
                </Code>
              </Steps.Step>
            ) : (
              <Steps.Step step={1}>
                <p className={"font-normal"}>
                  {t(
                    "peer.main:peerSSHInstructions.text.ifYouAreUsingNetBird2",
                  )}{" "}
                  <Mark>{t("common:word.settings")}</Mark>{" "}
                  {t("peer.main:peerSSHInstructions.text.andClick")}{" "}
                  <Mark>
                    {t("peer.main:peerSSHInstructions.text.allowSSH")}
                  </Mark>
                  {t("peer.main:peerSSHInstructions.text.ifYouWantToEnable")}{" "}
                  <Mark>
                    {t(
                      "peer.main:peerSSHInstructions.text.settingsGtAdvancedSettings",
                    )}
                  </Mark>{" "}
                  {t(
                    "peer.main:peerSSHInstructions.text.andEnableSSHRootLogin",
                  )}
                </p>
                <Lightbox image={sshImage} />
              </Steps.Step>
            )}

            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "peer.main:peerSSHInstructions.text.startingFromNetBirdV061",
                )}
              </p>
              <div className={"mt-2"}>
                <Button
                  variant={"secondary"}
                  onClick={() => setPolicyModal(true)}
                >
                  <PlusCircle size={16} />
                  {t("peer.main:peerSSHInstructions.text.createSSHPolicy")}
                </Button>
              </div>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t(
                  "peer.main:peerSSHInstructions.text.onceTheNetBirdSSHServer",
                )}{" "}
                <br />
                {t("peer.main:peerSSHInstructions.text.click")}{" "}
                <Mark>
                  {t("peer.main:peerSSHInstructions.text.confirmEnable")}
                </Mark>{" "}
                {t("peer.main:peerSSHInstructions.text.belowToFinishTheSetup")}
              </p>
            </Steps.Step>
          </Steps>
        </div>

        <ModalFooter className={"items-center"}>
          <div className={"w-full"}>
            <Paragraph className={"text-sm mt-auto"}>
              {t("common:word.learnMoreAbout")}
              <InlineLink
                href={"https://docs.netbird.io/how-to/ssh"}
                target={"_blank"}
              >
                SSH
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </Paragraph>
          </div>
          <div className={"flex gap-3 w-full justify-end"}>
            <ModalClose asChild={true}>
              <Button variant={"secondary"}>{t("common:word.cancel")}</Button>
            </ModalClose>

            <Button variant={"primary"} onClick={onSuccess}>
              {t("peer.main:peerSSHInstructions.text.finishSetup")}
            </Button>
          </div>
        </ModalFooter>

        <PeerSSHPolicyModal
          open={policyModal}
          onOpenChange={setPolicyModal}
          peer={peer}
        />
      </ModalContent>
    </Modal>
  );
};
