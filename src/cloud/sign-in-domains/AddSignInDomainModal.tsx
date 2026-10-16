import Button from "@components/Button";
import { Input } from "@components/Input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import { validator } from "@utils/helpers";
import { PlusCircle } from "lucide-react";
import * as React from "react";
import { useMemo, useState } from "react";
import { useSignInDomains } from "@/cloud/sign-in-domains/useSignInDomains";
import { t } from "@/i18n";
import { DomainValidationStatus, SignInDomain } from "@/interfaces/Account";
import { DomainVerificationModal } from "@/modules/integrations/sso/DomainVerificationModal";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddSignInDomainModal = ({ open, onOpenChange }: Props) => {
  const { addDomain, verifyDomain, mutate } = useSignInDomains();
  const [name, setName] = useState("");
  const [verifyModal, setVerifyModal] = useState(false);
  const [addedDomain, setAddedDomain] = useState<SignInDomain>();

  const validationError = useMemo(() => {
    const domain = name.trim();
    if (domain === "") return "";
    const valid = validator.isValidDomain(domain, {
      allowWildcard: false,
      allowOnlyTld: false,
      preventLeadingAndTrailingDots: true,
    });
    if (!valid)
      return t(
        "cloud.sign-in-domains:addSignInDomainModal.text.pleaseEnterAValidDomain",
      );
    return "";
  }, [name]);

  const setOpen = (next: boolean) => {
    if (!next) setName("");
    onOpenChange(next);
  };

  const submit = () => {
    const domain = name.trim();
    if (!domain || validationError) return;

    setOpen(false);

    notify({
      title: t(
        "cloud.sign-in-domains:addSignInDomainModal.title.signInDomains",
      ),
      description: t(
        "cloud.sign-in-domains:addSignInDomainModal.description.hasBeenAdded",
        { domain },
      ),
      promise: addDomain(domain).then((added) => {
        if (
          added &&
          added.validation_status !== DomainValidationStatus.VERIFIED
        ) {
          setAddedDomain(added);
          setVerifyModal(true);
        }
        mutate().catch(() => {});
        return added;
      }),
      loadingMessage: t(
        "cloud.sign-in-domains:addSignInDomainModal.loadingMessage.addingDomain",
      ),
    });
  };

  return (
    <>
      {addedDomain && (
        <DomainVerificationModal
          open={verifyModal}
          onOpenChange={setVerifyModal}
          domain={addedDomain.name}
          token={addedDomain.validation_token}
          onVerify={() =>
            verifyDomain(addedDomain.id).then((res) => {
              mutate().catch(() => {});
              return res;
            })
          }
        />
      )}

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent maxWidthClass={"max-w-md"}>
          <ModalHeader
            className={"pb-4 px-8"}
            title={t(
              "cloud.sign-in-domains:addSignInDomainModal.title.addSignInDomain",
            )}
            description={t(
              "cloud.sign-in-domains:addSignInDomainModal.description.usersOnThisDomainAre",
            )}
          />

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className={"p-default flex flex-col gap-4"}>
              <div>
                <Input
                  autoFocus
                  data-testid={"add-domain-input"}
                  placeholder={t(
                    "cloud.sign-in-domains:addSignInDomainModal.placeholder.eGCompanyCom",
                  )}
                  value={name}
                  error={validationError}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
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
                  type={"submit"}
                  disabled={!name.trim() || !!validationError}
                  data-testid={"add-domain-submit"}
                >
                  <PlusCircle size={16} />
                  {t("common:word.add")}
                </Button>
              </div>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
