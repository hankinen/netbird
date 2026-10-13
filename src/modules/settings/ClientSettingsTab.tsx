import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import { Callout } from "@components/Callout";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import { SkeletonSettings } from "@components/skeletons/SkeletonSettings";
import { SmallBadge } from "@components/ui/SmallBadge";
import { useHasChanges } from "@hooks/useHasChanges";
import * as Tabs from "@radix-ui/react-tabs";
import { useApiCall } from "@utils/api";
import { cn, validator } from "@utils/helpers";
import {
  AlertTriangle,
  ClockFadingIcon,
  ExternalLinkIcon,
  MonitorSmartphoneIcon,
  RefreshCcw,
  TagIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import AgentNetworkIcon from "@/assets/icons/AgentNetworkIcon";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { Account } from "@/interfaces/Account";
import { useAgentNetworkMode } from "@/modules/agent-network/useAgentNetworkMode";
import useGroupHelper from "@/modules/groups/useGroupHelper";
type Props = {
  account: Account;
};

const latestOrCustomVersion = [
  {
    label: "Disabled",
    value: "disabled",
  },
  {
    label: "Latest Version",
    value: "latest",
  },
  {
    label: "Custom Version",
    value: "custom",
  },
] as SelectOption[];

export default function ClientSettingsTab({ account }: Readonly<Props>) {
  const { isLoading: isGroupsLoading } = useGroups();

  return isGroupsLoading ? (
    <SkeletonSettings />
  ) : (
    <ClientSettingsTabContent account={account} />
  );
}

function ClientSettingsTabContent({ account }: Readonly<Props>) {
  const { permission } = usePermissions();
  const { enabled: agentNetworkEnabled } = useAgentNetworkMode();

  const { mutate } = useSWRConfig();
  const saveRequest = useApiCall<Account>("/accounts/" + account.id, true);

  const [lazyConnection, setLazyConnection] = useState(
    account.settings?.lazy_connection_enabled ?? false,
  );

  const [agentNetworkOnly, setAgentNetworkOnly] = useState(
    account.settings?.agent_network_only ?? false,
  );

  const [hostnameCollisionRejected, setHostnameCollisionRejected] = useState(
    account.settings?.peer_hostname_collision_rejected ?? false,
  );

  const autoUpdateSetting = account.settings?.auto_update_version;
  const isAutoUpdateEnabled =
    !!autoUpdateSetting && autoUpdateSetting !== "disabled";
  const isCustomVersion = validator.isValidVersion(autoUpdateSetting);
  const [autoUpdateMethod, setAutoUpdateMethod] = useState(
    isAutoUpdateEnabled ? (isCustomVersion ? "custom" : "latest") : "disabled",
  );

  const [autoUpdateCustomVersion, setAutoUpdateCustomVersion] = useState(
    isCustomVersion ? autoUpdateSetting : "",
  );

  const [autoUpdateAlways, setAutoUpdateAlways] = useState(
    account.settings?.auto_update_always ?? false,
  );

  const [peerExposeEnabled, setPeerExposeEnabled] = useState<boolean>(
    account?.settings?.peer_expose_enabled ?? false,
  );
  const [peerExposeGroups, setPeerExposeGroups, { save: saveGroups }] =
    useGroupHelper({
      initial: account.settings?.peer_expose_groups,
    });
  const peerExposeGroupNames = useMemo(
    () => peerExposeGroups.map((g) => g.name).sort(),
    [peerExposeGroups],
  );

  const { hasChanges, updateRef } = useHasChanges([
    autoUpdateMethod,
    autoUpdateCustomVersion,
    autoUpdateAlways,
    peerExposeEnabled,
    peerExposeGroupNames,
  ]);

  const handleUpdateMethodChange = (value: string) => {
    setAutoUpdateMethod(value);
    if (value === "disabled" || value === "latest") {
      setAutoUpdateCustomVersion("");
    }
  };

  const versionError = useMemo(() => {
    const msg = t(
      "settings.main:clientSettingsTab.text.pleaseEnterAValidVersion",
    );
    if (autoUpdateCustomVersion == "") return "";
    if (autoUpdateCustomVersion == "-") return "";
    const validSemver = validator.isValidVersion(autoUpdateCustomVersion);
    if (!validSemver) return msg;
    return "";
  }, [autoUpdateCustomVersion]);

  const canSaveCustomVersion =
    autoUpdateCustomVersion !== "" &&
    autoUpdateMethod === "custom" &&
    versionError === "";

  const isSaveButtonDisabled = useMemo(() => {
    return (
      !hasChanges ||
      !permission.settings.update ||
      (autoUpdateMethod === "custom" && !canSaveCustomVersion) ||
      (peerExposeEnabled && peerExposeGroups.length === 0)
    );
  }, [
    hasChanges,
    permission.settings.update,
    autoUpdateMethod,
    canSaveCustomVersion,
    peerExposeEnabled,
    peerExposeGroups,
  ]);

  const saveChanges = async () => {
    const groups = await saveGroups();
    const peerExposeGroupIds = groups
      .map((group) => group.id)
      .filter(Boolean) as string[];

    notify({
      title: t(
        "settings.authentication-tab:clientSettingsTab.title.clientSettings",
      ),
      description: t(
        "settings.authentication-tab:clientSettingsTab.description.clientSettingsSuccessfullyUpdated",
      ),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            auto_update_version: autoUpdateCustomVersion || autoUpdateMethod,
            auto_update_always: autoUpdateAlways,
            peer_expose_enabled: peerExposeEnabled,
            peer_expose_groups: peerExposeGroupIds,
            lazy_connection_enabled: lazyConnection,
            agent_network_only: agentNetworkOnly,
            peer_hostname_collision_rejected: hostnameCollisionRejected,
          },
        })
        .then(() => {
          mutate("/accounts");
          updateRef([
            autoUpdateMethod,
            autoUpdateCustomVersion,
            autoUpdateAlways,
            peerExposeEnabled,
            peerExposeGroupNames,
          ]);
        }),
      loadingMessage: t(
        "settings.authentication-tab:clientSettingsTab.loadingMessage.updatingClientSettings",
      ),
    });
  };

  const toggleLazyConnection = async (toggle: boolean) => {
    notify({
      title: t(
        "settings.authentication-tab:clientSettingsTab.title.lazyConnections",
      ),
      description: t(
        "settings.authentication-tab:clientSettingsTab.description.lazyConnectionsSuccessfully",
        { value: toggle ? "enabled" : "disabled" },
      ),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            lazy_connection_enabled: toggle,
          },
        })
        .then(() => {
          setLazyConnection(toggle);
          mutate("/accounts");
        }),
      loadingMessage: t(
        "settings.authentication-tab:clientSettingsTab.loadingMessage.updatingLazyConnectionsSetting",
      ),
    });
  };

  const toggleHostnameCollisionRejected = async (toggle: boolean) => {
    notify({
      title: t(
        "settings.authentication-tab:clientSettingsTab.title.uniquePeerHostnames",
      ),
      description: t(
        "settings.authentication-tab:clientSettingsTab.description.uniquePeerHostnamesSuccessfully",
        { value: toggle ? "enabled" : "disabled" },
      ),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            peer_hostname_collision_rejected: toggle,
          },
        })
        .then(() => {
          setHostnameCollisionRejected(toggle);
          mutate("/accounts");
        }),
      loadingMessage: t(
        "settings.authentication-tab:clientSettingsTab.loadingMessage.updatingUniquePeerHostnamesSetting",
      ),
    });
  };

  const toggleAgentNetworkOnly = async (toggle: boolean) => {
    notify({
      title: t(
        "settings.authentication-tab:clientSettingsTab.title.agentNetworkFocusedView",
      ),
      description: t(
        "settings.authentication-tab:clientSettingsTab.description.agentNetworkFocusedViewSuccessfully",
        { value: toggle ? "enabled" : "disabled" },
      ),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            agent_network_only: toggle,
          },
        })
        .then(() => {
          setAgentNetworkOnly(toggle);
          mutate("/accounts");
        }),
      loadingMessage: t(
        "settings.authentication-tab:clientSettingsTab.loadingMessage.updatingAgentNetworkFocusedView",
      ),
    });
  };

  return (
    <Tabs.Content value={"clients"}>
      <div className={"p-default py-6 max-w-2xl"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/settings"}
            label={t("common:word.settings")}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings?tab=clients"}
            label={t(
              "settings.authentication-tab:clientSettingsTab.label.clients",
            )}
            icon={<MonitorSmartphoneIcon size={14} />}
            active
          />
        </Breadcrumbs>
        <div className={"flex items-start justify-between -mt-1"}>
          <h1>
            {t("settings.authentication-tab:clientSettingsTab.label.clients")}
          </h1>
          <Button
            variant={"primary"}
            disabled={isSaveButtonDisabled}
            onClick={saveChanges}
            data-testid={"save-clients-settings"}
          >
            {t("common:word.saveChanges")}
          </Button>
        </div>

        <div className={"flex flex-col gap-10 w-full mt-8"}>
          <div className={"flex flex-col relative"}>
            <Label>
              <RefreshCcw size={15} />
              {t(
                "settings.authentication-tab:clientSettingsTab.text.automaticUpdates",
              )}
              <SmallBadge
                text={t(
                  "settings.authentication-tab:authenticationTab.text.beta",
                )}
                variant={"sky"}
                className={"text-[9px] leading-none py-[3px] px-[5px]"}
                textClassName={"top-0"}
              />
            </Label>
            <HelpText>
              {t(
                "settings.authentication-tab:clientSettingsTab.text.configureHowNetBirdClientsReceive",
              )}{" "}
              <span className={"text-white font-medium"}>v0.61.0</span>.{" "}
              <InlineLink
                href={"https://docs.netbird.io/manage/peers/auto-update"}
                target={"_blank"}
              >
                {t("common:word.learnMore")}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </HelpText>
            <div className={"gap-4 items-center grid grid-cols-2"}>
              <SelectDropdown
                value={autoUpdateMethod}
                onChange={handleUpdateMethodChange}
                options={latestOrCustomVersion}
                data-testid="auto-update-method"
              />
              <Input
                value={autoUpdateCustomVersion}
                customPrefix={"Version"}
                placeholder={"e.g., 0.52.2"}
                error={versionError}
                errorTooltip={true}
                disabled={autoUpdateMethod !== "custom"}
                data-testid="auto-update-version-input"
                onChange={(v) => {
                  setAutoUpdateCustomVersion(v.target.value);
                }}
              />
            </div>
            <FancyToggleSwitch
              className={"mt-4"}
              value={autoUpdateAlways}
              onChange={setAutoUpdateAlways}
              data-testid="force-auto-updates"
              label={
                <>
                  <AlertTriangle size={15} className={"text-yellow-400"} />
                  {t(
                    "settings.authentication-tab:clientSettingsTab.text.forceAutomaticUpdates",
                  )}
                </>
              }
              helpText={t(
                "settings.authentication-tab:clientSettingsTab.helpText.whenEnabledUpdatesAreInstalled",
              )}
              disabled={
                !permission.settings.update || autoUpdateMethod === "disabled"
              }
            />
            {autoUpdateAlways && autoUpdateMethod !== "disabled" && (
              <Callout
                className={"mt-3"}
                variant={"warning"}
                icon={
                  <AlertTriangle
                    size={14}
                    className={"shrink-0 relative top-[3px]"}
                  />
                }
              >
                {t(
                  "settings.authentication-tab:clientSettingsTab.text.enablingAutomaticUpdatesWillRestart",
                )}
              </Callout>
            )}
          </div>

          <div>
            <div>
              <Label>
                <ReverseProxyIcon size={15} className={"text-nb-gray-300"} />
                {t(
                  "settings.authentication-tab:clientSettingsTab.text.exposeServicesFromCLI",
                )}
              </Label>
              <HelpText>
                {t(
                  "settings.authentication-tab:clientSettingsTab.text.allowPeersToExposeLocal",
                )}{" "}
                <br />{" "}
                {t(
                  "settings.authentication-tab:clientSettingsTab.text.thisRequiresAtLeastNetBird",
                )}{" "}
                <span className={"text-white font-medium"}>v0.66.0</span>.{" "}
                <InlineLink
                  href={
                    "https://docs.netbird.io/manage/reverse-proxy/expose-from-cli"
                  }
                  target={"_blank"}
                >
                  {t("common:word.learnMore")}
                  <ExternalLinkIcon size={12} />
                </InlineLink>
              </HelpText>
            </div>

            <FancyToggleSwitch
              className={"mt-2"}
              value={peerExposeEnabled}
              onChange={setPeerExposeEnabled}
              data-testid="peer-expose"
              label={t(
                "settings.authentication-tab:clientSettingsTab.label.enablePeerExpose",
              )}
              helpText={t(
                "settings.authentication-tab:clientSettingsTab.helpText.whenEnabledPeersCanExpose",
              )}
              disabled={!permission.settings.update}
            />

            <div
              className={cn(
                "border border-nb-gray-900 border-t-0 rounded-b-md bg-nb-gray-940 px-[1.28rem] pt-3 pb-5 flex flex-col gap-4 mx-[0.25rem]",
                !peerExposeEnabled
                  ? "opacity-50 pointer-events-none"
                  : "bg-nb-gray-930/80",
              )}
            >
              <div className={"mt-2"}>
                <Label>
                  {t(
                    "settings.authentication-tab:clientSettingsTab.text.allowedPeerGroups",
                  )}
                </Label>
                <HelpText>
                  {t(
                    "settings.authentication-tab:clientSettingsTab.text.selectWhichPeerGroupsAre",
                  )}
                </HelpText>
                <PeerGroupSelector
                  values={peerExposeGroups}
                  onChange={setPeerExposeGroups}
                  placeholder={t(
                    "settings.authentication-tab:clientSettingsTab.placeholder.selectPeerGroups",
                  )}
                  data-testid="peer-expose-groups-selector"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>
              <ClockFadingIcon size={15} />
              {t(
                "settings.authentication-tab:clientSettingsTab.title.lazyConnections",
              )}
            </Label>

            <HelpText>
              {t(
                "settings.authentication-tab:clientSettingsTab.text.insteadOfMaintainingAlwaysOn",
              )}{" "}
              <InlineLink
                href={"https://docs.netbird.io/how-to/lazy-connection"}
                target={"_blank"}
              >
                {t("common:word.learnMore")}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </HelpText>
            <FancyToggleSwitch
              className={"mt-2"}
              value={lazyConnection}
              onChange={toggleLazyConnection}
              data-testid="lazy-connections"
              label={
                <>
                  {t(
                    "settings.authentication-tab:clientSettingsTab.text.enableLazyConnections",
                  )}
                </>
              }
              helpText={
                <>
                  {t(
                    "settings.authentication-tab:clientSettingsTab.text.allowToEstablishConnectionsBetween",
                  )}
                </>
              }
              disabled={!permission.settings.update}
            />
          </div>

          <div>
            <Label>
              <TagIcon size={15} />
              {t(
                "settings.authentication-tab:clientSettingsTab.title.uniquePeerHostnames",
              )}
            </Label>
            <HelpText>
              {t(
                "settings.authentication-tab:clientSettingsTab.text.byDefaultAPeerRegistering",
              )}
            </HelpText>
            <FancyToggleSwitch
              className={"mt-2"}
              value={hostnameCollisionRejected}
              onChange={toggleHostnameCollisionRejected}
              data-testid="peer-hostname-collision-rejected"
              label={t(
                "settings.authentication-tab:clientSettingsTab.label.rejectHostnameCollisions",
              )}
              helpText={t(
                "settings.authentication-tab:clientSettingsTab.helpText.whenEnabledRegisteringOrRenaming",
              )}
              disabled={!permission.settings.update}
            />
          </div>

          {agentNetworkEnabled && (
            <div>
              <Label>
                <AgentNetworkIcon size={15} />
                {t(
                  "settings.authentication-tab:clientSettingsTab.text.agentNetwork",
                )}
              </Label>
              <HelpText>
                {t(
                  "settings.authentication-tab:clientSettingsTab.text.focusTheDashboardOnThe",
                )}
              </HelpText>
              <FancyToggleSwitch
                className={"mt-2"}
                value={agentNetworkOnly}
                onChange={toggleAgentNetworkOnly}
                data-testid="agent-network-only"
                label={t(
                  "settings.authentication-tab:clientSettingsTab.label.agentNetworkFocusedView",
                )}
                helpText={t(
                  "settings.authentication-tab:clientSettingsTab.helpText.whenEnabledTheDashboardShows",
                )}
                disabled={!permission.settings.update}
              />
            </div>
          )}
        </div>
      </div>
    </Tabs.Content>
  );
}
