import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import Steps from "@components/Steps";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import {
  IconArrowLeft,
  IconArrowRight,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn, validator } from "@utils/helpers";
import { isEmpty } from "lodash";
import {
  Box,
  Clock4,
  ExternalLinkIcon,
  FolderGit2,
  GlobeIcon,
  KeyRound,
  PlusCircle,
  RefreshCcw,
  Repeat,
  Settings2,
  Shield,
  ShieldCheckIcon,
} from "lucide-react";
import React, { useMemo, useReducer, useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/fleetdm.png";
import HelpText from "@/components/HelpText";
import { PeerGroupSelector } from "@/components/PeerGroupSelector";
import { t } from "@/i18n";
import { Account } from "@/interfaces/Account";
import {
  DEFAULT_FLEETDM_MATCH_ATTRIBUTES,
  FleetDMIntegration,
} from "@/interfaces/EDR";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import { matchAttributesReducer } from "@/modules/integrations/edr/fleetdm/FleetDM";
import { FleetDMMatchSettings } from "@/modules/integrations/edr/fleetdm/FleetDMMatchSettings";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  account: Account;
};

export default function FleetDMSetup({
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
  const fleetDMRequest = useApiCall<FleetDMIntegration>(
    "/integrations/edr/fleetdm",
  );

  const settingsRequest = useApiCall<Account>("/accounts/" + account.id);

  const [step, setStep] = useState(0);
  const maxSteps = 5;

  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [lastSyncedInterval, setLastSyncedInterval] = useState("24");

  const [matchAttributes, dispatchMatchAttributes] = useReducer(
    matchAttributesReducer,
    DEFAULT_FLEETDM_MATCH_ATTRIBUTES,
  );

  const [groups, setGroups, { save: saveGroups }] = useGroupHelper({
    initial: [],
  });

  const urlError = useMemo(() => {
    if (apiUrl === "") return "";
    if (!validator.isValidUrl(apiUrl)) {
      return t(
        "integrations.edr.crowd-strike-configuration:fleetDMConfiguration.text.pleaseEnterAValidUrl",
      );
    }
    return "";
  }, [apiUrl]);

  const apiTokenEntered = !isEmpty(apiToken);
  const apiUrlEntered = !isEmpty(apiUrl);
  const allEntered = apiUrlEntered && apiTokenEntered;

  const isDisabled =
    (step == 1 && (!apiUrlEntered || urlError !== "")) ||
    (step == 2 && !allEntered) ||
    (step == 3 && groups.length == 0);

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
        "integrations.edr.crowd-strike-configuration:fleetDMConfiguration.title.fleetDMIntegration",
      ),
      description: t(
        "integrations.edr.crowd-strike-configuration:fleetDMSetup.description.fleetDMWasSuccessfullyConnectedTo",
      ),
      promise: fleetDMRequest
        .post({
          api_token: apiToken,
          api_url: apiUrl,
          groups: savedGroups.map((group) => group.id) || [],
          last_synced_interval: Number(lastSyncedInterval || 24),
          match_attributes: matchAttributes,
        })
        .then(() => {
          mutate("/accounts");
          mutate("/integrations/edr/fleetdm");
          onSuccess();
        }),
      loadingMessage: t(
        "integrations.edr.crowd-strike-configuration:crowdStrikeSetup.loadingMessage.settingUpIntegration",
      ),
    });
  };

  const modalWidth = {
    0: "max-w-lg",
    1: "max-w-lg",
    2: "max-w-xl",
    3: "max-w-xl",
    4: "max-w-2xl",
    5: "max-w-lg",
  };

  return (
    <ModalContent
      maxWidthClass={cn(
        "relative",
        modalWidth[step as keyof typeof modalWidth],
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
          "integrations.edr.crowd-strike-configuration:fleetDMSetup.title.connectNetBirdWithFleetDM",
        )}
        description={t(
          "integrations.edr.crowd-strike-configuration:fleetDMSetup.description.restrictNetworkAccessToDevices",
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
              "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.ensureThatYouHaveA",
            )}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t(
                "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.fleetDMAccount",
              )}
            </span>{" "}
            {t("integrations.shared:word.withTheFollowing")}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("integrations.shared:word.permissions")}
            </span>
            .{" "}
            {t(
              "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.ifYouDonTHave",
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
                "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.aPIOnlyUserOrAdmin",
              )}
            </div>
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <Settings2 size={14} className={"text-sky-500"} />
              {t(
                "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.readAccessToHostsAnd",
              )}
            </div>
          </div>
        </div>
      )}

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <GlobeIcon size={18} />
            {t(
              "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.enterYourFleetDMServerURL",
            )}
          </p>

          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.navigateToYourFleetDMManagement",
                )}
              </p>
            </Steps.Step>

            <Steps.Step step={2} line={false}>
              <p>
                {t(
                  "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.copyYourFleetDMServerURL",
                )}
              </p>
            </Steps.Step>
          </Steps>

          <div className={"mb-4"}>
            <Input
              autoFocus={true}
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"flex items-center gap-2"}>
                  <GlobeIcon size={14} />
                </div>
              }
              placeholder={t(
                "integrations.edr.crowd-strike-configuration:fleetDMConfiguration.placeholder.httpsFleetExampleCom",
              )}
              value={apiUrl}
              error={urlError}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>
        </div>
      )}

      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Box size={20} />
            {t(
              "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.createAFleetDMAPIToken",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t(
                  "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.logInAsAnAdmin",
                )}{" "}
                <InlineLink
                  href={"https://fleetdm.com/guides/fleetctl"}
                  target={"_blank"}
                >
                  {t(
                    "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.fleetctl",
                  )}
                  <ExternalLinkIcon size={12} />
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.createAn",
                )}{" "}
                <InlineLink
                  href={
                    "https://fleetdm.com/guides/fleetctl#create-api-only-user"
                  }
                  target={"_blank"}
                >
                  {t(
                    "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.aPIOnlyUser",
                  )}
                  <ExternalLinkIcon size={12} />
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.onceCreatedPasteTheReceived",
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
                "integrations.edr.crowd-strike-configuration:fleetDMSetup.placeholder.8DD1svziNt4yFFvQ4E0ONIw8YBQ8JdHjSLEoYgQ2aYYXGMuRrqkYKTYAN0WEPYTQaqTcawT3OoFzcUqS5rFw",
              )}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </div>
        </div>
      )}

      {step == 3 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 mb-3"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <FolderGit2 size={16} />
            {t(
              "integrations.edr.crowd-strike-configuration:crowdStrikeConfiguration.text.peerApproval",
            )}
          </p>

          <HelpText className={"max-w-lg mt-2"}>
            {t(
              "integrations.edr.crowd-strike-configuration:fleetDMConfiguration.text.selectGroupsYouWantTo",
            )}
          </HelpText>

          <PeerGroupSelector
            values={groups}
            onChange={setGroups}
            showResourceCounter={false}
          />
        </div>
      )}

      {step == 4 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 mb-3"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <ShieldCheckIcon size={16} />
            {t(
              "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.complianceRequirements",
            )}
          </p>
          <p className={"mt-2 !text-nb-gray-300 !leading-[1.5]"}>
            {t(
              "integrations.edr.crowd-strike-configuration:fleetDMConfiguration.text.setTheSpecificRequirementsThat",
            )}
          </p>

          <FleetDMMatchSettings
            value={matchAttributes}
            dispatch={dispatchMatchAttributes}
          />
        </div>
      )}

      {step == 5 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 mb-3"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <RefreshCcw size={16} />
            {t(
              "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.fleetDMSyncWindow",
            )}
          </p>
          <div className={"mt-2 flex flex-row gap-3"}>
            <FullTooltip
              interactive={false}
              content={
                <div className={"max-w-xs text-xs"}>
                  {t(
                    "integrations.edr.crowd-strike-configuration:fleetDMSetup.text.exampleThisPropertyIsSet",
                  )}
                </div>
              }
            >
              <HelpText className={"max-w-lg"}>
                {t(
                  "integrations.edr.crowd-strike-configuration:fleetDMConfiguration.text.devicesNotSyncedWithFleetDM",
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
                "integrations.edr.crowd-strike-configuration:fleetDMConfiguration.customSuffix.hours",
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
                "integrations.edr.crowd-strike-configuration:crowdStrikeSetup.text.510Minutes",
              )}
            </span>
          </div>
        </div>
      )}
    </ModalContent>
  );
}
