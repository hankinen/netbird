import HelpText from "@components/HelpText";
import * as React from "react";
import { t } from "@/i18n";
type Props = {
  type?: "user-groups" | "groups";
};
export const GroupPrefixHelpText = ({ type = "groups" }: Props) => {
  return type === "user-groups" ? (
    <HelpText className={"max-w-lg mt-2"}>
      {t("integrations.idp-sync:groupPrefixHelpText.text.byDefault")}{" "}
      <span className={"text-netbird font-semibold"}>
        {t("integrations.idp-sync:groupPrefixHelpText.text.allUsers")}
      </span>{" "}
      {t(
        "integrations.idp-sync:groupPrefixHelpText.text.willBeSynchronizedFromYour",
      )}{" "}
      <br />
      {t(
        "integrations.idp-sync:groupPrefixHelpText.text.ifYouWantToSynchronize",
      )}
    </HelpText>
  ) : (
    <HelpText className={"max-w-lg mt-2"}>
      {t("integrations.idp-sync:groupPrefixHelpText.text.byDefault")}{" "}
      <span className={"text-netbird font-semibold"}>
        {t("integrations.idp-sync:groupPrefixHelpText.text.allGroups")}
      </span>{" "}
      {t(
        "integrations.idp-sync:groupPrefixHelpText.text.willBeSynchronizedFromYour",
      )}{" "}
      <br />
      {t(
        "integrations.idp-sync:groupPrefixHelpText.text.ifYouWantToSynchronize2",
      )}
    </HelpText>
  );
};
