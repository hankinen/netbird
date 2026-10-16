import Button from "@components/Button";
import { Checkbox } from "@components/Checkbox";
import FullTooltip from "@components/FullTooltip";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import { SelectDropdown } from "@components/select/SelectDropdown";
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
  Clock4,
  ExternalLinkIcon,
  FolderGit2,
  KeyRound,
  PlusCircle,
  RefreshCcw,
  Repeat,
  Settings2,
  Shield,
  ShieldCheckIcon,
} from "lucide-react";
import React, { useReducer, useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/huntress.png";
import HelpText from "@/components/HelpText";
import { PeerGroupSelector } from "@/components/PeerGroupSelector";
import { Account } from "@/interfaces/Account";
import {
  DEFAULT_HUNTRESS_MATCH_ATTRIBUTES,
  HuntressIntegration,
} from "@/interfaces/EDR";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import {
  HUNTRESS_DOCUMENTATION_URL,
  matchAttributesReducer,
} from "@/modules/integrations/edr/huntress/Huntress";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
import { HuntressMatchSettings } from "@/modules/integrations/edr/huntress/HuntressMatchSettings";

import { t } from "@/i18n";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  account: Account;
};

export default function HuntressSetup({
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
  const huntressRequest = useApiCall<HuntressIntegration>(
    "/integrations/edr/huntress",
  );

  const settingsRequest = useApiCall<Account>("/accounts/" + account.id);

  const [step, setStep] = useState(0);
  const maxSteps = 4;

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [lastSyncedInterval, setLastSyncedInterval] = useState("24");

  const [matchAttributes, dispatchMatchAttributes] = useReducer(
    matchAttributesReducer,
    DEFAULT_HUNTRESS_MATCH_ATTRIBUTES,
  );

  const [groups, setGroups, { save: saveGroups }] = useGroupHelper({
    initial: [],
  });

  const apiSecretEntered = !isEmpty(apiSecret);
  const apiKeyEntered = !isEmpty(apiKey);
  const allEntered = apiKeyEntered && apiSecretEntered;

  const isDisabled =
    (step === 1 && !allEntered) || (step === 2 && groups.length === 0);

  const connect = async () => {
    await settingsRequest.put({
      id: account.id,
      settings: {
        ...account.settings,
        extra: {
          ...account.settings?.extra,
          peer_approval_enabled: false,
        },
      },
    });

    const savedGroups = await saveGroups();

    notify({
      title: t(
        "integrations.edr.huntress-match-settings:huntressSetup.title.huntressIntegration",
      ),
      description: t(
        "integrations.edr.huntress-match-settings:huntressSetup.description.huntressWasSuccessfullyConnectedTo",
      ),
      promise: huntressRequest
        .post({
          api_key: apiKey,
          api_secret: apiSecret,
          groups: savedGroups.map((group) => group.id) || [],
          last_synced_interval: Number(lastSyncedInterval || 24),
          match_attributes: matchAttributes,
        })
        .then(() => {
          mutate("/accounts");
          mutate("/integrations/edr/huntress");
          onSuccess();
        }),
      loadingMessage: t(
        "integrations.edr.huntress-match-settings:huntressSetup.loadingMessage.settingUpIntegration",
      ),
    });
  };

  const modalWidth = {
    0: "max-w-lg",
    1: "max-w-lg",
    2: "max-w-xl",
    3: "max-w-xl",
    4: "max-w-xl",
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
          "integrations.edr.huntress-match-settings:huntressSetup.title.connectNetBirdWithHuntress",
        )}
        description={t(
          "integrations.edr.huntress-match-settings:huntressSetup.description.restrictNetworkAccessToDevices",
        )}
      />

      {step === 0 && (
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
                "integrations.edr.huntress-match-settings:huntressSetup.text.huntressAccount",
              )}
            </span>{" "}
            {t("integrations.shared:word.withTheFollowing")}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("integrations.shared:word.permissions")}
            </span>
            .{" "}
            {t(
              "integrations.edr.huntress-match-settings:huntressSetup.text.ifYouDonTHave",
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
                "integrations.edr.huntress-match-settings:huntressSetup.text.createAPIKeys",
              )}
            </div>
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <Settings2 size={14} className={"text-sky-500"} />
              {t(
                "integrations.edr.huntress-match-settings:huntressSetup.text.manageAPIKeys",
              )}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <KeyRound size={18} />
            {t(
              "integrations.edr.huntress-match-settings:huntressSetup.text.getHuntressAPICredentials",
            )}
          </p>

          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.edr.huntress-match-settings:huntressSetup.text.navigateToYour",
                )}{" "}
                <InlineLink
                  className={"inline"}
                  target={"_blank"}
                  href={"https://huntress.io/login"}
                >
                  {t(
                    "integrations.edr.huntress-match-settings:huntressSetup.text.huntressManagementConsole",
                  )}
                </InlineLink>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:huntressSetup.text.thenOpenTheMenuAt",
                )}{" "}
                <Mark>API Credentials</Mark>
              </p>
            </Steps.Step>

            <Steps.Step step={2}>
              <p>
                {t(
                  "integrations.edr.huntress-match-settings:huntressSetup.text.underUserAPICredentialsClick",
                )}{" "}
                <Mark>+ Add</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:huntressSetup.text.thenSelectYourUserAnd",
                )}
                <Mark copy={true}>NetBird</Mark>{" "}
                {t(
                  "integrations.edr.huntress-match-settings:huntressSetup.text.asTheDescription",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p>
                {t(
                  "integrations.edr.huntress-match-settings:huntressSetup.text.enterYourAPICredentials",
                )}
              </p>
            </Steps.Step>
          </Steps>
          <div className={"mb-4 flex-col gap-4 flex"}>
            <Input
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"min-w-[80px]"}>
                  {t(
                    "integrations.edr.huntress-match-settings:huntressSetup.text.aPIKey",
                  )}
                </div>
              }
              placeholder={t(
                "integrations.edr.huntress-match-settings:huntressSetup.placeholder.hk30813a372c41f72f1892",
              )}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Input
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"min-w-[80px]"}>
                  {t(
                    "integrations.edr.huntress-match-settings:huntressSetup.text.aPISecret",
                  )}
                </div>
              }
              placeholder={t(
                "integrations.edr.huntress-match-settings:huntressSetup.placeholder.hs3b80d8e463aeb037ac211fafb7fc59c1",
              )}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 mb-3"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <FolderGit2 size={16} />
            {t(
              "integrations.edr.huntress-match-settings:huntressSetup.text.peerApproval",
            )}
          </p>

          <HelpText className={"max-w-lg mt-2"}>
            {t(
              "integrations.edr.huntress-match-settings:huntressSetup.text.selectGroupsYouWantTo",
            )}
          </HelpText>

          <PeerGroupSelector values={groups} onChange={setGroups} />
        </div>
      )}

      {step === 3 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 mb-3"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <ShieldCheckIcon size={16} />
            {t(
              "integrations.edr.huntress-match-settings:huntressSetup.text.complianceRequirements",
            )}
          </p>
          <p className={"mt-2 !text-nb-gray-300 !leading-[1.5]"}>
            {t(
              "integrations.edr.huntress-match-settings:huntressSetup.text.setTheSpecificRequirementsThat",
            )}{" "}
            <InlineLink href={HUNTRESS_DOCUMENTATION_URL} target={"_blank"}>
              {t(
                "integrations.edr.huntress-match-settings:huntressSetup.text.huntressDocumentation",
              )}
              <ExternalLinkIcon size={12} />
            </InlineLink>{" "}
            {t(
              "integrations.edr.huntress-match-settings:huntressSetup.text.aboutTheDifferentStatuses",
            )}
          </p>

          <HuntressMatchSettings
            value={matchAttributes}
            dispatch={dispatchMatchAttributes}
          />
        </div>
      )}

      {step === 4 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 mb-3"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <RefreshCcw size={16} />
            {t(
              "integrations.edr.huntress-match-settings:huntressSetup.text.huntressSyncWindow",
            )}
          </p>
          <div className={"mt-2 flex flex-row gap-3"}>
            <FullTooltip
              interactive={false}
              content={
                <div className={"max-w-xs text-xs"}>
                  {t(
                    "integrations.edr.huntress-match-settings:huntressSetup.text.exampleThisPropertyIsSet",
                  )}
                </div>
              }
            >
              <HelpText className={"max-w-lg"}>
                {t(
                  "integrations.edr.huntress-match-settings:huntressSetup.text.devicesNotSyncedWithHuntress",
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
            {step === 0
              ? t("integrations.shared:word.getStarted")
              : t("common:word.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step === maxSteps && (
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
      {step === 0 && (
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
