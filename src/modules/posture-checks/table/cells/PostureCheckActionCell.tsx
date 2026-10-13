import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { PostureCheck } from "@/interfaces/PostureCheck";
type Props = {
  check: PostureCheck;
};
export const PostureCheckActionCell = ({ check }: Props) => {
  const { permission } = usePermissions();

  const deleteRequest = useApiCall("/posture-checks");
  const { confirm } = useDialog();
  const { mutate } = useSWRConfig();

  const handleDelete = async () => {
    const choice = await confirm({
      title: t("posture-checks.table:postureCheckActionCell.title.delete", {
        name: check.name,
      }),
      description: t(
        "posture-checks.table:postureCheckActionCell.description.areYouSureYouWant",
      ),
      confirmText: t("common:word.delete"),
      cancelText: t("common:word.cancel"),
      type: "danger",
    });
    if (choice) {
      notify({
        title: check.name,
        description: t(
          "posture-checks.table:postureCheckActionCell.description.postureCheckWasSuccessfullyDeleted",
        ),
        promise: deleteRequest.del({}, `/${check.id}`).then(() => {
          mutate("/posture-checks").then();
        }),
        loadingMessage: t(
          "posture-checks.table:postureCheckActionCell.loadingMessage.deletingPostureCheck",
        ),
      });
    }
  };

  const hasPolicies = check.policies ? check.policies?.length > 0 : false;

  return (
    <div className={"flex justify-end pr-4"}>
      <FullTooltip
        disabled={!hasPolicies}
        content={
          <div className={"text-xs max-w-xs"}>
            {t(
              "posture-checks.table:postureCheckActionCell.text.thisPostureCheckIsAssigned",
            )}
          </div>
        }
        interactive={false}
      >
        <Button
          variant={"danger-outline"}
          size={"sm"}
          onClick={handleDelete}
          disabled={hasPolicies || !permission.policies.delete}
        >
          <Trash2 size={16} />
          {t("common:word.delete")}
        </Button>
      </FullTooltip>
    </div>
  );
};
