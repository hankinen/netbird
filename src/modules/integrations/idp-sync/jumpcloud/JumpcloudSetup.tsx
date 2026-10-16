import Button from "@components/Button";
import { Callout } from "@components/Callout";
import InlineLink from "@components/InlineLink";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import Steps from "@components/Steps";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Mark } from "@components/ui/Mark";
import { MinimalList } from "@components/ui/MinimalList";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { isEmpty, trim } from "lodash";
import {
  BoxIcon,
  Clock4,
  ExternalLinkIcon,
  FolderGit2,
  Shield,
  ShieldUser,
  UserCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useEmbeddedIdentityProviders } from "@/hooks/useEmbeddedIdentityProviders";
import Skeleton from "react-loading-skeleton";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/jumpcloud.png";
import {
  IdentityProvider,
  ScimIntegration,
} from "@/interfaces/IdentityProvider";
import { EmbeddedIdentityProviderSelect } from "@/modules/integrations/idp-sync/EmbeddedIdentityProviderSelect";
import { GroupPrefixHelpText } from "@/modules/integrations/idp-sync/GroupPrefixHelpText";
import { GroupPrefixInput } from "@/modules/integrations/idp-sync/GroupPrefixInput";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
import { useSSOConnections } from "@/modules/integrations/sso/useSSOConnections";
import { isAuth0 } from "@utils/netbird";

import { t } from "@/i18n";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function JumpcloudSetup({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {open && (
        <SetupContent
          onSuccess={() => {
            onOpenChange(false);
            onSuccess && onSuccess();
          }}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Modal>
  );
}

type ModalProps = {
  onSuccess: () => void;
  onClose: () => void;
};

const maxWidthClasses = ["max-w-lg", "max-w-xl", "max-w-xl", "max-w-2xl"];

export function SetupContent({ onSuccess, onClose }: ModalProps) {
  const { isEmbeddedIdPEnabled } = useEmbeddedIdentityProviders();
  const [step, setStep] = useState(isEmbeddedIdPEnabled ? -1 : 0);
  const [authToken, setAuthToken] = useState("");
  const { mutate } = useSWRConfig();
  const [connectorId, setConnectorId] = useState("");
  const [groupPrefixes, setGroupPrefixes] = useState<string[]>([]);
  const [userGroupPrefixes, setUserGroupPrefixes] = useState<string[]>([]);
  const maxSteps = 3;
  const [integrationId, setIntegrationId] = useState("");
  const { jumpCloudConnection, isSSOLoading } = useSSOConnections();

  const integrations = useApiCall<ScimIntegration[]>(
    "/integrations/scim-idp",
    true,
  );

  const integrationRequest = useApiCall<ScimIntegration>(
    "/integrations/scim-idp",
    true,
  );

  const finishSetup = async () => {
    if (integrationId === "") {
      onClose();
      return;
    }
    notify({
      title: t("integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.title.jumpcloudIntegration"),
      description: t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.description.jumpcloudWasSuccessfullySetUp"),
      promise: integrationRequest
        .put(
          {
            group_prefixes: groupPrefixes
              ? groupPrefixes.filter((prefix) => trim(prefix) !== "")
              : [],
            user_group_prefixes: userGroupPrefixes
              ? userGroupPrefixes.filter((prefix) => trim(prefix) !== "")
              : [],
            provider: IdentityProvider.JUMPCLOUD,
          },
          `/${integrationId}`,
        )
        .then(() => {
          mutate("/integrations/scim-idp");
          onSuccess();
        }),
      loadingMessage: t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.loadingMessage.settingUpIntegration"),
    });
  };

  useEffect(() => {
    const getAuthToken = async () => {
      if (!jumpCloudConnection && isAuth0()) return;
      const integrationList = await integrations.get();
      const jumpcloudIntegration = integrationList?.find(
        (item) => item.provider === IdentityProvider.JUMPCLOUD,
      );

      if (!isEmpty(jumpcloudIntegration)) {
        const id = jumpcloudIntegration.id;
        if (authToken != "") return authToken;
        const res = await integrationRequest.post({}, `/${id}/token`);
        if (!res) return "";
        setIntegrationId(id);
        return res.auth_token;
      } else {
        const res = await integrationRequest.post({
          prefix: isAuth0()
            ? `${jumpCloudConnection?.strategy}|${jumpCloudConnection?.name}`
            : undefined,
          provider: IdentityProvider.JUMPCLOUD,
          group_prefixes: groupPrefixes
            ? groupPrefixes.filter((prefix) => trim(prefix) !== "")
            : [],
          user_group_prefixes: userGroupPrefixes
            ? userGroupPrefixes.filter((prefix) => trim(prefix) !== "")
            : [],
          ...(connectorId ? { connector_id: connectorId } : {}),
        });
        if (!res) return "";
        setIntegrationId(res.id);
        return res.auth_token;
      }
    };

    if (step === 3 && authToken === "") {
      getAuthToken().then((token) => {
        if (token !== undefined && token !== "") setAuthToken(token);
      });
    }
  }, [step, authToken, jumpCloudConnection, groupPrefixes, userGroupPrefixes]);

  return (
    <ModalContent
      maxWidthClass={cn("relative", step === -1 ? "max-w-lg" : maxWidthClasses[step])}
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
        title={t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.title.connectNetBirdWithJumpcloud")}
        description={t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.description.startSyncingYourUsersAnd")}
      />

      {step === -1 && (
        <EmbeddedIdentityProviderSelect
          value={connectorId}
          onChange={setConnectorId}
          location="setup"
        />
      )}

      {step == 0 && (
        <div
          className={
            "px-8 py-3 flex z-0 flex-col gap-0 text-sm mb-3 text-center justify-center items-center"
          }
        >
          {jumpCloudConnection || !isAuth0() ? (
            <>
              <div
                className={
                  "mt-6 text-base font-medium text-nb-gray-100 flex gap-2 items-center justify-center"
                }
              >
                <Shield size={16} />
                {t("integrations.shared:word.requiredPermissions")}
              </div>
              <p className={"mt-2 !text-nb-gray-300 !leading-[1.5]"}>
                {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.ensureThatYouHaveAn")}{" "}
                <span className={"text-nb-gray-100 font-semibold"}>
                  {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.jumpcloudUserAccount")}
                </span>{" "}
                {t("integrations.shared:word.withTheFollowing")}{" "}
                <span className={"text-nb-gray-100 font-semibold"}>{t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.roles")}</span>.{" "}
                {
                  t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.theseRolesHaveTheRequired")
                }
              </p>
              <div
                className={
                  "flex flex-col gap-0 mt-2 justify-start items-start max-w-lg"
                }
              >
                <div
                  className={
                    "py-2 px-6 inline-flex items-center gap-2 rounded-md justify-start bg-nb-gray-930/0 text-nb-gray-200"
                  }
                >
                  <ShieldUser size={14} className={"text-sky-500"} />
                  {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.administratorMinimumRequired")}
                </div>
                <div
                  className={
                    "py-2 px-6 inline-flex items-center gap-2 rounded-md justify-start bg-nb-gray-930/0 text-nb-gray-200"
                  }
                >
                  <ShieldUser size={14} className={"text-sky-500"} />
                  {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.administratorWithBilling")}
                </div>
              </div>
            </>
          ) : isSSOLoading ? (
            <div className={"flex w-full mt-3"}>
              <Skeleton
                height={67}
                width={"100%"}
                containerClassName={"flex-1"}
              />
            </div>
          ) : (
            <Callout className={"max-w-xl mt-3 text-left"} variant={"warning"}>
              <span>
                {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.jumpcloudSSONeedsToBe")}{" "}
                <InlineLink
                  href={
                    "https://docs.netbird.io/how-to/single-sign-on#jump-cloud"
                  }
                  target={"_blank"}
                >
                  {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.howToEnableJumpcloudSSO")}
                  <ExternalLinkIcon size={12} />
                </InlineLink>
              </span>
            </Callout>
          )}
        </div>
      )}

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <FolderGit2 size={20} />
            {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.groupsToBeSynchronized")}
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

      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <UserCircle size={18} />
            {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.usersToBeSynchronized")}
          </p>

          <div className={"mb-4 flex flex-col gap-1"}>
            <div>
              <GroupPrefixHelpText type={"user-groups"} />
            </div>

            <GroupPrefixInput
              addText={"Add user group filter"}
              text={t("integrations.idp-sync.jumpcloud-configuration:jumpcloudConfiguration.text.userGroupStartsWith")}
              value={userGroupPrefixes}
              onChange={setUserGroupPrefixes}
            />
          </div>
        </div>
      )}

      {step == 3 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <BoxIcon size={20} />
            {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.configureSCIMApplication")}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.navigateToYour")}{" "}
                <InlineLink
                  className={"inline"}
                  target={"_blank"}
                  href={"https://console.jumpcloud.com/"}
                >
                  {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.jumpcloudAdminConsole")}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.goTo")}{" "}<Mark>SSO Applications</Mark>{" "}{t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.andSelectYour")}{" "}
                <Mark>NetBird</Mark>{" "}{t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.applicationAndThenSelect")}{" "}
                <Mark>Identity Management</Mark>{" "}{t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.tab")}
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.inThe")}{" "}<Mark>Credentials Details</Mark>{" "}{t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.enterTheFollowingDetails")}
              </p>
              <MinimalList
                data={[
                  {
                    label: t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.label.aPIType"),
                    value: "SCIM API",
                    noCopy: true,
                  },
                  {
                    label: t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.label.sCIMVersion"),
                    value: "SCIM 2.0",
                    noCopy: true,
                  },
                  {
                    label: t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.label.baseURL"),
                    value: "https://api.netbird.io/api/scim/v2",
                  },
                  {
                    label: t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.label.tokenKey"),
                    value:
                      authToken === "" ? (
                        <Skeleton height={17} width={200} />
                      ) : (
                        authToken
                      ),
                    noCopy: authToken === "",
                  },
                  {
                    label: t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.label.testUserEmail"),
                    value: "unused email e.g. test@yourdomain.com",
                    noCopy: true,
                  },
                ]}
              />
            </Steps.Step>
            <Steps.Step step={4} line={false}>
              <p className={"font-normal"}>
                {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.afterThatClick")}{" "}<Mark>Test Connection</Mark>{" "}{t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.toVerifyTheSCIMConnection")}{" "}
                <Mark>Activate</Mark>{" "}{t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.toEnableSCIMProvisioning")}
              </p>
            </Steps.Step>
          </Steps>
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
            disabled={!jumpCloudConnection && isAuth0()}
            onClick={() => setStep(step + 1)}
          >
            {step == 0 ? t("integrations.shared:word.getStarted") : t("common:word.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step == maxSteps && (
          <Button
            variant={"primary"}
            className={"w-full"}
            onClick={finishSetup}
            disabled={integrationId === "" || authToken === ""}
          >
            {t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.finishSetup")}
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
            <span className={"font-medium"}>{" "}{t("integrations.idp-sync.jumpcloud-configuration:jumpcloudSetup.text.515Minutes")}</span>
          </div>
        </div>
      )}
    </ModalContent>
  );
}
