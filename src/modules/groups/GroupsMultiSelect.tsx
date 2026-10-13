import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import { notify } from "@components/Notification";
import { DataTableMultiSelectPopup } from "@components/table/DataTableMultiSelectPopup";
import { ErrorResponse, useApiCall } from "@utils/api";
import { FolderGit2, Trash2 } from "lucide-react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { Group } from "@/interfaces/Group";
import { GroupUsage } from "@/modules/groups/useGroupsUsage";
type Props = {
  selectedGroups?: GroupUsage[];
  onCanceled?: () => void;
};

export const GroupsMultiSelect = ({
  selectedGroups = [],
  onCanceled,
}: Readonly<Props>) => {
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();
  const { deleteGroupDropdownOption } = useGroups();
  const { permission } = usePermissions();
  const groupCall = useApiCall<Group>("/groups", true);
  const groupCount = selectedGroups.length;

  const deleteAllGroups = async () => {
    if (!permission.groups.delete || groupCount === 0) return;

    const choice = await confirm({
      title: t("groups.main:groupsMultiSelect.title.delete", {
        groupCount,
        value: groupCount > 1 ? "groups" : "group",
      }),
      description: t(
        "groups.main:groupsMultiSelect.description.areYouSureYouWant",
        { value: groupCount > 1 ? "these groups" : "this group" },
      ),
      confirmText: t("groups.main:groupsMultiSelect.confirmText.deleteAll"),
      cancelText: t("common:word.cancel"),
      type: "danger",
    });
    if (!choice) return;

    // Take the batch and drop the selection now rather than when the requests
    // land, so a slow batch cannot wipe a selection the user made in the
    // meantime, and the popup acknowledges the confirmation immediately.
    const groupsToDelete = selectedGroups;
    onCanceled?.();

    // allSettled, not all: the in-use counts driving the checkboxes come from a
    // client-side snapshot, so the server can still reject an individual group.
    // The table has to refresh for the ones that did get deleted either way.
    const promise = Promise.allSettled(
      groupsToDelete.map((group) => groupCall.del({}, `/${group.id}`)),
    ).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          deleteGroupDropdownOption(groupsToDelete[index].name);
        }
      });
      mutate("/groups");

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length === 0) return;

      const firstError = failures[0].reason as ErrorResponse | undefined;
      const failureMessage =
        firstError?.message ?? t("common:apiError.unknown");
      return Promise.reject({
        code: firstError?.code ?? 418,
        requestId: firstError?.requestId,
        message:
          failures.length === groupCount
            ? failureMessage
            : `${failures.length} of ${groupCount} groups could not be deleted. ${failureMessage}`,
      } satisfies ErrorResponse);
    });

    notify({
      title: t("groups.main:groupsMultiSelect.title.deleteGroups"),
      description:
        groupCount > 1
          ? t(
              "groups.main:groupsMultiSelect.text.groupsWereSuccessfullyDeleted",
            )
          : t("groups.main:groupsMultiSelect.text.groupWasSuccessfullyDeleted"),
      promise,
      loadingMessage:
        groupCount > 1
          ? t("groups.main:groupsMultiSelect.text.deletingTheSelectedGroups")
          : t("groups.main:groupsMultiSelect.text.deletingTheSelectedGroup"),
    });
  };

  return (
    <DataTableMultiSelectPopup
      selectedItems={selectedGroups}
      label={
        groupCount === 1
          ? t("groups.main:groupsMultiSelect.text.groupSelected")
          : t("groups.main:groupsMultiSelect.text.groupsSelected")
      }
      onCanceled={onCanceled}
      icon={<FolderGit2 size={16} />}
      rightSide={
        <FullTooltip
          content={
            <span className={"text-xs"}>
              {t("groups.main:groupsMultiSelect.confirmText.deleteAll")}
            </span>
          }
        >
          <Button
            variant={"danger-outline"}
            size={"xs"}
            className={"!h-9 !w-9"}
            onClick={deleteAllGroups}
            disabled={!permission.groups.delete}
            aria-label={t(
              "groups.main:groupsMultiSelect.ariaLabel.deleteSelectedGroups",
            )}
          >
            <Trash2 size={16} className={"shrink-0"} />
          </Button>
        </FullTooltip>
      }
    />
  );
};
