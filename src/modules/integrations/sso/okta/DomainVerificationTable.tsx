import Card from "@components/Card";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import * as React from "react";
import { useState } from "react";
import { t } from "@/i18n";
import { EnterpriseConnectionDomain } from "@/interfaces/IdentityProvider";
import LastTimeRow from "@/modules/common-table-rows/LastTimeRow";
export const DomainTableColumns: ColumnDef<EnterpriseConnectionDomain>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("common:word.domain")}
        </DataTableHeader>
      );
    },
    sortingFn: "text",
  },
  {
    accessorKey: "validation_status",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("common:word.status")}
        </DataTableHeader>
      );
    },
    sortingFn: "text",
  },
  {
    accessorKey: "validation_last_updated",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("integrations.sso:domainVerificationTable.text.lastCheck")}
        </DataTableHeader>
      );
    },
    sortingFn: "text",
    cell: ({ row }) => (
      <LastTimeRow
        date={dayjs(row.original.validation_last_updated).toDate()}
        text={t("integrations.sso:domainVerificationTable.text.lastCheckedOn")}
      />
    ),
  },
];

type Props = {
  domains: EnterpriseConnectionDomain[];
};
export const DomainVerificationTable = ({ domains }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "is_current",
      desc: true,
    },
    {
      id: "name",
      desc: true,
    },
  ]);

  return (
    <Card className={"w-full"}>
      <DataTable
        showHeader={false}
        tableClassName={"w-full mt-0"}
        minimal={true}
        showSearchAndFilters={false}
        text={t("integrations.sso:domainVerificationTable.text.domains")}
        sorting={sorting}
        setSorting={setSorting}
        columns={DomainTableColumns}
        data={domains}
      />
    </Card>
  );
};
