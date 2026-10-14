import * as React from "react";
import integrationImage from "@/assets/integrations/entra-id.png";
import { IdentityProvider } from "@/interfaces/IdentityProvider";
import { GenericSCIM } from "@/modules/integrations/idp-sync/generic-scim/GenericSCIM";

import { t } from "@/i18n";
export const EntraSCIM = () => {
  return (
    <GenericSCIM
      provider={IdentityProvider.ENTRA}
      name={"Entra ID (SCIM)"}
      description={t(
        "integrations.idp-sync:entraSCIM.description.synchronizeUsersAndGroupsFrom",
      )}
      url={{
        title: t("integrations.idp-sync:azureAD.title.microsoftCom"),
        href: "https://learn.microsoft.com/en-us/entra/architecture/sync-scim",
      }}
      image={integrationImage}
    />
  );
};
