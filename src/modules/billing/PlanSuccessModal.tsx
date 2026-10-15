import Button from "@components/Button";
import { Modal, ModalClose, ModalContent } from "@components/modal/Modal";
import Paragraph from "@components/Paragraph";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { cn } from "@utils/helpers";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useState } from "react";
import { t } from "@/i18n";
export const PlanSuccessModal = () => {
  const params = useSearchParams();
  const subscriptionSuccess = params.get("success");
  const [successModal, setSuccessModal] = useState(
    subscriptionSuccess === "true",
  );
  return (
    <Modal open={successModal} onOpenChange={setSuccessModal}>
      <ModalContent maxWidthClass={"max-w-sm relative"} showClose={false}>
        <GradientFadedBackground />

        <div
          className={
            "mx-auto text-center flex flex-col items-center justify-center "
          }
        >
          <h2 className={"text-xl my-0 leading-[1.5] mb-2"}>
            {t("billing.main:planSuccessModal.text.thankYouForSubscribing")}{" "}
            <br />
            {t("billing.main:planSuccessModal.text.toNetBird")}
          </h2>
          <Paragraph className={cn("text-sm text-center max-w-xs")}>
            {t(
              "billing.main:planSuccessModal.text.yourSubscriptionHasBeenSuccessfully",
            )}
          </Paragraph>
          <ModalClose asChild={true}>
            <Button variant={"primary"} className={"w-full mt-4"} size={"xs"}>
              {t("common:word.close")}
            </Button>
          </ModalClose>
        </div>
      </ModalContent>
    </Modal>
  );
};
