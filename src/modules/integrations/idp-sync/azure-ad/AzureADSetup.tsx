import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import Steps from "@components/Steps";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Lightbox } from "@components/ui/Lightbox";
import { Mark } from "@components/ui/Mark";
import { MinimalList } from "@components/ui/MinimalList";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { isEmpty, trim } from "lodash";
import {
  Box,
  Clock4,
  Folder,
  FolderGit2,
  KeyRound,
  PlusCircle,
  Repeat,
  Settings2,
  Shield,
  UserCircle,
} from "lucide-react";
import React, { useState } from "react";
import { useEmbeddedIdentityProviders } from "@/hooks/useEmbeddedIdentityProviders";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/entra-id.png";
import { AzureADIntegration } from "@/interfaces/IdentityProvider";
import azureGrantAdmin from "@/modules/integrations/idp-sync/azure-ad/images/azure-grant-admin-conset.png";
import { EmbeddedIdentityProviderSelect } from "@/modules/integrations/idp-sync/EmbeddedIdentityProviderSelect";
import { GroupPrefixHelpText } from "@/modules/integrations/idp-sync/GroupPrefixHelpText";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
import { GroupPrefixInput } from "../GroupPrefixInput";

import { t } from "@/i18n";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function AzureADSetup({ open, onOpenChange, onSuccess }: Props) {
  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
        <SetupContent
          onSuccess={() => {
            onOpenChange(false);
            onSuccess && onSuccess();
          }}
        />
      </Modal>
    </>
  );
}

type ModalProps = {
  onSuccess: () => void;
};

export function SetupContent({ onSuccess }: ModalProps) {
  const { mutate } = useSWRConfig();
  const azureRequest = useApiCall<AzureADIntegration>(
    "/integrations/azure-idp",
  );

  const { isEmbeddedIdPEnabled } = useEmbeddedIdentityProviders();
  const [step, setStep] = useState(isEmbeddedIdPEnabled ? -1 : 0);
  const maxSteps = 6;

  const [clientSecret, setClientSecret] = useState("");
  const [clientId, setClientId] = useState("");
  const [tenantId, setTenantId] = useState("");

  const clientSecretEntered = !isEmpty(clientSecret);
  const clientIdEntered = !isEmpty(clientId);
  const tenantIdEntered = !isEmpty(tenantId);

  const allEntered = clientIdEntered && tenantIdEntered && clientSecretEntered;

  const isDisabled =
    (step == 3 && !clientSecretEntered) ||
    (step == 4 && (!clientIdEntered || !tenantIdEntered)) ||
    (step == maxSteps && !allEntered);

  const [connectorId, setConnectorId] = useState("");
  const [groupPrefixes, setGroupPrefixes] = useState<string[]>([]);
  const [userGroupPrefixes, setUserGroupPrefixes] = useState<string[]>([]);

  const connect = async () => {
    notify({
      title: t(
        "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.title.entraIDIntegration",
      ),
      description: t(
        "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.description.entraIDWasSuccessfullyConnected",
      ),
      promise: azureRequest
        .post({
          client_secret: btoa(clientSecret), // Encode client secret to base64
          client_id: clientId,
          tenant_id: tenantId,
          group_prefixes: groupPrefixes
            ? groupPrefixes.filter((prefix) => trim(prefix) !== "")
            : [],
          user_group_prefixes: userGroupPrefixes
            ? userGroupPrefixes.filter((prefix) => trim(prefix) !== "")
            : [],
          ...(connectorId ? { connector_id: connectorId } : {}),
        })
        .then(() => {
          mutate("/integrations/azure-idp");
          onSuccess();
        }),
      loadingMessage: t(
        "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.loadingMessage.settingUpIntegration",
      ),
    });
  };

  return (
    <ModalContent
      maxWidthClass={cn(
        "relative",
        step == 0 ? "max-w-md" : "max-w-xl",
        step === -1 && "max-w-lg",
      )}
      showClose={true}
      className={""}
      onEscapeKeyDown={(e) => step > 0 && e.preventDefault()}
      onInteractOutside={(e) => step > 0 && e.preventDefault()}
      onPointerDownOutside={(e) => step > 0 && e.preventDefault()}
    >
      <GradientFadedBackground />

      {step > 0 && (
        <div className={"flex gap-2 w-full items-center justify-center mb-4"}>
          {Array.from({ length: maxSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-8 h-1 rounded-full bg-nb-gray-800",
                step >= index + 1 && "bg-netbird",
              )}
            />
          ))}
        </div>
      )}

      <IntegrationModalHeader
        image={integrationImage}
        title={t(
          "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.title.connectNetBirdWithEntraID",
        )}
        description={t(
          "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.description.startSyncingYourUsersAnd",
        )}
      />

      {step === -1 && (
        <EmbeddedIdentityProviderSelect
          value={connectorId}
          onChange={setConnectorId}
          location="setup"
          filterByType={["entra"]}
        />
      )}

      {step == 0 && (
        <div
          className={
            "px-8 py-3 flex z-0 flex-col gap-0 text-sm mb-3 text-center justify-center items-center"
          }
        >
          <div
            className={
              "mt-6 text-base font-medium text-nb-gray-100 flex gap-2 items-center justify-center"
            }
          >
            <Shield size={16} />
            {t("integrations.shared:word.requiredPermissions")}
          </div>
          <p className={"mt-2 !text-nb-gray-300 !leading-[1.5]"}>
            {t(
              "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.ensureThatYouHaveAn",
            )}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t(
                "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.azureADUserAccount",
              )}
            </span>{" "}
            {t("integrations.shared:word.withTheFollowing")}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("integrations.shared:word.permissions")}
            </span>
            .{" "}
            {t(
              "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.ifYouDonTHave",
            )}
          </p>
          <div
            className={
              "flex items-center flex-col gap-0 mt-2 w-full justify-center max-w-lg"
            }
          >
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <PlusCircle size={14} className={"text-sky-500"} />
              {t(
                "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.createAzureADApplications",
              )}
            </div>
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <Settings2 size={14} className={"text-sky-500"} />
              {t(
                "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.manageAzureADApplications",
              )}
            </div>
          </div>
        </div>
      )}

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Box size={20} />
            {t(
              "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.createAndConfigureAzureAD",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t("integrations.shared:word.navigateTo")}
                {"  "}
                <InlineLink
                  className={"inline"}
                  target={"_blank"}
                  href={
                    "https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview"
                  }
                >
                  {t(
                    "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.azureActiveDirectory",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>App Registrations</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.inTheLeftMenuThen",
                )}{" "}
                <Mark>+ New registration</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.buttonToCreateANew",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.fillInTheFormWith",
                )}{" "}
                <Mark>Register</Mark>
              </p>
            </Steps.Step>
          </Steps>

          <MinimalList
            data={[
              {
                label: t("common:word.name"),
                value: "NetBird",
              },
              {
                label: t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.label.accountTypes",
                ),
                value:
                  "Accounts in this organizational directory only (Default Directory only - Single tenant)",
              },
              {
                label: t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.label.redirectType",
                ),
                value: "Single-page application (SPA)",
              },
              {
                label: t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.label.redirectURI",
                ),
                value: "https://app.netbird.io/silent-auth",
              },
            ]}
          />
        </div>
      )}

      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Shield size={20} />
            {t(
              "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.addAPIPermissions",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>API permissions</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.onTheLeftSideMenu",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>Add a permission</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.then",
                )}{" "}
                <Mark>Microsoft Graph</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.andThenOnThe",
                )}{" "}
                <Mark>Application permissions</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.tab",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:setup.text.inStep",
                )}{" "}
                <Mark>Select permissions</Mark>{" "}
                {t("integrations.shared:word.select")}{" "}
                <Mark>User.Read.All</Mark> {t("common:word.and")}{" "}
                <Mark>Group.Read.All</Mark>{" "}
                {t("integrations.shared:word.andClick")}{" "}
                <Mark>Add permissions</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={4} line={false}>
              <p className={"font-normal"}>
                {t("common:word.click")}{" "}
                <Mark>Grant admin consent for Default Directory</Mark>{" "}
                {t("integrations.shared:word.andClick")} <Mark>Yes</Mark>
              </p>
              <Lightbox image={azureGrantAdmin} />
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 3 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <KeyRound size={20} />
            {t(
              "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.generateClientSecret",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("integrations.shared:word.navigateTo")}{" "}
                <Mark>Certificates & secrets</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.onLeftSideMenu",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.clickOn",
                )}{" "}
                <Mark>+ New client secret</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("common:word.add")} <Mark copy>NetBird</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.asTheDescriptionAndClick",
                )}{" "}
                <Mark>Add</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={4} line={false}>
              <p className={"font-normal"}>
                {t("common:word.copyThe")} <Mark>Value</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.andPasteItHere",
                )}
              </p>
            </Steps.Step>
          </Steps>
          <div className={"mb-4"}>
            <Input
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"flex items-center gap-2"}>
                  <KeyRound size={16} className={"text-nb-gray-300"} />
                </div>
              }
              placeholder={t(
                "integrations.idp-sync.embedded-identity-provider-select:azureADConfiguration.placeholder.ydV7QJJ62XlLvYoBanxZR2sJA2va3UbqvncY8",
              )}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
          </div>
        </div>
      )}

      {step == 4 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Box size={20} />
            {t(
              "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.enterApplicationIDAndDirectory",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("integrations.shared:word.navigateTo")}{" "}
                <InlineLink
                  target={"_blank"}
                  className={"inline"}
                  href={
                    "https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps"
                  }
                >
                  {t(
                    "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.allApplications",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.select",
                )}{" "}
                <Mark>NetBird</Mark>{" "}
                {t(
                  "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.applicationInOverviewPageAnd",
                )}{" "}
                <Mark>Application (client) ID</Mark> {t("common:word.and")}{" "}
                <Mark>Directory (tenant) ID</Mark>
              </p>
            </Steps.Step>
          </Steps>
          <div className={"mb-4 flex flex-col gap-3"}>
            <Input
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"min-w-[165px] flex gap-2 items-center"}>
                  <Box size={16} />
                  {t(
                    "integrations.idp-sync.embedded-identity-provider-select:azureADConfiguration.text.applicationClientID",
                  )}
                </div>
              }
              placeholder={"62d3a656-c87d-4f30-a242-5b6347e29e9f"}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <Input
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"min-w-[165px] flex gap-2 items-center"}>
                  <Folder size={16} />
                  {t(
                    "integrations.idp-sync.embedded-identity-provider-select:azureADConfiguration.text.directoryTenantID",
                  )}
                </div>
              }
              placeholder={t(
                "integrations.idp-sync.embedded-identity-provider-select:azureADConfiguration.placeholder.5d60468a65b745ebA61a53ecfbcd1ea3",
              )}
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            />
          </div>
        </div>
      )}

      {step == 5 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <FolderGit2 size={20} />
            {t(
              "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.groupsToBeSynchronized",
            )}
          </p>

          <div className={"mb-4 flex flex-col gap-1"}>
            <div>
              <GroupPrefixHelpText />
            </div>
            <GroupPrefixInput
              value={groupPrefixes}
              onChange={setGroupPrefixes}
            />
          </div>
        </div>
      )}

      {step == 6 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <UserCircle size={18} />
            {t(
              "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.usersToBeSynchronized",
            )}
          </p>

          <div className={"mb-4 flex flex-col gap-1"}>
            <div>
              <GroupPrefixHelpText type={"user-groups"} />
            </div>

            <GroupPrefixInput
              addText={"Add user group filter"}
              text={t(
                "integrations.idp-sync.embedded-identity-provider-select:azureADConfiguration.text.userGroupStartsWith",
              )}
              value={userGroupPrefixes}
              onChange={setUserGroupPrefixes}
            />
          </div>
        </div>
      )}

      <ModalFooter className={"items-center gap-4"}>
        {step === -1 && (
          <Button
            variant={"primary"}
            className={"w-full"}
            onClick={() => setStep(step + 1)}
            disabled={!connectorId || connectorId === ""}
          >
            {t("common:word.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step > 0 && (
          <Button
            variant={"secondary"}
            className={"w-full"}
            onClick={() => setStep(step - 1)}
          >
            <IconArrowLeft size={16} />
            {t("common:word.back")}
          </Button>
        )}
        {step >= 0 && step < maxSteps && (
          <Button
            variant={"primary"}
            className={"w-full"}
            disabled={isDisabled}
            onClick={() => setStep(step + 1)}
          >
            {step == 0
              ? t("integrations.shared:word.getStarted")
              : t("common:word.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step == maxSteps && (
          <Button
            variant={"primary"}
            className={"w-full"}
            disabled={isDisabled}
            onClick={connect}
          >
            <Repeat size={16} />
            {t("common:word.connect")}
          </Button>
        )}
      </ModalFooter>
      {(step == 0 || step == -1) && (
        <div
          className={
            "text-center z-0 mt-2.5 text-xs text-nb-gray-300 flex items-center justify-center gap-2 font-normal"
          }
        >
          <Clock4 size={12} />
          <div>
            {t("integrations.shared:word.estimatedSetupTime")}
            <span className={"font-medium"}>
              {" "}
              {t(
                "integrations.idp-sync.embedded-identity-provider-select:azureADSetup.text.1020Minutes",
              )}
            </span>
          </div>
        </div>
      )}
    </ModalContent>
  );
}
