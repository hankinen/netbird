import { notify } from "@components/Notification";
import { ToggleSwitch } from "@components/ToggleSwitch";
import { useApiCall } from "@utils/api";
import React, { useMemo } from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { User } from "@/interfaces/User";
type Props = {
  user: User;
  isUserPage?: boolean;
};
export default function UserBlockCell({ user, isUserPage = false }: Props) {
  const userRequest = useApiCall<User>("/users");
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();
  const { permission } = usePermissions();

  const isChecked = useMemo(() => {
    return user.is_blocked;
  }, [user]);

  const disabled = user.is_current || user.role === "owner";

  const update = async (blocked: boolean) => {
    const name = user.name || "User";

    if (blocked) {
      const choice = await confirm({
        title: t("users.table-cells:userActionCell.title.block", { name }),
        description: t(
          "users.table-cells:userActionCell.description.thisActionWillImmediatelyRevoke",
        ),
        confirmText: t("users.table-cells:userActionCell.confirmText.block"),
        cancelText: t("common:word.cancel"),
        type: "danger",
      });
      if (!choice) return;
    }

    notify({
      title: blocked
        ? t("users.table-cells:userActionCell.text.userBlocked")
        : t("users.table-cells:userActionCell.text.userUnblocked"),
      description:
        name + " was successfully " + (blocked ? "blocked." : "unblocked."),
      promise: userRequest
        .put(
          {
            role: user.role,
            auto_groups: user.auto_groups,
            is_blocked: blocked,
          },
          `/${user.id}`,
        )
        .then(() => {
          mutate(`/users?service_user=false`);
          if (isUserPage) mutate(`/users`);
        }),
      loadingMessage: blocked
        ? t("users.table-cells:userActionCell.text.blockingTheUser")
        : t("users.table-cells:userActionCell.text.unblockingTheUser"),
    });
  };

  if (user?.pending_approval) return;

  return !disabled ? (
    <div className={"flex"}>
      <ToggleSwitch
        disabled={!permission.users.update}
        variant={"red"}
        checked={isChecked}
        size={"small"}
        onClick={() => update(!isChecked)}
      />
    </div>
  ) : null;
}
