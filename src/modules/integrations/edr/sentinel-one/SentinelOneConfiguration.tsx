import Button from "@components/Button";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { useHasChanges } from "@hooks/useHasChanges";
import { IconInfoCircle } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import {
  AlertOctagon,
  Cog,
  ExternalLinkIcon,
  FolderGit2,
  GlobeIcon,
  KeyRound,
  RefreshCcw,
  ShieldCheckIcon,
} from "lucide-react";
import React, { useReducer, useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/sentinelone.png";
import FullTooltip from "@/components/FullTooltip";
import { PeerGroupSelector } from "@/components/PeerGroupSelector";
import { useDialog } from "@/contexts/DialogProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { t } from "@/i18n";
import { SentinelOneIntegration } from "@/interfaces/EDR";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import { matchAttributesReducer } from "@/modules/integrations/edr/sentinel-one/SentinelOne";
import { SentinelOneMatchSettings } from "@/modules/integrations/edr/sentinel-one/SentinelOneMatchSettings";
import SentinelOneUrlInput from "@/modules/integrations/edr/sentinel-one/SentinelOneUrlInput";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  config: SentinelOneIntegration;
};

export default function SentinelOneConfiguration({
  open,
  onOpenChange,
  onSuccess,
  config,
}: Props) {
  const { isLoading } = useGroups();

  return (
    !isLoading && (
      <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
        <ConfigurationContent
          onSuccess={() => {
            onOpenChange(false);
            onSuccess && onSuccess();
          }}
          config={config}
        />
      </Modal>
    )
  );
}

type ModalProps = {
  onSuccess: () => void;
  config: SentinelOneIntegration;
};

export function ConfigurationContent({
  onSuccess,
  config,
}: Readonly<ModalProps>) {
  const { mutate } = useSWRConfig();
  const { confirm } = useDialog();

  const [tab, setTab] = useState<string>("peer-approval");

  const integrationRequest = useApiCall<SentinelOneIntegration>(
    "/integrations/edr/sentinelone",
  );

  const [apiUrl, setApiUrl] = useState(config.api_url);
  const secretPlaceholder = "******************************";
  const [apiToken, setApiToken] = useState(secretPlaceholder);
  const [lastSyncedInterval, setLastSyncedInterval] = useState(
    config.last_synced_interval?.toString() || "24",
  );
  const [matchAttributes, dispatchMatchAttributes] = useReducer(
    matchAttributesReducer,
    config.match_attributes,
  );

  const [groups, setGroups, { save: saveGroups }] = useGroupHelper({
    initial: config.groups.map((g) => {
      const isString = typeof g === "string";
      return isString ? g : g.id;
    }) as string[],
  });

  const deleteIntegration = async () => {
    const choice = await confirm({
      title: t(
        "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.title.deleteIntegration",
      ),
      description: t(
        "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.description.areYouSureYouWant",
      ),
      confirmText: t("common:word.delete"),
      cancelText: t("common:word.cancel"),
      type: "danger",
    });

    if (!choice) return;

    notify({
      title: t(
        "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.title.sentinelOneIntegration",
      ),
      description: t(
        "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.description.sentinelOneWasSuccessfullyDeleted",
      ),
      promise: integrationRequest.del({}).then(() => {
        mutate("/integrations/edr/sentinelone");
        onSuccess();
      }),
      loadingMessage: t("integrations.shared:word.deletingIntegration"),
    });
  };

  const updateIntegration = async () => {
    const savedGroups = await saveGroups();

    notify({
      title: t(
        "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.title.sentinelOneIntegration",
      ),
      description: t(
        "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.description.sentinelOneWasSuccessfullyUpdated",
      ),
      promise: integrationRequest
        .put({
          api_token: secretPlaceholder === apiToken ? undefined : apiToken,
          api_url: apiUrl,
          groups: savedGroups.map((group) => group.id) || [],
          last_synced_interval: Number(lastSyncedInterval || 24),
          match_attributes: matchAttributes,
          enabled: config.enabled,
        })
        .then(() => {
          mutate("/integrations/edr/sentinelone");
          onSuccess();
        }),
      loadingMessage: t("integrations.shared:word.updatingIntegration"),
    });
  };

  const { hasChanges } = useHasChanges([
    apiToken,
    apiUrl,
    matchAttributes,
    groups,
    lastSyncedInterval,
  ]);
  const canSave = hasChanges && groups.length;

  return (
    <ModalContent
      maxWidthClass={cn("relative max-w-[650px]")}
      showClose={true}
      className={""}
      autoFocus={false}
    >
      <GradientFadedBackground />

      <IntegrationModalHeader
        image={integrationImage}
        title={t(
          "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.title.sentinelOneConfiguration",
        )}
        description={t(
          "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.description.restrictNetworkAccessToIT",
        )}
      />

      <Tabs
        defaultValue={tab}
        onValueChange={(v) => setTab(v)}
        className={"mt-6"}
      >
        <TabsList justify={"start"} className={"px-8"}>
          <TabsTrigger value={"peer-approval"}>
            <FolderGit2
              size={14}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t(
              "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.peerApproval",
            )}
          </TabsTrigger>
          <TabsTrigger value={"compliance"}>
            <ShieldCheckIcon
              size={14}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t(
              "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.compliance",
            )}
          </TabsTrigger>
          <TabsTrigger value={"settings"}>
            <Cog
              size={14}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("common:word.settings")}
          </TabsTrigger>
          <TabsTrigger value={"danger"}>
            <AlertOctagon
              size={14}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("integrations.shared:word.dangerZone")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={"peer-approval"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <FolderGit2 size={14} />
                {t("common:word.groups")}
              </div>
            </Label>
            <HelpText className={"mt-2"}>
              {t(
                "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.selectGroupsYouWantTo",
              )}
            </HelpText>

            <PeerGroupSelector values={groups} onChange={setGroups} />
          </div>
        </TabsContent>

        <TabsContent value={"compliance"} className={"px-8"}>
          <div className={""}>
            <Label>
              <div className={"flex gap-2 items-center"}>
                {t(
                  "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.requirements",
                )}
              </div>
            </Label>
            <HelpText className={"mt-2"}>
              {t(
                "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.setTheSpecificRequirementsThat",
              )}
            </HelpText>

            <SentinelOneMatchSettings
              value={matchAttributes}
              dispatch={dispatchMatchAttributes}
            />
          </div>
        </TabsContent>

        <TabsContent value={"settings"} className={"px-8 text-sm"}>
          <div className={"mb-3 flex flex-row gap-3 w-full justify-between"}>
            <div>
              <Label>
                <div className={"flex gap-2 items-center"}>
                  <RefreshCcw size={14} />
                  {t(
                    "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.syncWindow",
                  )}
                </div>
              </Label>
              <FullTooltip
                interactive={false}
                content={
                  <div className={"max-w-xs text-xs"}>
                    {t(
                      "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.exampleThisPropertyIsSet",
                    )}
                  </div>
                }
              >
                <HelpText className={"max-w-sm mt-1"}>
                  {t(
                    "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.devicesNotSyncedWithSentinelOne",
                  )}
                  <IconInfoCircle
                    size={14}
                    className={"relative inline ml-1 -top-[1px]"}
                  />
                </HelpText>
              </FullTooltip>
            </div>

            <Input
              placeholder={"24"}
              min={24}
              max={336}
              className={"w-full min-w-[130px] ml-auto"}
              value={lastSyncedInterval}
              type={"number"}
              onChange={(e) => setLastSyncedInterval(e.target.value)}
              customSuffix={t(
                "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.customSuffix.hours",
              )}
            />
          </div>

          <div className={"flex-col gap-3 flex"}>
            <SentinelOneUrlInput
              value={apiUrl}
              setValue={setApiUrl}
              errorTooltip={true}
              customPrefix={
                <div className={"min-w-[165px] flex gap-2 items-center"}>
                  <GlobeIcon size={16} />
                  {t(
                    "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.consoleURL",
                  )}
                </div>
              }
            />

            <Input
              autoCorrect={"off"}
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"min-w-[165px] flex gap-2 items-center"}>
                  <KeyRound size={16} />
                  {t(
                    "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.aPIToken",
                  )}
                </div>
              }
              placeholder={t(
                "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.placeholder.eyJraWQiOiJ1cy1lYXN0LTEtcHJvZC0wIiwiYWxnIjoiRVMyNTYifQEyJzdWIiOiJzZXJ2aWNldXNlci1lYjFiNmNhNy00Y2IxLTRjNjQtYWUyZS0wMTQwMDk2YjczYTVAbWdtdC",
              )}
              value={apiToken}
              onFocus={(e) => {
                if (e.target.value == secretPlaceholder) {
                  e.target.value = "";
                }
              }}
              onBlur={(e) => {
                if (!e.target.value.length) {
                  e.target.value = secretPlaceholder;
                }
              }}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value={"danger"} className={"px-8"}>
          <div>
            <Label>
              <div className={"flex gap-2 items-center"}>
                <AlertOctagon size={14} />
                {t("integrations.shared:word.deleteIntegration")}
              </div>
            </Label>
            <HelpText className={"max-w-lg mt-2"}>
              {t(
                "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.text.deletingThisIntegrationWillRemove",
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
        <div className={"w-full"}>
          <Paragraph className={"text-sm mt-auto"}>
            {t("common:word.learnMoreAbout")}
            <InlineLink
              href={"https://docs.netbird.io/how-to/sentinelone-edr"}
              target={"_blank"}
            >
              {t(
                "integrations.edr.sentinel-one-configuration:sentinelOneConfiguration.title.sentinelOneIntegration",
              )}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>
        <div className={"flex gap-4"}>
          <ModalClose asChild={true}>
            <Button variant={"secondary"} className={"w-full"}>
              {t("common:word.cancel")}
            </Button>
          </ModalClose>

          <Button
            variant={"primary"}
            className={"w-full"}
            disabled={!canSave}
            onClick={updateIntegration}
          >
            {t("common:word.saveChanges")}
          </Button>
        </div>
      </ModalFooter>
    </ModalContent>
  );
}
