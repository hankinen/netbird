import Button from "@components/Button";
import { Modal, ModalContent } from "@components/modal/Modal";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import * as React from "react";
import { t } from "@/i18n";
type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: () => void;
  onCancel: () => void;
};

export const AccountMFAInfoModal = ({
  open,
  setOpen,
  onCancel,
  onConfirm,
}: Props) => {
  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent showClose={false} maxWidthClass={"max-w-[380px]"}>
        <GradientFadedBackground />
        <div className={"flex items-center justify-center flex-col gap-3 px-6"}>
          <div className={"text-xl font-medium text-center"}>
            {t("cloud.mfa:accountMFAInfoModal.text.youMayNotNeedNetBird")}
          </div>
          <div className={"text-sm text-nb-gray-300 text-center mb-2"}>
            {t("cloud.mfa:accountMFAInfoModal.text.your")}
            <strong className={"text-nb-gray-200 font-medium"}>
              {" "}
              {t("cloud.mfa:accountMFAInfoModal.text.sSOProvider")}
            </strong>
            {t("cloud.mfa:accountMFAInfoModal.text.mayAlreadyHaveMFA")}
          </div>
          <div className={"flex gap-4 w-full"}>
            <Button
              className={"w-full"}
              variant={"secondary"}
              onClick={onCancel}
            >
              {t("common:word.cancel")}
            </Button>
            <Button
              className={"w-full"}
              variant={"primary"}
              onClick={onConfirm}
            >
              {t("cloud.mfa:accountMFAInfoModal.text.enableMFA")}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
