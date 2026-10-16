import dayjs from "dayjs";
import { ReceiptTextIcon } from "lucide-react";
import React from "react";
import { Invoice } from "@/cloud/msp/interfaces/Invoice";
import { t } from "@/i18n";
type Props = {
  invoice: Invoice;
};

export default function InvoicesPeriodCell({ invoice }: Readonly<Props>) {
  const { period_end } = invoice;
  const end =
    period_end &&
    dayjs(period_end).format(
      t("cloud.invoices:invoicesPeriodCell.text.mMMDDYYYY"),
    );

  return (
    <div className={"flex items-center text-sm text-nb-gray-200 gap-2"}>
      <ReceiptTextIcon size={14} />
      {`${end}`}
    </div>
  );
}
