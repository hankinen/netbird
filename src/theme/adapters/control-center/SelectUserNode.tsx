"use client";

import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import TextWithTooltip from "@components/ui/TextWithTooltip";
import useFetchApi from "@utils/api";
import { generateColorFromUser } from "@utils/helpers";
import { sortBy } from "lodash";
import { ChevronsUpDown, Cog } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import { User } from "@/interfaces/User";
import { useCloseOnCanvasClick } from "@/modules/control-center/hooks/useCloseOnCanvasClick";
import { SmallUserAvatar } from "@/modules/users/SmallUserAvatar";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphNodeCard } from "@/theme/graph";
import { SelectUserNode as UpstreamSelectUserNode } from "../../../modules/control-center/nodes/SelectUserNode";
import { SelectNodeShell } from "./SelectPeerNode";

/**
 * The user selector at the root of the user view, replacing
 * src/modules/control-center/nodes/SelectUserNode.tsx through its alias
 * (`SelectedUser` and the rest are re-exported from upstream).
 * @replaces-file src/modules/control-center/nodes/SelectUserNode.tsx sha256:b8d1c7db57570347
 */
export * from "../../../modules/control-center/nodes/SelectUserNode";

type Props = Parameters<typeof UpstreamSelectUserNode>[0];

export const SelectUserNode = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedSelectUserNode {...props} />
  ) : (
    <UpstreamSelectUserNode {...props} />
  );

function ThemedSelectUserNode({ data, id }: Props) {
  // Optional: the same key is fetched across the canvas, and a role without
  // `users.read` must not raise the error boundary over it.
  const { data: users } = useFetchApi<User[]>(
    "/users?service_user=false",
    true,
  );

  const userSelectOptions: SelectOption[] = React.useMemo(
    () =>
      sortBy(
        users?.map(
          (user) =>
            ({
              value: user.id,
              label: user.name,
              searchValue: `${user.id}${user.email}${user.name}`,
              renderItem: () => (
                <div className={"flex items-center gap-2 w-full"}>
                  <SmallUserAvatar
                    name={user?.name}
                    email={user?.email}
                    id={user?.id}
                  />
                  <div className={"flex flex-col text-xs w-full"}>
                    <span className={"flex items-center gap-1.5 w-full"}>
                      <TextWithTooltip
                        text={user?.name || user?.id}
                        maxChars={20}
                      />
                    </span>
                    {user?.email && (
                      <span className={"opacity-70 flex items-center gap-1"}>
                        <TextWithTooltip
                          text={
                            user?.email ||
                            t(
                              "control-center.nodes:selectUserNode.text.netBird",
                            )
                          }
                          maxChars={20}
                        />
                      </span>
                    )}
                  </div>
                </div>
              ),
            }) as SelectOption,
        ) || [],
        "label",
        "asc",
      ),
    [users],
  );

  const user = users?.find((u) => u.id === data.currentUser);

  const [open, setOpen] = React.useState(false);
  useCloseOnCanvasClick(open, () => setOpen(false));

  return (
    <SelectNodeShell open={open}>
      <SelectDropdown
        variant={"secondary"}
        deferChange
        value={data.currentUser}
        onChange={data.onUserChange}
        options={userSelectOptions}
        showSearch={true}
        searchPlaceholder={t(
          "control-center.nodes:selectUserNode.searchPlaceholder.searchUserByNameOr",
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
          kind={"user"}
          className={"nb-graph-select__card"}
          icon={
            <span
              className={"nb-graph-avatar"}
              style={user ? { color: generateColorFromUser(user) } : undefined}
            >
              {user && !user.name && !user.id && <Cog size={12} />}
              {user?.name?.charAt(0) || user?.id?.charAt(0)}
            </span>
          }
          title={user?.name || user?.id || t("common:word.user")}
          meta={user?.email}
          labelMaxWidth={180}
          interactive
          trailing={<ChevronsUpDown size={16} />}
          state={{ selected: open }}
        />
      </SelectDropdown>
    </SelectNodeShell>
  );
}
