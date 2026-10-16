import Button from "@components/Button";
import { Input } from "@components/Input";
import { Modal, ModalClose, ModalContent } from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import React, { useState } from "react";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";

import { t } from "@/i18n";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPassword: string;
  isEnabled: boolean;
  onSave: (password: string) => void;
  onRemove: () => void;
};

export default function AuthPasswordModal({
  open,
  onOpenChange,
  currentPassword,
  isEnabled,
  onSave,
  onRemove,
}: Readonly<Props>) {
  const [password, setPassword] = useState(currentPassword);
  const [isMasked, setIsMasked] = useState(isEnabled && currentPassword === "");
  const isEditing = isEnabled;

  const handleSave = () => {
    if (password.trim()) {
      onOpenChange(false);
      onSave(password);
    }
  };

  const handleRemove = () => {
    onOpenChange(false);
    setPassword("");
    onRemove();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass="max-w-md">
        <ModalHeader
          title={t("common:word.password")}
          description={t("reverse-proxy.auth:authPasswordModal.description.requireAPasswordToAccess")}
        />

        <GradientFadedBackground />

        <div className="px-8">
          <Input
            type="password"
            value={isMasked ? "**********" : password}
            name={"service-password"}
            data-testid={"password-input"}
            showPasswordToggle={!isMasked}
            onChange={(e) => {
              if (isMasked) {
                setIsMasked(false);
                setPassword(e.target.value.replace(/\*/g, ""));
              } else {
                setPassword(e.target.value);
              }
            }}
            placeholder={t("reverse-proxy.auth:authPasswordModal.placeholder.enterPassword")}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            onKeyDown={(e) => {
              if (e.key === "Enter" && password.trim()) {
                handleSave();
              }
            }}
          />
          <div className="flex gap-3 w-full justify-between mt-6">
            {isEditing ? (
              <>
                <Button variant="danger-text" data-testid="remove-password" onClick={handleRemove}>
                  {t("common:word.remove")}
                </Button>
                <div className="flex gap-3">
                  <ModalClose asChild>
                    <Button variant="secondary">{t("common:word.cancel")}</Button>
                  </ModalClose>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!password.trim()}
                  >
                    {t("common:word.save")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div />
                <div className="flex gap-3">
                  <ModalClose asChild>
                    <Button variant="secondary">{t("common:word.cancel")}</Button>
                  </ModalClose>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!password.trim()}
                    data-testid="submit-password"
                  >
                    {t("reverse-proxy.auth:authPasswordModal.text.addPassword")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
