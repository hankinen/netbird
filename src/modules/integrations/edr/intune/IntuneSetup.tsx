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
import {
  IconArrowLeft,
  IconArrowRight,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { isEmpty } from "lodash";
import {
  Box,
  Clock4,
  Folder,
  FolderGit2,
  KeyRound,
  PlusCircle,
  RefreshCcw,
  Repeat,
  Settings2,
  Shield,
} from "lucide-react";
import React, { useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/intune.png";
import FullTooltip from "@/components/FullTooltip";
import HelpText from "@/components/HelpText";
import { PeerGroupSelector } from "@/components/PeerGroupSelector";
import { t } from "@/i18n";
import { Account } from "@/interfaces/Account";
import { IntuneIntegration } from "@/interfaces/EDR";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import azureGrantAdmin from "@/modules/integrations/edr/intune/images/azure-grant-admin-conset.png";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  account: Account;
};

export default function IntuneSetup({
  open,
  onOpenChange,
  onSuccess,
  account,
}: Props) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
      <SetupContent
        account={account}
        onSuccess={() => {
          onOpenChange(false);
          onSuccess && onSuccess();
        }}
      />
    </Modal>
  );
}

type ModalProps = {
  onSuccess: () => void;
  account: Account;
};

export function SetupContent({ onSuccess, account }: Readonly<ModalProps>) {
  const { mutate } = useSWRConfig();
  const intuneRequest = useApiCall<IntuneIntegration>(
    "/integrations/edr/intune",
  );

  const settingsRequest = useApiCall<Account>("/accounts/" + account.id);

  const [step, setStep] = useState(0);
  const maxSteps = 6;

  const [clientSecret, setClientSecret] = useState("");
  const [clientId, setClientId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [lastSyncedInterval, setLastSyncedInterval] = useState("24");

  const clientSecretEntered = !isEmpty(clientSecret);
  const clientIdEntered = !isEmpty(clientId);
  const tenantIdEntered = !isEmpty(tenantId);

  const [groups, setGroups, { save: saveGroups }] = useGroupHelper({
    initial: [],
  });

  const allEntered = clientIdEntered && tenantIdEntered && clientSecretEntered;

  const isDisabled =
    (step == 3 && !clientSecretEntered) ||
    (step == 4 && !allEntered) ||
    (step == 5 && groups.length == 0);

  const connect = async () => {
    await settingsRequest.put({
      id: account.id,
      settings: {
        ...account.settings,
        peer_login_expiration_enabled:
          account?.settings?.peer_login_expiration_enabled,
        peer_login_expiration: account?.settings?.peer_login_expiration,
        extra: {
          ...account.settings?.extra,
          peer_approval_enabled: false,
        },
      },
    });

    const savedGroups = await saveGroups();

    notify({
      title: t(
        "integrations.edr.huntress-match-settings:intuneConfiguration.title.intuneIntegration",
      ),
      description: t(
        "integrations.edr.huntress-match-settings:intuneSetup.description.intuneWasSuccessfullyConnectedTo",
      ),
      promise: intuneRequest
        .post({
          secret: clientSecret,
          client_id: clientId,
          tenant_id: tenantId,
          groups: savedGroups.map((group) => group.id) || [],
          last_synced_interval: Number(lastSyncedInterval || 24),
        })
        .then(() => {
          mutate("/accounts");
          mutate("/integrations/edr/intune");
          onSuccess();
        }),
      loadingMessage: t(
        "integrations.edr.huntress-match-settings:huntressSetup.loadingMessage.settingUpIntegration",
      ),
    });
  };

  return (
    <ModalContent
      maxWidthClass={cn("relative", step == 0 ? "max-w-md" : "max-w-xl")}
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
          "integrations.edr.huntress-match-settings:intuneSetup.title.connectNetBirdWithIntune",
        )}
        description={t(
          "integrations.edr.huntress-match-settings:intuneSetup.description.restrictNetworkAccessToIT",
        )}
      />

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
              "integrations.edr.huntress-match-settings:huntressSetup.text.ensureThatYouHaveAn",
            )}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t(
                "integrations.edr.huntress-match-settings:intuneSetup.text.azureADUserAccount",
              )}
            </span>{" "}
            {t("integrations.shared:word.withTheFollowing")}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("integrations.shared:word.permissions")}
            </span>
            .{" "}
            {t(
              "integrations.edr.huntress-match-settings:intuneSetup.text.ifYouDonTHave",
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
                "integrations.edr.huntress-match-settings:intuneSetup.text.createAzureADApplications",
              )}
            </div>
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <Settings2 size={14} className={"text-sky-500"} />
              {t(
                "integrations.edr.huntress-match-settings:intuneSetup.text.manageAzureADApplications",
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
              "integrations.edr.huntress-match-settings:intuneSetup.text.createAndConfigureAzureAD",
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
                    "integrations.edr.huntress-match-settings:intuneSetup.text.azureActiveDirectory",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>App Registrations</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.inTheLeftMenuThen",
                )}{" "}
                <Mark>+ New registration</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.buttonToCreateANew",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.fillInTheFormWith",
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
                  "integrations.edr.huntress-match-settings:intuneSetup.label.accountTypes",
                ),
                value:
                  "Accounts in this organizational directory only (Default Directory only - Single tenant)",
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
              "integrations.edr.huntress-match-settings:intuneSetup.text.addAPIPermissions",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>API permissions</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.onTheLeftSideMenu",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>Add a permission</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.then",
                )}{" "}
                <Mark>Microsoft Graph</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.andThenOnThe",
                )}{" "}
                <Mark>Application permissions</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.tab",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t(
                  "integrations.edr.huntress-match-settings:setup.text.inStep",
                )}{" "}
                <Mark>Select permissions</Mark>{" "}
                {t("integrations.shared:word.select")}{" "}
                <Mark>DeviceManagementManagedDevices.Read.All</Mark>{" "}
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
              "integrations.edr.huntress-match-settings:intuneSetup.text.generateClientSecret",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("integrations.shared:word.navigateTo")}{" "}
                <Mark>Certificates & secrets</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.onLeftSideMenu",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.clickOn",
                )}{" "}
                <Mark>+ New client secret</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("common:word.add")} <Mark copy>NetBird</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.asTheDescriptionAndClick",
                )}{" "}
                <Mark>Add</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={4} line={false}>
              <p className={"font-normal"}>
                {t("common:word.copyThe")} <Mark>Value</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.andPasteItHere",
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
                "integrations.edr.huntress-match-settings:intuneConfiguration.placeholder.ydV7QJJ62XlLvYoBanxZR2sJA2va3UbqvncY8",
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
              "integrations.edr.huntress-match-settings:intuneSetup.text.enterApplicationIDAndDirectory",
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
                    "integrations.edr.huntress-match-settings:intuneSetup.text.allApplications",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.select",
                )}{" "}
                <Mark>NetBird</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:intuneSetup.text.applicationInOverviewPageAnd",
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
                    "integrations.edr.huntress-match-settings:intuneConfiguration.text.applicationClientID",
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
                    "integrations.edr.huntress-match-settings:intuneConfiguration.text.directoryTenantID",
                  )}
                </div>
              }
              placeholder={t(
                "integrations.edr.huntress-match-settings:intuneConfiguration.placeholder.5d60468a65b745ebA61a53ecfbcd1ea3",
              )}
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            />
          </div>
        </div>
      )}

      {step == 5 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 mb-3"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <FolderGit2 size={16} />
            {t(
              "integrations.edr.huntress-match-settings:huntressSetup.text.peerApproval",
            )}
          </p>

          <HelpText className={"max-w-lg mt-2"}>
            {t(
              "integrations.edr.huntress-match-settings:intuneConfiguration.text.selectGroupsYouWantTo",
            )}
          </HelpText>

          <PeerGroupSelector values={groups} onChange={setGroups} />
        </div>
      )}

      {step == 6 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 mb-3"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <RefreshCcw size={16} />
            {t(
              "integrations.edr.huntress-match-settings:intuneConfiguration.text.intuneSyncWindow",
            )}
          </p>
          <div className={"mt-2 flex flex-row gap-3"}>
            <FullTooltip
              interactive={false}
              content={
                <div className={"max-w-xs text-xs"}>
                  {t(
                    "integrations.edr.huntress-match-settings:intuneConfiguration.text.exampleThisPropertyIsSet",
                  )}
                </div>
              }
            >
              <HelpText className={"max-w-lg"}>
                {t(
                  "integrations.edr.huntress-match-settings:intuneConfiguration.text.devicesNotSyncedWithIntune",
                )}
                <IconInfoCircle
                  size={14}
                  className={"relative inline ml-1 -top-[1px]"}
                />
              </HelpText>
            </FullTooltip>
            <Input
              placeholder={"24"}
              min={24}
              max={336}
              className={"w-full min-w-[130px]"}
              value={lastSyncedInterval}
              type={"number"}
              onChange={(e) => setLastSyncedInterval(e.target.value)}
              customSuffix={t(
                "integrations.edr.huntress-match-settings:huntressSetup.customSuffix.hours",
              )}
            />
          </div>
        </div>
      )}

      <ModalFooter className={"items-center gap-4"}>
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
      {step == 0 && (
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
                "integrations.edr.huntress-match-settings:huntressSetup.text.1020Minutes",
              )}
            </span>
          </div>
        </div>
      )}
    </ModalContent>
  );
}
