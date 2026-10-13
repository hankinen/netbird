import Button from "@components/Button";
import { Modal, ModalTrigger } from "@components/modal/Modal";
import { DownloadIcon } from "lucide-react";
import React, { useState } from "react";
import { t } from "@/i18n";
import SetupModal from "@/modules/setup-netbird-modal/SetupModal";
export function InstallNetBirdButton() {
  const [installModal, setInstallModal] = useState(false);

  return (
    <Modal open={installModal} onOpenChange={setInstallModal}>
      <ModalTrigger asChild>
        <Button variant={"secondary"} size={"sm"}>
          <DownloadIcon size={16} />
          {t("components.ui:installNetBirdButton.text.installNetBird")}
        </Button>
      </ModalTrigger>
      <SetupModal />
    </Modal>
  );
}
