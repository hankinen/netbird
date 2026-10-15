import CopyToClipboardText from "@components/CopyToClipboardText";
import React from "react";
import { t } from "@/i18n";
import { NetworkResource } from "@/interfaces/Network";
type Props = {
  resource: NetworkResource;
};
export default function ResourceAddressCell({ resource }: Readonly<Props>) {
  return (
    <CopyToClipboardText
      message={t("networks.resources:resourceAddressCell.message.copied", {
        address: resource.address,
      })}
    >
      <div
        className={
          "font-mono dark:text-nb-gray-300 pt-1 flex gap-2 items-center text-[.82rem]"
        }
      >
        {resource.address}
      </div>
    </CopyToClipboardText>
  );
}
