import Button from "@components/Button";
import { Callout } from "@components/Callout";
import { Input } from "@components/Input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { isValidIP } from "@utils/ip";
import { trim } from "lodash";
import React, { useMemo, useState } from "react";
import { t } from "@/i18n";
type IPVersion = "v4" | "v6";

interface PeerEditIPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ip: string) => void;
  currentIP: string;
  version: IPVersion;
}

const config: Record<
  IPVersion,
  {
    title: string;
    description: string;
    placeholder: string;
    errorMessage: string;
    validate: (ip: string) => boolean;
  }
> = {
  v4: {
    get title() {
      return t("peer.main:peerEditIPModal.title.editPeerIPAddress");
    },
    get description() {
      return t(
        "peer.main:peerEditIPModal.description.updateTheNetBirdIPAddress",
      );
    },
    get placeholder() {
      return t("common:placeholder.example", { value: "100.64.0.15" });
    },
    get errorMessage() {
      return t("peer.main:peerEditIPModal.errorMessage.pleaseEnterAValidIP");
    },
    validate: (ip: string) =>
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ip,
      ),
  },
  v6: {
    get title() {
      return t("peer.main:peerEditIPModal.title.editPeerIPv6Address");
    },
    get description() {
      return t(
        "peer.main:peerEditIPModal.description.updateTheNetBirdIPv6Address",
      );
    },
    get placeholder() {
      return t("peer.main:peerEditIPModal.placeholder.eGFd0012341");
    },
    get errorMessage() {
      return t("peer.main:peerEditIPModal.errorMessage.pleaseEnterAValidIPv6");
    },
    validate: (ip: string) => isValidIP(ip) && ip.includes(":"),
  },
};

export function PeerEditIPModal({
  open,
  onOpenChange,
  onSave,
  currentIP,
  version,
}: Readonly<PeerEditIPModalProps>) {
  const { title, description, placeholder, errorMessage, validate } =
    config[version];
  const [ip, setIP] = useState(currentIP);

  const isDisabled = useMemo(() => {
    if (ip === currentIP) return true;
    const trimmed = trim(ip);
    return trimmed.length === 0 || !validate(trimmed);
  }, [ip, currentIP, validate]);

  const error = useMemo(() => {
    if (ip === currentIP) return "";
    if (!validate(trim(ip))) return errorMessage;
    return "";
  }, [ip, currentIP, validate, errorMessage]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"max-w-md"}>
        <form>
          <ModalHeader title={title} description={description} color={"blue"} />

          <div className={"p-default flex flex-col gap-4"}>
            <div>
              <Input
                placeholder={placeholder}
                value={ip}
                onChange={(e) => setIP(e.target.value)}
                error={error}
              />
            </div>

            <Callout>
              {t("peer.main:peerEditIPModal.text.changesTakeEffectWhenThe")}
            </Callout>
          </div>

          <ModalFooter className={"items-center"} separator={false}>
            <div className={"flex gap-3 w-full justify-end"}>
              <ModalClose asChild={true}>
                <Button variant={"secondary"} className={"w-full"}>
                  {t("common:word.cancel")}
                </Button>
              </ModalClose>

              <Button
                variant={"primary"}
                className={"w-full"}
                onClick={() => onSave(trim(ip))}
                disabled={isDisabled}
              >
                {t("common:word.save")}
              </Button>
            </div>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
