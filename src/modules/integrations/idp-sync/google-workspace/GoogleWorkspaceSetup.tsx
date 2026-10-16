import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { JSONFileUpload } from "@components/JSONFileUpload";
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
  FolderCog2,
  FolderGit2,
  KeyRound,
  Mail,
  MailPlus,
  PlusCircle,
  Repeat,
  Settings2,
  Shield,
  UserCircle,
} from "lucide-react";
import React, { useState } from "react";
import { useEmbeddedIdentityProviders } from "@/hooks/useEmbeddedIdentityProviders";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/google-workspace.png";
import { GoogleWorkspaceIntegration } from "@/interfaces/IdentityProvider";
import googleAssignServiceAccount from "@/modules/integrations/idp-sync/google-workspace/images/google-assign-service-account.png";
import googleEditServiceAccount from "@/modules/integrations/idp-sync/google-workspace/images/google-edit-service-account.png";
import googlePrivilegesReview from "@/modules/integrations/idp-sync/google-workspace/images/google-privileges-review.png";
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

export default function GoogleWorkspaceSetup({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
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
  const googleRequest = useApiCall<GoogleWorkspaceIntegration>(
    "/integrations/google-idp",
  );

  const { isEmbeddedIdPEnabled } = useEmbeddedIdentityProviders();
  const [step, setStep] = useState(isEmbeddedIdPEnabled ? -1 : 0);
  const maxSteps = 10;

  const [serviceAccountKey, setServiceAccountKey] = useState("");
  const [customerID, setCustomerID] = useState("");
  const [serviceAccountMail, setServiceAccountMail] = useState("");

  const clientSecretEntered = !isEmpty(serviceAccountKey);
  const customerIDEntered = !isEmpty(customerID);
  const serviceAccountMailEntered = !isEmpty(serviceAccountMail);

  const allEntered =
    clientSecretEntered && customerIDEntered && serviceAccountMailEntered;

  const isDisabled =
    (step == 3 && !serviceAccountMailEntered) ||
    (step == 4 && !clientSecretEntered) ||
    (step == 8 && !customerIDEntered);

  const [connectorId, setConnectorId] = useState("");
  const [groupPrefixes, setGroupPrefixes] = useState<string[]>([]);
  const [userGroupPrefixes, setUserGroupPrefixes] = useState<string[]>([]);

  const connect = async () => {
    notify({
      title: t(
        "integrations.idp-sync.generic-scimsetup:googleWorkspaceConfiguration.title.googleWorkspaceIntegration",
      ),
      description: t(
        "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.description.googleWorkspaceWasSuccessfullyConnected",
      ),
      promise: googleRequest
        .post({
          service_account_key: btoa(serviceAccountKey), // Encode client secret to base64
          customer_id: customerID,
          group_prefixes: groupPrefixes
            ? groupPrefixes.filter((prefix) => trim(prefix) !== "")
            : [],
          user_group_prefixes: userGroupPrefixes
            ? userGroupPrefixes.filter((prefix) => trim(prefix) !== "")
            : [],
          ...(connectorId ? { connector_id: connectorId } : {}),
        })
        .then(() => {
          mutate("/integrations/google-idp");
          onSuccess();
        }),
      loadingMessage: t(
        "integrations.idp-sync.generic-scimsetup:genericSCIMSetup.loadingMessage.settingUpIntegration",
      ),
    });
  };

  return (
    <ModalContent
      maxWidthClass={cn(
        "relative",
        step == 0 ? "max-w-[540px]" : "max-w-xl",
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
          "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.title.connectNetBirdWithGoogleWorkspace",
        )}
        description={t(
          "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.description.startSyncingYourUsersAnd",
        )}
      />

      {step === -1 && (
        <EmbeddedIdentityProviderSelect
          value={connectorId}
          onChange={setConnectorId}
          location="setup"
          filterByType={["google"]}
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
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.ensureThatYouHaveAn",
            )}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t(
                "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.googleWorkspaceUserAccount",
              )}
            </span>{" "}
            {t("integrations.shared:word.withTheFollowing")}{" "}
            <span className={"text-nb-gray-100 font-semibold"}>
              {t("integrations.shared:word.permissions")}
            </span>
            .{" "}
            {t(
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.ifYouDonTHave",
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
                "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.createGoogleWorkspaceApplications",
              )}
            </div>
            <div
              className={
                "py-2 px-6 flex items-center gap-2 rounded-md w-full justify-center bg-nb-gray-930/0 text-nb-gray-200"
              }
            >
              <Settings2 size={14} className={"text-sky-500"} />
              {t(
                "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.manageGoogleWorkspaceApplications",
              )}
            </div>
          </div>
        </div>
      )}

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Folder size={20} />
            {t(
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.createNetBirdProject",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.createANew",
                )}{" "}
                <Mark copy>NetBird</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.projectInThe",
                )}{" "}
                <InlineLink
                  className={"inline"}
                  target={"_blank"}
                  href={"https://console.cloud.google.com/"}
                >
                  {t(
                    "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.googleCloudConsole",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.enableThe",
                )}{" "}
                <InlineLink
                  className={"inline"}
                  target={"_blank"}
                  href={
                    "https://console.cloud.google.com/apis/library/admin.googleapis.com"
                  }
                >
                  {t(
                    "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.adminSDKAPI",
                  )}
                </InlineLink>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.forThe",
                )}
                <Mark>NetBird</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.project",
                )}
              </p>
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <UserCircle size={20} />
            {t(
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.createAServiceAccount",
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
                  href={"https://console.cloud.google.com/apis/credentials"}
                >
                  {t(
                    "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.aPICredentials",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>CREATE CREDENTIALS</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.atTheTopAndSelect",
                )}{" "}
                <Mark>Service account</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.fillInTheFormWith",
                )}{" "}
                <Mark>DONE</Mark>
              </p>
            </Steps.Step>
          </Steps>

          <MinimalList
            data={[
              {
                label: t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.label.serviceAccountName",
                ),
                value: "NetBird",
              },
              {
                label: t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.label.serviceAccountID",
                ),
                value: "netbird",
              },
            ]}
          />
        </div>
      )}

      {step == 3 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Mail size={20} />
            {t(
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.getYourServiceAccountEmail",
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
                    "https://console.cloud.google.com/iam-admin/serviceaccounts"
                  }
                >
                  {t(
                    "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.serviceAccounts",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>NetBird</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.toEditTheServiceAccount",
                )}
              </p>
              <Lightbox image={googleEditServiceAccount} />
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.enterYourServiceAccountEmail",
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
                  <Mail size={16} className={"text-nb-gray-300"} />
                </div>
              }
              placeholder={t(
                "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.placeholder.netbirdLoadtests347817IamGserviceaccount",
              )}
              value={serviceAccountMail}
              onChange={(e) => setServiceAccountMail(e.target.value)}
            />
          </div>
        </div>
      )}

      {step == 4 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <KeyRound size={20} />
            {t(
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.createServiceAccountKey",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.onTheSamePageNow",
                )}{" "}
                <Mark>Keys</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.tabOpenThe",
                )}{" "}
                <Mark>Add key</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.dropdownAndSelect",
                )}{" "}
                <Mark>Create new key</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.select",
                )}{" "}
                <Mark>JSON</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.asTheKeyTypeAnd",
                )}{" "}
                <Mark>Create</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={4} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.mostBrowsersImmediatelyDownloadThe",
                )}{" "}
                <InlineLink
                  href={
                    "https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys#temp-locations"
                  }
                  target={"_blank"}
                >
                  {t(
                    "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.here",
                  )}
                </InlineLink>
                .
              </p>
            </Steps.Step>
          </Steps>
          <div className={"mb-4 z-0 relative"}>
            <JSONFileUpload
              value={serviceAccountKey}
              onChange={setServiceAccountKey}
            />
            {serviceAccountKey && (
              <div className={"mt-3"}>
                <Input
                  type={"text"}
                  className={"w-full"}
                  customPrefix={
                    <div className={"flex items-center gap-2"}>
                      <KeyRound size={16} className={"text-nb-gray-300"} />
                    </div>
                  }
                  placeholder={t(
                    "integrations.idp-sync.generic-scimsetup:googleWorkspaceConfiguration.placeholder.ydV7QJJ62XlLvYoBanxZR2sJA2va3UbqvncY8",
                  )}
                  value={btoa(serviceAccountKey)}
                  readOnly={true}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {step == 5 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <FolderCog2 size={20} />
            {t(
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.createAdminRole",
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
                  href={"https://admin.google.com/ac/home"}
                >
                  {t(
                    "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.adminConsole",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.select",
                )}{" "}
                <Mark>Account</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.onTheLeftMenuAnd",
                )}{" "}
                <Mark>Admin Roles</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>Create new role</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.andFillInTheForm",
                )}
              </p>
            </Steps.Step>
          </Steps>
          <MinimalList
            data={[
              {
                label: t("common:word.name"),
                value: "User and Group Management ReadOnly",
              },
              {
                label: t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.label.description",
                ),
                value: "User and Group Management ReadOnly",
              },
            ]}
          />
        </div>
      )}

      {step == 6 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Shield size={20} />
            {t(
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.addRolePrivileges",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.scrollDownTo",
                )}{" "}
                <Mark>Admin API privileges</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.andAddTheFollowingPrivileges",
                )}
              </p>
              <MinimalList
                className={"mt-2 mb-0"}
                data={[
                  {
                    label: t("common:countWord.users"),
                    value: "Read",
                  },
                  {
                    label: t("common:word.groups"),
                    value: "Read",
                  },
                ]}
              />
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.verifyPreviewOfAssignedAdmin",
                )}{" "}
                <Mark>CREATE ROLE</Mark>
              </p>
              <Lightbox image={googlePrivilegesReview} />
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 7 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <MailPlus size={20} />
            {t(
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.assignServiceAccount",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>Assign service accounts</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.enterYour",
                )}{" "}
                <Mark>E-Mail</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.andThenClick",
                )}{" "}
                <Mark>ADD</Mark>
              </p>
              <MinimalList
                className={"mt-2 mb-0"}
                data={[
                  {
                    label: t(
                      "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.eMail",
                    ),
                    value: serviceAccountMail,
                  },
                ]}
              />
            </Steps.Step>
            <Steps.Step step={3} line={false}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>ASSIGN ROLE</Mark>
              </p>
              <Lightbox image={googleAssignServiceAccount} />
            </Steps.Step>
          </Steps>
        </div>
      )}

      {step == 8 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <Box size={20} />
            {t(
              "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.enterCustomerID",
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
                    "https://admin.google.com/ac/accountsettings/profile?hl=en_US"
                  }
                >
                  {t(
                    "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.accountSettings",
                  )}
                </InlineLink>
              </p>
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.takeNoteOfThe",
                )}{" "}
                <Mark>Customer ID</Mark>{" "}
                {t(
                  "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.andEnterItBelow",
                )}
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
                    "integrations.idp-sync.generic-scimsetup:googleWorkspaceConfiguration.text.customerID",
                  )}
                </div>
              }
              placeholder={t(
                "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.placeholder.c03f4c3po",
              )}
              value={customerID}
              onChange={(e) => setCustomerID(e.target.value)}
            />
          </div>
        </div>
      )}

      {step == 9 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <FolderGit2 size={20} />
            {t(
              "integrations.idp-sync.generic-scimsetup:genericSCIMSetup.text.groupsToBeSynchronized",
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

      {step == 10 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <UserCircle size={18} />
            {t(
              "integrations.idp-sync.generic-scimsetup:genericSCIMSetup.text.usersToBeSynchronized",
            )}
          </p>

          <div className={"mb-4 flex flex-col gap-1"}>
            <div>
              <GroupPrefixHelpText type={"user-groups"} />
            </div>

            <GroupPrefixInput
              addText={"Add user group filter"}
              text={t(
                "integrations.idp-sync.generic-scimsetup:genericSCIMSetup.text.userGroupStartsWith",
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
            disabled={!allEntered}
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
                "integrations.idp-sync.generic-scimsetup:googleWorkspaceSetup.text.1020Minutes",
              )}
            </span>
          </div>
        </div>
      )}
    </ModalContent>
  );
}
