"use client";

import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import { GroupBadgeIcon } from "@components/ui/GroupBadgeIcon";
import useFetchApi from "@utils/api";
import { sortBy } from "lodash";
import { ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import { Group } from "@/interfaces/Group";
import { useCanvasUI } from "@/modules/control-center/contexts/ControlCenterContext";
import { useCloseOnCanvasClick } from "@/modules/control-center/hooks/useCloseOnCanvasClick";
import { getGroupCountLabel } from "@/modules/control-center/utils/helpers";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard } from "@/theme/graph";
import { SelectGroupNode as UpstreamSelectGroupNode } from "../../../modules/control-center/nodes/SelectGroupNode";
import { SelectNodeShell } from "./SelectPeerNode";

/**
 * The group selector at the root of the group view, replacing
 * src/modules/control-center/nodes/SelectGroupNode.tsx through its alias.
 * @replaces-file src/modules/control-center/nodes/SelectGroupNode.tsx sha256:c227fb676953eb4c
 */
export * from "../../../modules/control-center/nodes/SelectGroupNode";

type Props = Parameters<typeof UpstreamSelectGroupNode>[0];

export const SelectGroupNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedSelectGroupNode {...props} />
  ) : (
    <UpstreamSelectGroupNode {...props} />
  );

function ThemedSelectGroupNode({ data, id }: Props) {
  const { data: groups } = useFetchApi<Group[]>("/groups");

  const groupOptions: SelectOption[] = React.useMemo(
    () =>
      sortBy(
        groups?.map(
          (g) =>
            ({
              value: g.id,
              label: g.name,
              icon: () => (
                <GroupBadgeIcon id={g?.id} issued={g?.issued} size={14} />
              ),
            }) as SelectOption,
        ) || [],
        "label",
        "asc",
      ),
    [groups],
  );

  const group = groups?.find((g) => g.id === data.currentGroup);
  const { groupUserCounts } = useCanvasUI();
  const countLabel = getGroupCountLabel(
    group,
    group ? groupUserCounts.get(group.id ?? group.name) : 0,
  );

  const [open, setOpen] = React.useState(false);
  useCloseOnCanvasClick(open, () => setOpen(false));

  return (
    <SelectNodeShell open={open}>
      <SelectDropdown
        variant={"secondary"}
        deferChange
        value={data.currentGroup}
        onChange={data.onChange}
        options={groupOptions}
        showSearch={true}
        searchPlaceholder={t(
          "control-center.nodes:selectGroupNode.searchPlaceholder.searchGroups",
        )}
        open={open}
        onOpenChange={setOpen}
        popoverWidth={280}
        triggerClassName={"nb-graph-select__trigger"}
        size={"xs"}
        maxHeight={300}
      >
        <GraphNodeCard
          nodeId={id}
          kind={"group"}
          className={"nb-graph-select__card"}
          icon={
            <GroupBadgeIcon id={group?.id} issued={group?.issued} size={16} />
          }
          title={group?.name ?? t("common:word.groups")}
          meta={group ? countLabel : undefined}
          labelMaxWidth={180}
          interactive
          trailing={<ChevronsUpDown size={16} />}
          state={{ selected: open }}
        />
      </SelectDropdown>
    </SelectNodeShell>
  );
}
