import Button from "@components/Button";
import { Callout } from "@components/Callout";
import { Checkbox } from "@components/Checkbox";
import HelpText from "@components/HelpText";
import { Label } from "@components/Label";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import Separator from "@components/Separator";
import { LockIcon } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { t } from "@/i18n";
import {
  CertificateInfo,
  CertificatePromptInfo,
} from "./useRDPCertificateHandler";
type Props = {
  open: boolean;
  certificateInfo: CertificatePromptInfo | null;
  onAccept: (remember: boolean) => void;
  onReject: () => void;
};

export const RDPCertificateModal = ({
  open,
  certificateInfo,
  onAccept,
  onReject,
}: Props) => {
  const [rememberCertificate, setRememberCertificate] = useState(false);
  if (!certificateInfo) return null;
  const { hostname, certificate, isChange } = certificateInfo;

  return (
    <Modal open={open} onOpenChange={undefined}>
      <ModalContent maxWidthClass={"max-w-2xl"} showClose={false}>
        <ModalHeader
          icon={<LockIcon className={"text-netbird"} size={18} />}
          title={t(
            "remote-access.rdp:rDPCertificateModal.title.rDPCertificate",
          )}
          description={hostname}
          color={"netbird"}
        />
        <Separator />

        <div className={"px-8 py-6 flex flex-col gap-6"}>
          {isChange && (
            <Callout variant={"warning"}>
              {t(
                "remote-access.rdp:rDPCertificateModal.text.warningCertificateHasChangedOnly",
              )}
            </Callout>
          )}

          <div>
            <Label>
              {t(
                "remote-access.rdp:rDPCertificateModal.text.certificateDetails",
              )}
            </Label>
            <HelpText>
              {t(
                "remote-access.rdp:rDPCertificateModal.text.certificatedCouldNotBeVerified",
              )}
            </HelpText>
            <CertificateDetailsList certificate={certificate} />
          </div>

          <label className={"flex items-center space-x-3 cursor-pointer"}>
            <Checkbox
              id="remember-cert"
              checked={rememberCertificate}
              variant={"tableCell"}
              onCheckedChange={(checked) =>
                setRememberCertificate(checked === true)
              }
            />
            <div className={"font-normal text-sm text-nb-gray-200"}>
              {t("remote-access.rdp:rDPCertificateModal.text.alwaysTrust")}{" "}
              <span className={"text-white font-medium"}>
                {'"' + certificate?.issuer?.replace("CN=", "") + '"'}
              </span>{" "}
              {t("remote-access.rdp:rDPCertificateModal.text.whenConnectingTo")}{" "}
              <span className={"text-white font-medium"}>
                {'"' + hostname + '"'}
              </span>
            </div>
          </label>
        </div>

        <ModalFooter className={"items-center"}>
          <div className={"flex gap-3 w-full justify-end"}>
            <Button variant={"secondary"} onClick={onReject}>
              {t("common:word.cancel")}
            </Button>
            <Button
              variant={"primary"}
              onClick={() => onAccept(rememberCertificate)}
            >
              {t("remote-access.rdp:rDPCertificateModal.text.acceptContinue")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const CertificateDetailsList = ({
  certificate,
}: {
  certificate: CertificateInfo;
}) => {
  if (!certificate) return null;

  return (
    <div
      className={
        "bg-nb-gray-930 border border-nb-gray-900 rounded-md mt-3 flex flex-col py-3 px-4 gap-2"
      }
    >
      <CertificateDetailsListItem
        label={t("remote-access.rdp:rDPCertificateModal.label.issuer")}
        value={certificate.issuer || "N/A"}
      />
      <CertificateDetailsListItem
        label={t("remote-access.rdp:rDPCertificateModal.label.subject")}
        value={certificate.subject || "N/A"}
      />
      <CertificateDetailsListItem
        label={t("remote-access.rdp:rDPCertificateModal.label.validFrom")}
        value={
          certificate.validFrom
            ? new Date(certificate.validFrom).toLocaleString()
            : "N/A"
        }
      />
      <CertificateDetailsListItem
        label={t("remote-access.rdp:rDPCertificateModal.label.validTo")}
        value={
          certificate.validTo
            ? new Date(certificate.validTo).toLocaleString()
            : "N/A"
        }
      />
      <CertificateDetailsListItem
        label={t("remote-access.rdp:rDPCertificateModal.label.keySize")}
        value={certificate.keySize ? `${certificate.keySize} bits` : "N/A"}
      />
      <CertificateDetailsListItem
        label={t("remote-access.rdp:rDPCertificateModal.label.serialNumber")}
        value={certificate.serialNumber || "N/A"}
      />
      <CertificateDetailsListItem
        label={t("remote-access.rdp:rDPCertificateModal.label.fingerprint")}
        value={certificate.fingerprint || "N/A"}
      />
    </div>
  );
};

const CertificateDetailsListItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div key={label} className={"flex justify-between text-xs gap-10"}>
      <span className={"font-mono text-nb-gray-200 w-[200px]"}>{label}:</span>
      <span className={"font-mono text-nb-gray-300 break-all text-left w-full"}>
        {value}
      </span>
    </div>
  );
};
