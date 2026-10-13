import Button from "@components/Button";
import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { Loader2, MailIcon } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { User } from "@/interfaces/User";
type Props = {
  user: User;
};
export const UserResendInviteButton = ({ user }: Props) => {
  const userRequest = useApiCall<User>("/users", true);
  const [isLoading, setIsLoading] = useState(false);
  const { permission } = usePermissions();

  const inviteUser = async () => {
    setIsLoading(true);
    notify({
      title: t("users.modals:userResendInviteButton.title.resendInvite"),
      description: t(
        "users.modals:userResendInviteButton.description.theInvitationIsBeingSent",
        { email: user.email },
      ),
      promise: userRequest
        .post("", `/${user.id}/invite`)
        .finally(() => setIsLoading(false)),
      loadingMessage: t(
        "users.modals:userResendInviteButton.loadingMessage.sendingInvitation",
      ),
    });
  };

  const LoadingMessage = () => (
    <>
      <Loader2 size={14} className={"animate-spin block"} />
      {t("users.modals:userResendInviteButton.text.sending")}
    </>
  );

  const DefaultMessage = () => (
    <>
      <MailIcon size={13} />
      {t("users.modals:userResendInviteButton.text.resend")}
    </>
  );

  return (
    user.status == "invited" && (
      <Button
        disabled={!permission.users.create}
        variant={"secondary"}
        size={"xs"}
        onClick={inviteUser}
        className={cn("!px-3", isLoading && "animate-pulse")}
      >
        {isLoading ? <LoadingMessage /> : <DefaultMessage />}
      </Button>
    )
  );
};
