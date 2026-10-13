import Button from "@components/Button";
import { Checkbox } from "@components/Checkbox";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import {
  ColumnDef,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import useFetchApi from "@utils/api";
import React, { useState } from "react";
import { useSWRConfig } from "swr";
import { t } from "@/i18n";
import { PostureCheck } from "@/interfaces/PostureCheck";
import { PostureCheckChecksCell } from "@/modules/posture-checks/table/cells/PostureCheckChecksCell";
import { PostureCheckNameCell } from "@/modules/posture-checks/table/cells/PostureCheckNameCell";
type Props = {
  onAdd: (checks: PostureCheck[]) => void;
};

export default function PostureCheckBrowseTable({ onAdd }: Readonly<Props>) {
  const { data: postureChecks, isLoading } =
    useFetchApi<PostureCheck[]>("/posture-checks");
  const { mutate } = useSWRConfig();

  // Default sorting state of the table
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: true,
    },
  ]);

  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  return (
    <div className={""}>
      <DataTable
        showResetFilterButton={false}
        rowSelection={selectedRows}
        setRowSelection={setSelectedRows}
        isLoading={isLoading}
        keepStateInLocalStorage={false}
        text={t(
          "posture-checks.table:postureCheckBrowseTable.text.postureCheck",
        )}
        sorting={sorting}
        wrapperClassName={""}
        setSorting={setSorting}
        columns={PostureChecksColumns}
        showHeader={true}
        columnVisibility={{
          description: false,
        }}
        tableClassName={"mt-6 !border-0"}
        rowClassName={"!border-b-0 px-10"}
        data={postureChecks}
        searchPlaceholder={t(
          "posture-checks.table:postureCheckBrowseTable.searchPlaceholder.searchByNameAndDescription",
        )}
        onRowClick={(row) => row.toggleSelected()}
        rightSide={(table) => (
          <>
            {postureChecks && postureChecks?.length > 0 && (
              <Button
                variant={"primary"}
                className={"ml-auto"}
                onClick={() =>
                  onAdd(
                    table.getSelectedRowModel().rows.map((row) => row.original),
                  )
                }
                disabled={table.getSelectedRowModel().rows.length <= 0}
              >
                {t(
                  "posture-checks.table:postureCheckBrowseTable.text.addPostureChecks",
                  { length: table.getSelectedRowModel().rows.length },
                )}
              </Button>
            )}
          </>
        )}
      >
        {() => {
          return (
            <DataTableRefreshButton
              isDisabled={postureChecks?.length == 0}
              onClick={() => {
                mutate("/posture-checks");
              }}
            />
          );
        }}
      </DataTable>
    </div>
  );
}

export const PostureChecksColumns: ColumnDef<PostureCheck>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className={"min-w-[20px] max-w-[20px]"}>
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label={t("common:word.selectAll")}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className={"min-w-[20px] max-w-[20px]"}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("common:word.selectRow")}
          variant={"tableCell"}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("common:word.name")}
        </DataTableHeader>
      );
    },
    cell: ({ row }) => (
      <PostureCheckNameCell small={true} check={row.original} />
    ),
  },
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("posture-checks.table:postureCheckBrowseTable.text.checks")}
        </DataTableHeader>
      );
    },
    cell: ({ row }) => <PostureCheckChecksCell check={row.original} />,
  },
];
