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
import { isAuth0 } from "@utils/netbird";
import { isEmpty, trim } from "lodash";
import {
  BoxIcon,
  Clock4,
  ExternalLinkIcon,
  PlusCircle,
  Settings2,
  Shield,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useEmbeddedIdentityProviders } from "@/hooks/useEmbeddedIdentityProviders";
import Skeleton from "react-loading-skeleton";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/generic-scim.png";
import {
  IdentityProvider,
  ScimIntegration,
} from "@/interfaces/IdentityProvider";
import { EmbeddedIdentityProviderSelect } from "@/modules/integrations/idp-sync/EmbeddedIdentityProviderSelect";
import { GenericSCIMProps } from "@/modules/integrations/idp-sync/generic-scim/GenericSCIM";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
import { useSSOConnections } from "@/modules/integrations/sso/useSSOConnections";
import entraGetStarted from "@/modules/integrations/idp-sync/entra-scim/images/entra-provisioning-get-started.png";
import entraStartProvisioning from "@/modules/integrations/idp-sync/entra-scim/images/entra-provisioning-started.png";
import entraAssignUsers from "@/modules/integrations/idp-sync/entra-scim/images/entra-assign-users-groups.png";
import entraEditExternalId from "@/modules/integrations/idp-sync/entra-scim/images/entra-edit-externalid.png";
import entraGroupMapping from "@/modules/integrations/idp-sync/entra-scim/images/entra-group-attribute-mapping.png";
import { Lightbox } from "@components/ui/Lightbox";

import { t } from "@/i18n";
interface Props extends GenericSCIMProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EntraSCIMSetup({
  open,
  onOpenChange,
  onSuccess,
  ...props
}: Props) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {open && (
        <SetupContent
          onSuccess={() => {
            onOpenChange(false);
            onSuccess?.();
          }}
          onClose={() => onOpenChange(false)}
          {...props}
        />
      )}
    </Modal>
  );
}

interface ModalProps extends GenericSCIMProps {
  onSuccess: () => void;
  onClose: () => void;
}

const maxWidthClasses = [
  "max-w-xl",
  "max-w-xl",
  "max-w-2xl",
  "max-w-xl",
  "max-w-xl",
  "max-w-xl",
  "max-w-xl",
  "max-w-xl",
];

export function SetupContent({
  onSuccess,
  name,
  image,
  onClose,
  provider = IdentityProvider.ENTRA,
}: ModalProps) {
  const { isEmbeddedIdPEnabled } = useEmbeddedIdentityProviders();
  const [step, setStep] = useState(isEmbeddedIdPEnabled ? -1 : 0);
  const [authToken, setAuthToken] = useState("");
  const { mutate } = useSWRConfig();
  const [connectorId, setConnectorId] = useState("");
  const [groupPrefixes, setGroupPrefixes] = useState<string[]>([]);
  const [userGroupPrefixes, setUserGroupPrefixes] = useState<string[]>([]);
  const maxSteps = 6;
  const [integrationId, setIntegrationId] = useState("");
  const { entraConnection, isSSOLoading } = useSSOConnections();
  const scimProvider = provider;

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
      title: t(
        "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.title.integration",
        { name },
      ),
      description: t(
        "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.description.wasSuccessfullySetUp",
        { name },
      ),
      promise: integrationRequest
        .put(
          {
            group_prefixes: groupPrefixes
              ? groupPrefixes.filter((prefix) => trim(prefix) !== "")
              : [],
            user_group_prefixes: userGroupPrefixes
              ? userGroupPrefixes.filter((prefix) => trim(prefix) !== "")
              : [],
            provider: scimProvider,
          },
          `/${integrationId}`,
        )
        .then(() => {
          mutate("/integrations/scim-idp");
          onSuccess();
        }),
      loadingMessage: t(
        "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.loadingMessage.settingUpIntegration",
      ),
    });
  };

  useEffect(() => {
    const getAuthToken = async () => {
      if (!entraConnection && isAuth0()) return;
      const integrationList = await integrations.get();
      const existingIntegration = integrationList?.find(
        (item) => item.provider === scimProvider,
      );

      if (!isEmpty(existingIntegration)) {
        const id = existingIntegration.id;
        if (authToken != "") return authToken;
        const res = await integrationRequest.post({}, `/${id}/token`);
        if (!res) return "";
        setIntegrationId(id);
        return res.auth_token;
      } else {
        const res = await integrationRequest.post({
          prefix: isAuth0()
            ? `${entraConnection?.strategy}|${entraConnection?.name}`
            : undefined,
          provider: scimProvider,
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

    const authStep = provider === IdentityProvider.ENTRA ? 2 : 3;
    if (step === authStep && authToken === "") {
      getAuthToken().then((token) => {
        if (token !== undefined && token !== "") setAuthToken(token);
      });
    }
  }, [
    step,
    authToken,
    entraConnection,
    groupPrefixes,
    userGroupPrefixes,
    provider,
  ]);

  return (
    <ModalContent
      maxWidthClass={cn(
        "relative",
        step === -1 ? "max-w-lg" : maxWidthClasses[step],
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
        image={image || integrationImage}
        title={t(
          "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.connectNetBirdWith",
          { name },
        )}
        description={t(
          "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.startSyncingYourUsersAnd",
          { name },
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
              "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.ensureThatYouHaveAn",
            )}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t(
                "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.azureADUserAccount",
              )}
            </span>{" "}
            {t("integrations.shared:word.withTheFollowing")}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("integrations.shared:word.permissions")}
            </span>
            .{" "}
            {t(
              "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.ifYouDonTHave",
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
                "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.createAzureADApplications",
              )}
            </div>
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <Settings2 size={14} className={"text-sky-500"} />
              {t(
                "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.manageAzureADApplications",
              )}
            </div>
          </div>

          {!entraConnection && !isSSOLoading && isAuth0() && (
            <Callout className={"max-w-xl mt-5 text-left"} variant={"warning"}>
              <span>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.itSeemsYourAccountIs",
                )}{" "}
                <span className={"font-medium"}>
                  {t(
                    "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.continueWithEntraID",
                  )}{" "}
                </span>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.buttonOnTheLoginPage",
                )}
              </span>
            </Callout>
          )}
        </div>
      )}

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <BoxIcon size={20} />
            {t(
              "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.configureSCIMInMicrosoftEntra",
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
                  href={"https://portal.azure.com/"}
                >
                  {t(
                    "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.azurePortal",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.goTo",
                )}{" "}
                <Mark>Azure Active Directory</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.then",
                )}{" "}
                <Mark>Enterprise applications</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("common:word.click")}
                <Mark>+ New application</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.toCreateANewEnterprise",
                )}{" "}
                <Mark>+ Create your own application</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={4}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.enter",
                )}{" "}
                <Mark copy={true}>NetBird SCIM</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.asTheNameAndSelect",
                )}
                <Mark>
                  Integrate any other application you don&apos;t find in the
                  gallery (Non-gallery)
                </Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={5} line={false}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>Create</Mark>
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <BoxIcon size={20} />
            {t(
              "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.enableProvisioning",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.onceTheApplicationIsCreated",
                )}{" "}
                <Mark>Manage</Mark>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.thenClick",
                )}{" "}
                <Mark>Provisioning</Mark>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.underTheCreateConfigurationSection",
                )}{" "}
                <Mark>Connect your application</Mark>
              </p>
              <Lightbox image={entraGetStarted} />
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.fillInTheFormWith",
                )}
              </p>
              <MinimalList
                data={[
                  {
                    label: t(
                      "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.label.authenticationMethod",
                    ),
                    value: "Bearer authentication",
                    noCopy: true,
                  },
                  {
                    label: t(
                      "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.label.tenantURL",
                    ),
                    value:
                      "https://api.netbird.io/api/scim/v2?aadOptscim062020",
                  },
                  {
                    label: t(
                      "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.label.secretToken",
                    ),
                    value:
                      authToken === "" ? (
                        <Skeleton height={17} width={200} />
                      ) : (
                        authToken
                      ),
                    noCopy: authToken === "",
                  },
                ]}
              />
              <Callout variant={"warning"}>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.the",
                )}{" "}
                <span className={"font-medium"}>
                  {t(
                    "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.aadOptscim062020",
                  )}
                </span>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.flagAppendedToTheTenant",
                )}{" "}
                <InlineLink
                  target={"_blank"}
                  href={
                    "https://learn.microsoft.com/en-us/entra/identity/app-provisioning/application-provisioning-config-problem-scim-compatibility#flags-to-alter-the-scim-behavior"
                  }
                >
                  {t("common:word.learnMore")}
                  <ExternalLinkIcon size={12} />
                </InlineLink>
              </Callout>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.afterThatClick",
                )}{" "}
                <Mark>Test Connection</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.toVerifyTheSCIMConnection",
                )}{" "}
                <Mark>Create</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.toSaveTheConfiguration",
                )}
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 3 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <BoxIcon size={20} />
            {t(
              "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.groupAttributeMapping",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.navigateToThe",
                )}{" "}
                <Mark>Attribute mapping</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.sectionAndSelectThe",
                )}{" "}
                <Mark>Groups</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.tab",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.inTheAttributeMappingsList",
                )}{" "}
                <Mark>externalId</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.row",
                )}{" "}
                <br />
                {t("integrations.shared:word.andClick")} <Mark>Delete</Mark>
              </p>
              <Lightbox image={entraGroupMapping} />
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>Save</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.toApplyTheUpdatedGroup",
                )}
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 4 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <BoxIcon size={20} />
            {t(
              "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.userAttributeMapping",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.navigateToThe",
                )}{" "}
                <Mark>Attribute mapping</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.sectionAndSelectThe",
                )}{" "}
                <Mark>Users</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.tab",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.inTheAttributeMappingsList2",
                )}
              </p>
              <div>
                <Mark>userName</Mark>
                <Mark>active</Mark>
                <Mark>displayName</Mark>
                <Mark>emails[type eq "work"].value</Mark>
                <Mark>name.givenName</Mark>
                <Mark>name.familyName</Mark>
                <Mark>externalId</Mark>
              </div>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.inTheAttributeMappingsList",
                )}{" "}
                <Mark>externalId</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.row",
                )}{" "}
                <br />
                {t("integrations.shared:word.andClick")} <Mark>Edit</Mark>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.changeThe",
                )}{" "}
                <Mark>Source attribute</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.from",
                )}{" "}
                <Mark>mailNickname</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.to",
                )}{" "}
                <Mark>objectId</Mark> {t("integrations.shared:word.andClick")}{" "}
                <Mark>Ok</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.toSaveTheChange",
                )}
              </p>
              <Lightbox image={entraEditExternalId} />
            </Steps.Step>
            <Steps.Step step={4} line={false}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>Save</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.toApplyTheFinalAttribute",
                )}
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 5 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <BoxIcon size={20} />
            {t(
              "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.assignUsersAndGroups",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.navigateToYourNetBirdEnterprise",
                )}{" "}
                <Mark>Users and groups</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.inTheLeftMenu",
                )}
              </p>
              <Lightbox image={entraAssignUsers} />
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>+ Add user/group</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.andSelectTheUsersAnd",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>Assign</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.toSaveTheAssignments",
                )}
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 6 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <BoxIcon size={20} />
            {t(
              "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.startProvisioning",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.afterAssigningUsersAndGroups",
                )}{" "}
                <Mark>Overview</Mark>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.thenClickThe",
                )}{" "}
                <Mark>Start provisioning</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.buttonToEnableAutomaticSynchronization",
                )}
              </p>
              <Lightbox image={entraStartProvisioning} />
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.theFirstSyncWillBegin",
                )}{" "}
                <br />
                {t("common:word.click")} <Mark>Finish Setup</Mark>{" "}
                {t(
                  "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.belowToFinalizeThisSetup",
                )}
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
            disabled={!entraConnection && isAuth0()}
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
            onClick={finishSetup}
            disabled={integrationId === "" || authToken === ""}
          >
            {t(
              "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.finishSetup",
            )}
          </Button>
        )}
      </ModalFooter>
      {(step == 0 || step == -1) && provider === IdentityProvider.ENTRA && (
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
                "integrations.idp-sync.entra-scimsetup:entraSCIMSetup.text.1020Minutes",
              )}
            </span>
          </div>
        </div>
      )}
    </ModalContent>
  );
}
