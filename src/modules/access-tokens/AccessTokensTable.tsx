import Card from "@components/Card";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import NoResults from "@components/ui/NoResults";
import { IconApi } from "@tabler/icons-react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import useFetchApi from "@utils/api";
import dayjs from "dayjs";
import { usePathname } from "next/navigation";
import React from "react";
import UserProvider from "@/contexts/UserProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { t } from "@/i18n";
import { AccessToken } from "@/interfaces/AccessToken";
import { User } from "@/interfaces/User";
import AccessTokenActionCell from "@/modules/access-tokens/AccessTokenActionCell";
import EmptyRow from "@/modules/common-table-rows/EmptyRow";
import ExpirationDateRow from "@/modules/common-table-rows/ExpirationDateRow";
import LastTimeRow from "@/modules/common-table-rows/LastTimeRow";
import SetupKeyNameCell from "@/modules/setup-keys/SetupKeyNameCell";
type Props = {
  user: User;
};

export const AccessTokensTableColumns: ColumnDef<AccessToken>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("common:word.name")}
        </DataTableHeader>
      );
    },
    sortingFn: "text",
    cell: ({ row }) => {
      const isValid = dayjs(row.original.expiration_date).isAfter(dayjs());
      return <SetupKeyNameCell name={row.original.name} valid={isValid} />;
    },
  },
  {
    accessorKey: "expiration_date",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("access-tokens.main:accessTokensTable.text.expires")}
        </DataTableHeader>
      );
    },
    cell: ({ row }) => (
      <ExpirationDateRow date={row.original.expiration_date} />
    ),
  },
  {
    accessorKey: "last_used",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("access-tokens.main:accessTokensTable.text.lastUsed")}
        </DataTableHeader>
      );
    },
    sortingFn: "datetime",
    cell: ({ row }) => {
      return typeof row.original.last_used === "undefined" ? (
        <EmptyRow />
      ) : (
        <LastTimeRow
          date={row.original.last_used}
          text={t("access-tokens.main:accessTokensTable.text.lastUsedOn")}
        />
      );
    },
  },
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) => <AccessTokenActionCell access_token={row.original} />,
  },
];

export default function AccessTokensTable({ user }: Readonly<Props>) {
  const { data: tokens } = useFetchApi<AccessToken[]>(
    `/users/${user.id}/tokens`,
    true,
  );

  const path = usePathname();

  // Default sorting state of the table
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [
      {
        id: "name",
        desc: true,
      },
    ],
  );

  return (
    <UserProvider user={user}>
      <Card className={"mt-5 w-full"}>
        {tokens && tokens.length > 0 ? (
          <DataTable
            text={t("access-tokens.main:accessTokensTable.text.accessTokens")}
            tableClassName={"mt-0"}
            minimal={true}
            showSearchAndFilters={false}
            inset={false}
            sorting={sorting}
            setSorting={setSorting}
            columns={AccessTokensTableColumns}
            data={tokens}
          />
        ) : (
          <div className={"bg-nb-gray-950 overflow-hidden"}>
            <NoResults
              className={"py-3"}
              title={t(
                "access-tokens.main:accessTokensTable.title.noAccessTokens",
              )}
              description={t(
                "access-tokens.main:accessTokensTable.description.youDonTHaveAny",
              )}
              icon={<IconApi size={20} className={"text-nb-gray-300"} />}
            />
          </div>
        )}
      </Card>
    </UserProvider>
  );
}
