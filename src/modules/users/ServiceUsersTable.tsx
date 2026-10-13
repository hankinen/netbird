import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import DataTableResetFilterButton from "@components/table/DataTableResetFilterButton";
import {
  CheckboxListPicker,
  CheckboxOption,
  formatCheckboxChip,
} from "@components/table/filters/CheckboxListPicker";
import {
  formatRadioChip,
  RadioOption,
  RadioPicker,
} from "@components/table/filters/RadioPicker";
import {
  TableFilterChips,
  TableFilterDef,
  TableFiltersButton,
} from "@components/table/TableFilters";
import GetStartedTest from "@components/ui/GetStartedTest";
import { IconSettings2 } from "@tabler/icons-react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import useFetchApi from "@utils/api";
import { ExternalLinkIcon, PlusCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { t } from "@/i18n";
import { User } from "@/interfaces/User";
import ServiceUserModal from "@/modules/users/ServiceUserModal";
import ServiceUserNameCell from "@/modules/users/table-cells/ServiceUserNameCell";
import UserActionCell from "@/modules/users/table-cells/UserActionCell";
import UserRoleCell from "@/modules/users/table-cells/UserRoleCell";
import UserStatusCell from "@/modules/users/table-cells/UserStatusCell";
export const ServiceUsersTableColumns: ColumnDef<User>[] = [
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
    cell: ({ row }) => <ServiceUserNameCell user={row.original} />,
  },
  {
    accessorKey: "is_current",
    sortingFn: "basic",
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("users.modals:serviceUsersTable.text.role")}
        </DataTableHeader>
      );
    },
    sortingFn: "text",
    cell: ({ row }) => <UserRoleCell user={row.original} />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("common:word.status")}
        </DataTableHeader>
      );
    },
    sortingFn: "text",
    cell: ({ row }) => <UserStatusCell user={row.original} />,
  },
  {
    id: "role_filter",
    accessorFn: (u) => [u?.role],
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "id",
    header: "",
    sortingFn: "text",
    cell: ({ row }) => (
      <UserActionCell user={row.original} serviceUser={true} />
    ),
  },
];

type Props = {
  users?: User[];
  isLoading?: boolean;
  headingTarget?: HTMLHeadingElement | null;
};

export default function ServiceUsersTable({
  users,
  isLoading,
  headingTarget,
}: Readonly<Props>) {
  useFetchApi("/groups");
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const path = usePathname();
  const { permission } = usePermissions();

  // Default sorting state of the table
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [
      {
        id: "is_current",
        desc: true,
      },
      {
        id: "name",
        desc: true,
      },
    ],
  );

  const statusOptions = useMemo<RadioOption<string | undefined>[]>(
    () => [
      {
        value: undefined,
        label: t("common:word.all"),
        dotClass: "bg-nb-gray-500",
      },
      {
        value: "active",
        label: t("common:word.active"),
        dotClass: "bg-green-500",
      },
      {
        value: "blocked",
        label: t("users.modals:serviceUsersTable.label.blocked"),
        dotClass: "bg-red-500",
      },
    ],
    [],
  );

  const roleOptions = useMemo<CheckboxOption<string>[]>(
    () => [
      {
        value: "admin",
        label: t("users.modals:serviceUsersTable.label.admin"),
      },
      { value: "user", label: t("common:word.user") },
      {
        value: "network_admin",
        label: t("users.modals:serviceUsersTable.label.networkAdmin"),
      },
      {
        value: "billing_admin",
        label: t("users.modals:serviceUsersTable.label.billingAdmin"),
      },
      {
        value: "auditor",
        label: t("users.modals:serviceUsersTable.label.auditor"),
      },
    ],
    [],
  );

  const filterDefs = useMemo<TableFilterDef[]>(
    () => [
      {
        id: "status",
        label: t("common:word.status"),
        renderPicker: (p) => (
          <RadioPicker
            value={p.value as string | undefined}
            onChange={p.onChange}
            close={p.close}
            options={statusOptions}
          />
        ),
        formatChip: (v) =>
          formatRadioChip(v as string | undefined, statusOptions),
      },
      {
        id: "role_filter",
        label: t("users.modals:serviceUsersTable.text.role"),
        renderPicker: (p) => (
          <CheckboxListPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            options={roleOptions}
          />
        ),
        formatChip: (v) =>
          formatCheckboxChip(v as string[] | undefined, roleOptions, "roles"),
      },
    ],
    [statusOptions, roleOptions],
  );

  return (
    <DataTable
      headingTarget={headingTarget}
      isLoading={isLoading}
      text={t("users.modals:serviceUserModal.text.serviceUsers")}
      sorting={sorting}
      setSorting={setSorting}
      columns={ServiceUsersTableColumns}
      data={users}
      onRowClick={(row) => {
        router.push(`/team/user?id=${row.original.id}&service_user=true`);
      }}
      rowClassName={"cursor-pointer"}
      initialPageSize={25}
      showResetFilterButton={false}
      aboveTable={(table) => (
        <TableFilterChips table={table} filters={filterDefs} />
      )}
      columnVisibility={{
        is_current: false,
        role_filter: false,
      }}
      searchPlaceholder={t(
        "users.modals:serviceUsersTable.searchPlaceholder.searchByNameOrRole",
      )}
      getStartedCard={
        <GetStartedTest
          icon={
            <SquareIcon
              icon={<IconSettings2 size={24} className={"text-nb-gray-200"} />}
              color={"gray"}
              size={"large"}
            />
          }
          title={t("users.modals:serviceUserModal.title.createServiceUser")}
          description={t(
            "users.modals:serviceUsersTable.description.itLooksLikeYouDon",
          )}
          button={
            <div className={"flex flex-col"}>
              <div>
                <ServiceUserModal>
                  <Button
                    variant={"primary"}
                    className={""}
                    data-testid={"open-service-user-modal"}
                    disabled={!permission.users.create}
                  >
                    <PlusCircle size={16} />
                    {t("users.modals:serviceUserModal.title.createServiceUser")}
                  </Button>
                </ServiceUserModal>
              </div>
            </div>
          }
          learnMore={
            <>
              {t("common:word.learnMoreAbout")}
              <InlineLink
                href={
                  "https://docs.netbird.io/how-to/access-netbird-public-api"
                }
                target={"_blank"}
              >
                {t("users.modals:serviceUserModal.text.serviceUsers")}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </>
          }
        />
      }
      rightSide={() => (
        <>
          {users && users?.length > 0 && (
            <ServiceUserModal>
              <Button
                variant={"primary"}
                className={"ml-auto"}
                data-testid={"open-service-user-modal"}
                disabled={!permission.users.create}
              >
                <PlusCircle size={16} />
                {t("users.modals:serviceUserModal.title.createServiceUser")}
              </Button>
            </ServiceUserModal>
          )}
        </>
      )}
    >
      {(table) => (
        <>
          <TableFiltersButton
            table={table}
            filters={filterDefs}
            disabled={users?.length == 0}
          />
          <DataTableResetFilterButton
            table={table}
            onClick={() => {
              table.setPageIndex(0);
              table.resetColumnFilters();
              table.resetGlobalFilter();
            }}
          />
          <DataTableRefreshButton
            isDisabled={users?.length == 0}
            onClick={() => {
              mutate("/users?service_user=true");
              mutate("/groups");
            }}
          />
        </>
      )}
    </DataTable>
  );
}
