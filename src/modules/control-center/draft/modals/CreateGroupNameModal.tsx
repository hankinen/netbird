import React, { useEffect, useMemo, useState } from "react";
import Button from "@components/Button";
import { Input } from "@components/Input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { trim } from "lodash";
import { Group } from "@/interfaces/Group";

import { t } from "@/i18n";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (name: string) => void;
  groups: Group[] | undefined;
};

export const CreateGroupNameModal = ({
  open,
  onOpenChange,
  onSuccess,
  groups,
}: Props) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const isDisabled = useMemo(() => {
    if (error !== "") return true;
    return trim(name).length === 0;
  }, [name, error]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const trimmed = trim(newName);
    // "All" is the system group; name-based checks would misidentify a copy.
    if (trimmed === "All") {
      setError(
        t(
          "control-center.draft.draft-mode-switcher:createGroupNameModal.text.theNameAllIsReserved",
        ),
      );
    } else {
      const exists = groups?.some((g) => g.name === trimmed);
      setError(
        exists
          ? t(
              "control-center.draft.draft-mode-switcher:createGroupNameModal.text.thisGroupAlreadyExistsPlease",
            )
          : "",
      );
    }
    setName(newName);
  };

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"max-w-md"}>
        <ModalHeader
          title={t(
            "control-center.draft.draft-mode-switcher:createGroupNameModal.title.createGroup",
          )}
          description={t(
            "control-center.draft.draft-mode-switcher:createGroupNameModal.description.setAnEasilyIdentifiableName",
          )}
          color={"blue"}
        />
        <div className={"p-default flex flex-col gap-4"}>
          <Input
            placeholder={t(
              "control-center.draft.draft-mode-switcher:createGroupNameModal.placeholder.eGDevelopers",
            )}
            value={name}
            onChange={handleNameChange}
            error={error}
            autoFocus
          />
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
              onClick={() => onSuccess(trim(name))}
              disabled={isDisabled}
              type={"submit"}
            >
              {t("common:word.save")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
