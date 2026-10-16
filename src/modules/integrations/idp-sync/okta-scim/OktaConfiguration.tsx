import Button from "@components/Button";
import Card from "@components/Card";
import HelpText from "@components/HelpText";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import { notify } from "@components/Notification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { useHasChanges } from "@hooks/useHasChanges";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { trim } from "lodash";
import {
  AlertOctagon,
  Cog,
  FolderGit2,
  KeyRound,
  RefreshCcw,
  UserCircle,
} from "lucide-react";
import React, { useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/okta.png";
import { useDialog } from "@/contexts/DialogProvider";
import { t } from "@/i18n";
import { OktaIntegration } from "@/interfaces/IdentityProvider";
import { EmbeddedIdentityProviderSelect } from "@/modules/integrations/idp-sync/EmbeddedIdentityProviderSelect";
import { GroupPrefixHelpText } from "@/modules/integrations/idp-sync/GroupPrefixHelpText";
import { GroupPrefixInput } from "@/modules/integrations/idp-sync/GroupPrefixInput";
import { useIntegrations } from "@/modules/integrations/idp-sync/useIntegrations";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function OktaConfiguration({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { okta } = useIntegrations();

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
        {okta && (
          <ConfigurationContent
            onSuccess={() => {
              onOpenChange(false);
              onSuccess && onSuccess();
            }}
            config={okta}
          />
        )}
      </Modal>
    </>
  );
}

type ModalProps = {
  onSuccess: () => void;
  config: OktaIntegration;
};

export function ConfigurationContent({ onSuccess, config }: ModalProps) {
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();

  const [tab, setTab] = useState<string>("settings");

  const oktaRequest = useApiCall<OktaIntegration>(
    "/integrations/okta-scim-idp",
  );

  const [connectorId, setConnectorId] = useState(config.connector_id || "");
  const clientSecretPlaceholder = "******************************";
  const [authToken, setAuthToken] = useState(
    config.auth_token || clientSecretPlaceholder,
  );

  const [groupPrefixes, setGroupPrefixes] = useState<string[]>(
    config.group_prefixes || [],
  );
  const [userGroupPrefixes, setUserGroupPrefixes] = useState<string[]>(
    config.user_group_prefixes || [],
  );

  const { hasChanges, updateRef } = useHasChanges([
    authToken,
    connectorId,
    groupPrefixes,
    userGroupPrefixes,
  ]);

  const regenerateAuthToken = async () => {
    const choice = await confirm({
      title: t(
        "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.title.regenerateAuthToken",
      ),
      description: t(
        "integrations.idp-sync.jumpcloud-configuration:oktaConfiguration.description.areYouSureYouWant",
      ),
      confirmText: t(
        "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.confirmText.regenerate",
      ),
      cancelText: t("common:word.cancel"),
      type: "default",
    });

    if (!choice) return;

    notify({
      title: t(
        "integrations.idp-sync.jumpcloud-configuration:oktaConfiguration.title.oktaIntegration",
      ),
      description: t(
        "integrations.idp-sync.jumpcloud-configuration:oktaConfiguration.description.authTokenForOktaWas",
      ),
      promise: oktaRequest.post({}, `/${config.id}/token`).then((r) => {
        mutate("/integrations/okta-scim-idp");
        setAuthToken(r.auth_token);
        updateRef([r.auth_token, groupPrefixes, userGroupPrefixes]);
      }),
      loadingMessage: t(
        "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.loadingMessage.updatingYourAuthToken",
      ),
    });
  };

  const deleteIntegration = async () => {
    const choice = await confirm({
      title: t(
        "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.title.deleteIntegration",
      ),
      description: t(
        "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.description.areYouSureYouWant2",
      ),
      confirmText: t("common:word.delete"),
      cancelText: t("common:word.cancel"),
      type: "danger",
    });

    if (!choice) return;

    notify({
      title: t(
        "integrations.idp-sync.jumpcloud-configuration:oktaConfiguration.title.oktaIntegration",
      ),
      description: t(
        "integrations.idp-sync.jumpcloud-configuration:oktaConfiguration.description.oktaWasSuccessfullyDeleted",
      ),
      promise: oktaRequest.del({}, `/${config.id}`).then(() => {
        mutate("/integrations/okta-scim-idp");
        onSuccess();
      }),
      loadingMessage: t("integrations.shared:word.deletingIntegration"),
    });
  };

  const updateIntegration = async () => {
    notify({
      title: t(
        "integrations.idp-sync.jumpcloud-configuration:oktaConfiguration.title.oktaIntegration",
      ),
      description: t(
        "integrations.idp-sync.jumpcloud-configuration:oktaConfiguration.description.oktaWasSuccessfullyUpdated",
      ),
      promise: oktaRequest
        .put(
          {
            group_prefixes: groupPrefixes
              ? groupPrefixes.filter((prefix) => trim(prefix) !== "")
              : [],
            user_group_prefixes: userGroupPrefixes
              ? userGroupPrefixes.filter((prefix) => trim(prefix) !== "")
              : [],
            ...(connectorId ? { connector_id: connectorId } : {}),
          },
          `/${config.id}`,
        )
        .then(() => {
          mutate("/integrations/okta-scim-idp");
          onSuccess();
        }),
      loadingMessage: t("integrations.shared:word.updatingIntegration"),
    });
  };

  return (
    <ModalContent
      maxWidthClass={cn("relative max-w-xl")}
      showClose={true}
      className={""}
      autoFocus={false}
    >
      <GradientFadedBackground />

      <IntegrationModalHeader
        image={integrationImage}
        title={t(
          "integrations.idp-sync.jumpcloud-configuration:oktaConfiguration.title.oktaConfiguration",
        )}
        description={t(
          "integrations.idp-sync.jumpcloud-configuration:oktaConfiguration.description.syncYourUsersAndGroups",
        )}
      />

      <Tabs
        defaultValue={tab}
        onValueChange={(v) => setTab(v)}
        className={"mt-6"}
      >
        <TabsList justify={"start"} className={"px-8"}>
          <TabsTrigger value={"settings"}>
            <Cog
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("common:word.settings")}
          </TabsTrigger>
          <TabsTrigger value={"group-sync"}>
            <FolderGit2
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t(
              "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.text.groupSync",
            )}
          </TabsTrigger>
          <TabsTrigger value={"user-sync"}>
            <UserCircle
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t(
              "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.text.userSync",
            )}
          </TabsTrigger>
          <TabsTrigger value={"danger"}>
            <AlertOctagon
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("integrations.shared:word.dangerZone")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={"settings"} className={"px-8 text-sm"}>
          <div className={"flex-col gap-3 flex"}>
            <Card className={"w-full"}>
              <Card.List>
                <Card.ListItem
                  copy={!authToken.includes("*")}
                  copyText={t(
                    "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.copyText.authToken",
                  )}
                  label={
                    <>
                      <KeyRound size={16} />
                      {t(
                        "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.text.authToken",
                      )}
                    </>
                  }
                  value={authToken}
                />
              </Card.List>
            </Card>
            <Button variant={"secondary"} onClick={regenerateAuthToken}>
              <RefreshCcw size={16} />
              {t(
                "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.text.regenerateAuthToken",
              )}
            </Button>
            <EmbeddedIdentityProviderSelect
              value={connectorId}
              onChange={setConnectorId}
              location="settings"
            />
          </div>
        </TabsContent>

        <TabsContent value={"group-sync"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <FolderGit2 size={16} />
                {t(
                  "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.text.synchronizeGroups",
                )}
              </div>
            </Label>
            <GroupPrefixHelpText />
          </div>
          <GroupPrefixInput value={groupPrefixes} onChange={setGroupPrefixes} />
        </TabsContent>

        <TabsContent value={"user-sync"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <UserCircle size={16} />
                {t(
                  "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.text.synchronizeUsers",
                )}
              </div>
            </Label>
            <GroupPrefixHelpText type={"user-groups"} />
          </div>
          <GroupPrefixInput
            addText={"Add user group filter"}
            text={t(
              "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.text.userGroupStartsWith",
            )}
            value={userGroupPrefixes}
            onChange={setUserGroupPrefixes}
          />
        </TabsContent>

        <TabsContent value={"danger"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <AlertOctagon size={16} />
                {t("integrations.shared:word.deleteIntegration")}
              </div>
            </Label>
            <HelpText className={"max-w-lg mt-2"}>
              {t(
                "integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.text.deletingThisIntegrationWillRemove",
              )}
            </HelpText>
          </div>
          <Button
            variant={"danger"}
            size={"xs"}
            className={"mt-3"}
            onClick={deleteIntegration}
          >
            {t("integrations.shared:word.deleteIntegration")}
          </Button>
        </TabsContent>
      </Tabs>
      <div className={"h-6"}></div>

      <ModalFooter className={"items-center gap-4"}>
        <ModalClose asChild={true}>
          <Button variant={"secondary"} className={"w-full"}>
            {t("common:word.cancel")}
          </Button>
        </ModalClose>

        <Button
          variant={"primary"}
          className={"w-full"}
          disabled={!hasChanges}
          onClick={updateIntegration}
        >
          {t("common:word.save")}
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}
