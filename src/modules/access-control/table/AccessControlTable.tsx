import Button from "@components/Button";
import Card from "@components/Card";
import FullTooltip from "@components/FullTooltip";
import InlineLink from "@components/InlineLink";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import DataTableResetFilterButton from "@components/table/DataTableResetFilterButton";
import {
  ENABLED_COLUMN_ID,
  fadeDisabledRowCells,
  isInteractiveCell,
} from "@components/table/disabledRowCells";
import { ENABLED_COLUMN_CLASS } from "@components/table/enabledColumnClass";
import {
  CheckboxListPicker,
  CheckboxOption,
  formatCheckboxChip,
} from "@components/table/filters/CheckboxListPicker";
import {
  formatGroupsChip,
  GroupsPicker,
} from "@components/table/filters/GroupsPicker";
import {
  formatRadioChip,
  RadioOption,
  RadioPicker,
} from "@components/table/filters/RadioPicker";
import {
  formatTextChip,
  TextInputPicker,
} from "@components/table/filters/TextInputPicker";
import {
  TableFilterChips,
  TableFilterDef,
  TableFiltersButton,
} from "@components/table/TableFilters";
import GetStartedTest from "@components/ui/GetStartedTest";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { removeAllSpaces } from "@utils/helpers";
import { ClockFadingIcon, ExternalLinkIcon, PlusCircle } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import AccessControlIcon from "@/assets/icons/AccessControlIcon";
import NoResults from "@/components/ui/NoResults";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { t } from "@/i18n";
import type { Policy } from "@/interfaces/Policy";
import AccessControlModal, {
  AccessControlUpdateModal,
} from "@/modules/access-control/AccessControlModal";
import AccessControlActionCell from "@/modules/access-control/table/AccessControlActionCell";
import AccessControlActiveCell from "@/modules/access-control/table/AccessControlActiveCell";
import AccessControlDestinationsCell from "@/modules/access-control/table/AccessControlDestinationsCell";
import AccessControlDirectionCell from "@/modules/access-control/table/AccessControlDirectionCell";
import AccessControlNameCell from "@/modules/access-control/table/AccessControlNameCell";
import AccessControlProtoPortsCell from "@/modules/access-control/table/AccessControlProtoPortsCell";
import AccessControlSourcesCell from "@/modules/access-control/table/AccessControlSourcesCell";
type Props = {
  policies?: Policy[];
  isLoading: boolean;
  headingTarget?: HTMLHeadingElement | null;
  isGroupPage?: boolean;
};

export const AccessControlTableColumns: ColumnDef<Policy>[] = [
  {
    id: "name",
    accessorFn: (row) => removeAllSpaces(row?.name),
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("common:word.name")}
        </DataTableHeader>
      );
    },
    sortingFn: "text",
    filterFn: "fuzzy",
    cell: ({ cell }) => <AccessControlNameCell policy={cell.row.original} />,
  },
  {
    id: "description",
    accessorFn: (row) => removeAllSpaces(row?.description),
    sortingFn: "text",
    filterFn: "fuzzy",
  },
  {
    id: ENABLED_COLUMN_ID,
    accessorKey: "enabled",
    accessorFn: (row) => row.enabled,
    enableSorting: false,
    meta: { className: ENABLED_COLUMN_CLASS.xl },
    header: ({ column }) => {
      return (
        <DataTableHeader column={column} sorting={false}>
          {t("common:word.active")}
        </DataTableHeader>
      );
    },
    cell: ({ cell }) => <AccessControlActiveCell policy={cell.row.original} />,
  },
  {
    id: "sources",
    accessorFn: (row) => {
      try {
        return row.rules[0].sources?.length || 0;
      } catch (e) {
        console.log(e);
      }
      return 0;
    },
    sortingFn: "basic",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("access-control.table:accessControlTable.text.sources")}
        </DataTableHeader>
      );
    },
    cell: ({ cell }) => <AccessControlSourcesCell policy={cell.row.original} />,
  },
  {
    id: "direction",
    accessorFn: (row) => {
      try {
        return row.rules[0].bidirectional || true;
      } catch (e) {
        console.log(e);
      }
      return 0;
    },
    sortingFn: "basic",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("access-control.table:accessControlTable.text.direction")}
        </DataTableHeader>
      );
    },
    cell: ({ cell }) => (
      <AccessControlDirectionCell policy={cell.row.original} />
    ),
  },
  {
    id: "destinations",
    accessorFn: (row) => {
      try {
        return row.rules[0].destinations?.length || 0;
      } catch (e) {
        console.log(e);
      }
      return 0;
    },
    sortingFn: "basic",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("access-control.table:accessControlTable.text.destinations")}
        </DataTableHeader>
      );
    },
    cell: ({ cell }) => (
      <AccessControlDestinationsCell policy={cell.row.original} />
    ),
  },

  {
    id: "proto_ports",
    accessorFn: (row) => row.rules?.[0]?.protocol || "",
    sortingFn: "text",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("access-control.table:accessControlTable.text.protoPorts")}
        </DataTableHeader>
      );
    },
    cell: ({ cell }) => (
      <AccessControlProtoPortsCell policy={cell.row.original} />
    ),
  },
  {
    id: "id",
    accessorKey: "id",
    filterFn: "exactMatch",
  },
  // Hidden filter columns powering the consolidated Filters UI.
  {
    id: "source_group_names",
    accessorFn: (row) => {
      const sources = row.rules?.[0]?.sources;
      if (!sources) return [];
      return (sources as { name?: string }[])
        .map((s) => s?.name)
        .filter((n): n is string => !!n);
    },
    filterFn: "arrIncludesSome",
  },
  {
    id: "destination_group_names",
    accessorFn: (row) => {
      const destinations = row.rules?.[0]?.destinations;
      if (!destinations) return [];
      return (destinations as { name?: string }[])
        .map((d) => d?.name)
        .filter((n): n is string => !!n);
    },
    filterFn: "arrIncludesSome",
  },
  {
    id: "protocol_filter",
    accessorFn: (row) => [row.rules?.[0]?.protocol || "all"],
    filterFn: "arrIncludesSome",
  },
  {
    id: "ports_filter",
    accessorFn: (row) => {
      const rule = row.rules?.[0];
      const ports = rule?.ports || [];
      const ranges = (rule?.port_ranges || []).map(
        (r) => `${r.start}-${r.end}`,
      );
      return [...ports, ...ranges].join(" ");
    },
    filterFn: "includesString",
  },
  {
    id: "has_posture_checks",
    accessorFn: (row) =>
      (row.source_posture_checks?.length ?? 0) > 0 ? "with" : "without",
    filterFn: "equalsString",
  },
  {
    id: "direction_filter",
    accessorFn: (row) => !!row.rules?.[0]?.bidirectional,
  },
  {
    id: "actions",
    accessorKey: "id",
    header: "",
    cell: ({ cell }) => <AccessControlActionCell policy={cell.row.original} />,
  },
];

export default function AccessControlTable({
  policies,
  isLoading,
  headingTarget,
  isGroupPage,
}: Readonly<Props>) {
  const { mutate } = useSWRConfig();
  const path = usePathname();
  const { permission } = usePermissions();
  const params = useSearchParams();
  const idParam = !isGroupPage ? params.get("id") : undefined;

  // Default sorting state of the table
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [
      {
        id: "name",
        desc: true,
      },
    ],
    !isGroupPage,
  );

  const [editModal, setEditModal] = useState(false);
  const [currentRow, setCurrentRow] = useState<Policy>();
  const [currentCellClicked, setCurrentCellClicked] = useState("");

  const [showTemporaryPolicies, setShowTemporaryPolicies] = useState(false);

  const withTemporaryPolicies = useCallback(
    (condition: boolean) =>
      policies?.filter((policy) =>
        condition
          ? policy?.name?.startsWith("Temporary") &&
            policy?.name?.endsWith("client") &&
            policy?.description?.startsWith("Temporary") &&
            policy?.description?.endsWith("client")
          : !(
              policy?.name?.startsWith("Temporary") &&
              policy?.name?.endsWith("client") &&
              policy?.description?.startsWith("Temporary") &&
              policy?.description?.endsWith("client")
            ),
      ) ?? [],
    [policies],
  );

  const tempPolicies = useMemo(
    () => withTemporaryPolicies(true),
    [withTemporaryPolicies],
  );
  const regularPolicies = useMemo(
    () => withTemporaryPolicies(false),
    [withTemporaryPolicies],
  );

  useEffect(() => {
    if (showTemporaryPolicies && tempPolicies?.length === 0) {
      setShowTemporaryPolicies(false);
    }
  }, [showTemporaryPolicies, tempPolicies]);

  // Single-radio status filter mirroring the previous All / Active /
  // Inactive ButtonGroup. Routed through the consolidated Filters UI.
  const statusOptions = useMemo<RadioOption<boolean | undefined>[]>(
    () => [
      {
        value: undefined,
        label: t("common:word.all"),
        dotClass: "bg-nb-gray-500",
      },
      {
        value: true,
        label: t("access-control.table:accessControlTable.label.enabled"),
        dotClass: "bg-green-500",
      },
      {
        value: false,
        label: t("access-control.table:accessControlTable.label.disabled"),
        dotClass: "bg-nb-gray-700",
      },
    ],
    [],
  );

  const protocolOptions = useMemo<CheckboxOption<string>[]>(
    () => [
      { value: "tcp", label: "TCP" },
      { value: "udp", label: "UDP" },
      { value: "icmp", label: "ICMP" },
      {
        value: "netbird-ssh",
        label: t("access-control.table:accessControlTable.label.netBirdSSH"),
      },
    ],
    [],
  );

  const postureOptions = useMemo<RadioOption<string | undefined>[]>(
    () => [
      { value: undefined, label: t("common:word.all") },
      {
        value: "with",
        label: t("access-control.table:accessControlTable.label.with"),
      },
      {
        value: "without",
        label: t("access-control.table:accessControlTable.label.without"),
      },
    ],
    [],
  );

  const directionOptions = useMemo<RadioOption<boolean | undefined>[]>(
    () => [
      { value: undefined, label: t("common:word.all") },
      {
        value: true,
        label: t("access-control.table:accessControlTable.label.bidirectional"),
      },
      {
        value: false,
        label: t("access-control.table:accessControlTable.label.oneWay"),
      },
    ],
    [],
  );

  // Groups derived from the current policies' sources + destinations,
  // so the Sources/Destinations filters only offer groups that actually
  // appear in the table.
  const tableGroups = useMemo(() => {
    if (!policies) return [];
    const map = new Map<string, { id?: string; name: string }>();
    for (const policy of policies) {
      const rule = policy.rules?.[0];
      if (!rule) continue;
      const both = [
        ...((rule.sources as { id?: string; name?: string }[] | null) ?? []),
        ...((rule.destinations as { id?: string; name?: string }[] | null) ??
          []),
      ];
      for (const g of both) {
        if (g?.name && !map.has(g.name)) {
          map.set(g.name, { id: g.id, name: g.name });
        }
      }
    }
    return Array.from(map.values());
  }, [policies]);

  const filterDefs = useMemo<TableFilterDef[]>(
    () => [
      {
        id: "enabled",
        label: t("common:word.status"),
        renderPicker: (p) => (
          <RadioPicker
            value={p.value as boolean | undefined}
            onChange={p.onChange}
            close={p.close}
            options={statusOptions}
          />
        ),
        formatChip: (v) =>
          formatRadioChip(v as boolean | undefined, statusOptions),
      },
      {
        id: "source_group_names",
        label: t("access-control.table:accessControlTable.text.sources"),
        renderPicker: (p) => (
          <GroupsPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            groups={tableGroups}
          />
        ),
        formatChip: (v) => formatGroupsChip(v as string[] | undefined),
      },
      {
        id: "destination_group_names",
        label: t("access-control.table:accessControlTable.text.destinations"),
        renderPicker: (p) => (
          <GroupsPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            groups={tableGroups}
          />
        ),
        formatChip: (v) => formatGroupsChip(v as string[] | undefined),
      },
      {
        id: "direction_filter",
        label: t("access-control.table:accessControlTable.text.direction"),
        renderPicker: (p) => (
          <RadioPicker
            value={p.value as boolean | undefined}
            onChange={p.onChange}
            close={p.close}
            options={directionOptions}
          />
        ),
        formatChip: (v) =>
          formatRadioChip(v as boolean | undefined, directionOptions),
      },
      {
        id: "protocol_filter",
        label: t("access-control.table:accessControlTable.label.protocol"),
        renderPicker: (p) => (
          <CheckboxListPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            options={protocolOptions}
          />
        ),
        formatChip: (v) =>
          formatCheckboxChip(
            v as string[] | undefined,
            protocolOptions,
            "protocols",
          ),
      },
      {
        id: "ports_filter",
        label: t("access-control.table:accessControlTable.label.port"),
        renderPicker: (p) => (
          <TextInputPicker
            value={p.value as string | undefined}
            onChange={p.onChange}
            close={p.close}
            placeholder={"e.g. 443"}
          />
        ),
        formatChip: (v) => formatTextChip(v as string | undefined),
      },
      {
        id: "has_posture_checks",
        label: t("access-control.table:accessControlTable.label.postureChecks"),
        renderPicker: (p) => (
          <RadioPicker
            value={p.value as string | undefined}
            onChange={p.onChange}
            close={p.close}
            options={postureOptions}
          />
        ),
        formatChip: (v) =>
          formatRadioChip(v as string | undefined, postureOptions),
      },
    ],
    [
      statusOptions,
      protocolOptions,
      postureOptions,
      directionOptions,
      tableGroups,
    ],
  );

  return (
    <>
      {editModal && currentRow && (
        <AccessControlUpdateModal
          policy={currentRow}
          open={editModal}
          onOpenChange={setEditModal}
          cell={currentCellClicked}
        />
      )}
      <DataTable
        headingTarget={headingTarget}
        isLoading={isLoading}
        wrapperComponent={isGroupPage ? Card : undefined}
        wrapperProps={isGroupPage ? { className: "mt-6 w-full" } : undefined}
        paginationPaddingClassName={isGroupPage ? "px-0 pt-8" : undefined}
        tableClassName={isGroupPage ? "mt-0 mb-2" : undefined}
        inset={false}
        minimal={isGroupPage}
        keepStateInLocalStorage={!isGroupPage || !idParam}
        initialSearch={idParam ? "" : undefined}
        initialFilters={
          idParam
            ? [
                {
                  id: "id",
                  value: idParam,
                },
              ]
            : undefined
        }
        text={t(
          "access-control.table:accessControlTable.text.accessControlPolicies",
        )}
        sorting={sorting}
        setSorting={setSorting}
        initialPageSize={25}
        showResetFilterButton={false}
        columns={AccessControlTableColumns}
        aboveTable={(table) => (
          <TableFilterChips table={table} filters={filterDefs} />
        )}
        columnVisibility={{
          description: false,
          id: false,
          temporary: false,
          source_group_names: false,
          destination_group_names: false,
          protocol_filter: false,
          ports_filter: false,
          has_posture_checks: false,
          direction_filter: false,
        }}
        cellClassName={fadeDisabledRowCells}
        data={showTemporaryPolicies ? tempPolicies : regularPolicies}
        onRowClick={(row, cell) => {
          if (isInteractiveCell(cell)) return;
          setCurrentRow(row.original);
          setEditModal(true);
          setCurrentCellClicked(cell);
        }}
        searchPlaceholder={t(
          "access-control.table:accessControlTable.searchPlaceholder.searchByNameAndDescription",
        )}
        getStartedCard={
          isGroupPage ? (
            <NoResults
              className={"py-4"}
              title={t(
                "access-control.table:accessControlTable.title.thisGroupIsNotUsed",
              )}
              description={t(
                "access-control.table:accessControlTable.description.assignThisGroupAsEither",
              )}
              icon={
                <AccessControlIcon size={20} className={"fill-nb-gray-300"} />
              }
            >
              <div className={"flex gap-4 items-center justify-center"}>
                <AccessControlModal>
                  <Button
                    variant={"primary"}
                    className={"mt-4"}
                    disabled={!permission.policies.create}
                  >
                    <PlusCircle size={16} />
                    {t(
                      "access-control.table:accessControlTable.text.addPolicy",
                    )}
                  </Button>
                </AccessControlModal>
              </div>
            </NoResults>
          ) : (
            <GetStartedTest
              icon={
                <SquareIcon
                  icon={
                    <AccessControlIcon
                      className={"fill-nb-gray-200"}
                      size={20}
                    />
                  }
                  color={"gray"}
                  size={"large"}
                />
              }
              title={t(
                "access-control.table:accessControlTable.title.createNewPolicy",
              )}
              description={t(
                "access-control.table:accessControlTable.description.itLooksLikeYouDon",
              )}
              button={
                <div className={"flex gap-4 items-center justify-center"}>
                  <AccessControlModal>
                    <Button
                      variant={"primary"}
                      disabled={!permission.policies.create}
                    >
                      <PlusCircle size={16} />
                      {t(
                        "access-control.table:accessControlTable.text.addPolicy",
                      )}
                    </Button>
                  </AccessControlModal>
                </div>
              }
              learnMore={
                <>
                  {t("common:word.learnMoreAbout")}
                  <InlineLink
                    href={
                      "https://docs.netbird.io/how-to/manage-network-access"
                    }
                    target={"_blank"}
                  >
                    {t(
                      "access-control.table:accessControlTable.text.accessControls",
                    )}
                    <ExternalLinkIcon size={12} />
                  </InlineLink>
                </>
              }
            />
          )
        }
        rightSide={() => (
          <>
            {policies && policies?.length > 0 && (
              <div className={"flex ml-auto gap-4 items-center"}>
                <AccessControlModal>
                  <Button
                    variant={"primary"}
                    className={"ml-auto"}
                    disabled={!permission.policies.create}
                    data-testid="open-add-policy"
                  >
                    <PlusCircle size={16} />
                    {t(
                      "access-control.table:accessControlTable.text.addPolicy",
                    )}
                  </Button>
                </AccessControlModal>
              </div>
            )}
          </>
        )}
      >
        {(table) => {
          return (
            <>
              <TableFiltersButton
                table={table}
                filters={filterDefs}
                disabled={policies?.length == 0}
              />

              <DataTableResetFilterButton
                table={table}
                onClick={() => {
                  table.setPageIndex(0);
                  table.setColumnFilters([]);
                  table.setGlobalFilter("");
                }}
              />

              {tempPolicies?.length > 0 && (
                <FullTooltip
                  content={
                    <div className={"max-w-sm text-xs"}>
                      {t(
                        "access-control.table:accessControlTable.text.showTemporaryPoliciesCreatedBy",
                      )}
                    </div>
                  }
                >
                  <Button
                    className={"h-[42px]"}
                    variant={showTemporaryPolicies ? "tertiary" : "secondary"}
                    onClick={() => {
                      setShowTemporaryPolicies(!showTemporaryPolicies);
                    }}
                  >
                    <ClockFadingIcon size={16} />
                  </Button>
                </FullTooltip>
              )}

              <DataTableRefreshButton
                isDisabled={policies?.length == 0}
                onClick={() => {
                  mutate("/policies").then();
                  mutate("/groups").then();
                }}
              />
            </>
          );
        }}
      </DataTable>
    </>
  );
}
