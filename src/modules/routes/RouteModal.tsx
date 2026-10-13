"use client";

import Button from "@components/Button";
import ButtonGroup from "@components/ButtonGroup";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import FullTooltip from "@components/FullTooltip";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import Paragraph from "@components/Paragraph";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
import { PeerSelector } from "@components/PeerSelector";
import { SegmentedTabs } from "@components/SegmentedTabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { Textarea } from "@components/Textarea";
import InputDomain, { domainReducer } from "@components/ui/InputDomain";
import { getOperatingSystem } from "@hooks/useOperatingSystem";
import { IconDirectionSign } from "@tabler/icons-react";
import { cn } from "@utils/helpers";
import { isValidIP, normalizeHostCIDR } from "@utils/ip";
import { uniqBy } from "lodash";
import {
  ArrowDownWideNarrow,
  CircleHelp,
  ExternalLinkIcon,
  FolderGit2,
  GlobeIcon,
  GlobeLockIcon,
  MonitorSmartphoneIcon,
  NetworkIcon,
  PlusCircle,
  PlusIcon,
  Power,
  RouteIcon,
  Settings2,
  Text,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import { useDialog } from "@/contexts/DialogProvider";
import { useRoutes } from "@/contexts/RoutesProvider";
import { t } from "@/i18n";
import { Group } from "@/interfaces/Group";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { Peer } from "@/interfaces/Peer";
import { Policy } from "@/interfaces/Policy";
import { Route } from "@/interfaces/Route";
import { AccessControlModalContent } from "@/modules/access-control/AccessControlModal";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import { RoutingPeerMasqueradeSwitch } from "@/modules/networks/routing-peers/RoutingPeerMasqueradeSwitch";
type Props = {
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  distributionGroups?: Group[];
};

export default function RouteModal({
  children,
  open,
  setOpen,
  distributionGroups,
}: Props) {
  const { confirm } = useDialog();
  const router = useRouter();
  const [routePolicyModal, setRoutePolicyModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState<Policy>();

  const handleCreatePolicyPrompt = async (r: Route) => {
    if (!r?.access_control_groups) return;

    const choice = await confirm({
      title: t("routes.main:routeModal.title.doYouWantToCreate", { network_id: r.network_id }),
      description:
        t("routes.main:routeModal.description.youHaveOneOrMore"),
      confirmText: t("routes.main:routeModal.confirmText.createPolicy"),
      cancelText: t("common:word.later"),
      type: "default",
    });
    if (!choice) return;

    const name = `${r.network_id} Policy`;
    const newPolicy: Policy = {
      name,
      description: "",
      enabled: true,
      source_posture_checks: [],
      rules: [
        {
          name,
          description: "",
          sources: r?.groups || [],
          destinations: r?.access_control_groups || [],
          enabled: true,
          bidirectional: false,
          action: "accept",
          protocol: "all",
          ports: [],
        },
      ],
    };
    setNewPolicy(newPolicy);
    setRoutePolicyModal(true);
  };

  return (
    <>
      <Modal open={open} onOpenChange={setOpen} key={open ? 1 : 0}>
        {children && <ModalTrigger asChild>{children}</ModalTrigger>}
        {open && (
          <RouteModalContent
            onSuccess={async (r) => {
              await handleCreatePolicyPrompt(r);
              setOpen?.(false);
            }}
            distributionGroups={distributionGroups}
          />
        )}
      </Modal>

      <Modal open={routePolicyModal} onOpenChange={setRoutePolicyModal}>
        {routePolicyModal && newPolicy != undefined && (
          <AccessControlModalContent
            onSuccess={() => {
              router.push("/access-control");
            }}
            policy={newPolicy}
          />
        )}
      </Modal>
    </>
  );
}

type ModalProps = {
  onSuccess?: (route: Route) => void;
  peer?: Peer;
  exitNode?: boolean;
  isFirstExitNode?: boolean;
  distributionGroups?: Group[];
};

export function RouteModalContent({
  onSuccess,
  peer,
  exitNode,
  isFirstExitNode = false,
  distributionGroups,
}: ModalProps) {
  const { createRoute } = useRoutes();
  const [tab, setTab] = useState(
    exitNode && peer ? "access-control" : "network",
  );

  /**
   * Network Identifier, Description & Network Range
   */
  const [networkIdentifier, setNetworkIdentifier] = useState(
    exitNode
      ? peer
        ? t("routes.main:routeModal.text.exitNode", { value: peer.name.length > 25
              ? peer.name.substring(0, 25) + "..."
              : peer.name })
        : t("common:word.exitNode")
      : "",
  );
  const [description, setDescription] = useState("");
  const [networkRange, setNetworkRange] = useState(exitNode ? "0.0.0.0/0" : "");
  const [routingPeer, setRoutingPeer] = useState<Peer | undefined>(peer);
  const [
    routingPeerGroups,
    setRoutingPeerGroups,
    { getGroupsToUpdate: getAllRoutingGroupsToUpdate },
  ] = useGroupHelper({
    initial: [],
  });

  /**
   * DNS Routes
   * IP Range or Domain Tab = ip-range or domains
   */
  const [domainRoutes, setDomainRoutes] = useReducer(domainReducer, []);
  const [domainError, setDomainError] = useState<boolean>(false);
  const [routeType, setRouteTyp] = useState<string>("ip-range");
  const [keepRoute, setKeepRoute] = useState<boolean>(true);

  const isMasqueradeDisabled = useMemo(() => {
    if (exitNode) return true;
    return routeType === "domains";
  }, [exitNode, routeType]);

  const isDomainOrRangeEntered = useMemo(() => {
    if (routeType === "ip-range") return networkRange !== "";
    const isEmptyDomain = domainRoutes.some((d) => d.name === "");
    const isAtLeastOneDomain = domainRoutes.length > 0;
    return !isEmptyDomain && isAtLeastOneDomain && !domainError;
  }, [domainRoutes, routeType, networkRange, domainError]);

  // Enable Masquerade if domain route type is selected
  useEffect(() => {
    if (routeType === "domains") setMasquerade(true);
  }, [routeType]);

  /**
   * Distribution Groups
   */
  const [groups, setGroups, { getGroupsToUpdate }] = useGroupHelper({
    initial: distributionGroups ?? [],
  });

  /**
   * Access Control Groups
   */
  const [
    accessControlGroups,
    setAccessControlGroups,
    { getGroupsToUpdate: getAccessControlGroupsToUpdate },
  ] = useGroupHelper({
    initial: [],
  });

  /**
   * Additional Settings
   */
  const [enabled, setEnabled] = useState<boolean>(true);
  const [metric, setMetric] = useState("9999");
  const [masquerade, setMasquerade] = useState<boolean>(true);
  const [isForced, setIsForced] = useState<boolean>(true);

  const isNonLinuxRoutingPeer = useMemo(() => {
    if (!routingPeer) return false;
    return getOperatingSystem(routingPeer.os) != OperatingSystem.LINUX;
  }, [routingPeer]);

  useEffect(() => {
    if (isNonLinuxRoutingPeer) setMasquerade(true);
  }, [isNonLinuxRoutingPeer]);

  /**
   * Create Route
   */
  const createRouteHandler = async () => {
    // Create groups that do not exist
    const g1 = getAllRoutingGroupsToUpdate();
    const g2 = getGroupsToUpdate();
    const g3 = getAccessControlGroupsToUpdate();
    const createOrUpdateGroups = uniqBy([...g1, ...g2, ...g3], "name").map(
      (g) => g.promise,
    );
    const createdGroups = await Promise.all(
      createOrUpdateGroups.map((call) => call()),
    );

    // Check if routing peer is selected
    const useSinglePeer = peerTab === "routing-peer";

    // Get group ids of peer groups
    let peerGroups: string[] = [];
    if (!useSinglePeer) {
      peerGroups = routingPeerGroups
        .map((g) => {
          const find = createdGroups.find((group) => group.name === g.name);
          return find?.id;
        })
        .filter((g) => g !== undefined) as string[];
    }

    // Get distribution group ids
    const groupIds = groups
      .map((g) => {
        const find = createdGroups.find((group) => group.name === g.name);
        return find?.id;
      })
      .filter((g) => g !== undefined) as string[];

    let accessControlGroupIds: string[] | undefined = undefined;
    if (accessControlGroups.length > 0) {
      accessControlGroupIds = accessControlGroups
        .map((g) => {
          const find = createdGroups.find((group) => group.name === g.name);
          return find?.id;
        })
        .filter((g) => g !== undefined) as string[];
    }

    const domainRouteNames =
      routeType === "domains"
        ? domainRoutes.map((d) => d.name).filter((d) => d !== "")
        : undefined;
    const useKeepRoute = routeType === "domains" ? keepRoute : undefined;

    createRoute(
      {
        network_id: networkIdentifier,
        description: description || "",
        enabled: enabled,
        peer: useSinglePeer ? routingPeer?.id : undefined,
        peer_groups: useSinglePeer ? undefined : peerGroups || undefined,
        network: routeType === "ip-range" ? normalizeHostCIDR(networkRange) : undefined,
        domains: domainRouteNames,
        keep_route: useKeepRoute,
        metric: Number(metric) || 9999,
        masquerade: useSinglePeer && isNonLinuxRoutingPeer ? true : masquerade,
        groups: groupIds,
        access_control_groups: accessControlGroupIds || undefined,
        skip_auto_apply: !isForced,
      },
      onSuccess,
    );
  };

  /**
   * Refs to manage input focus on tab change
   */
  const networkRangeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [peerTab, setPeerTab] = useState("routing-peer");

  /**
   * Validate CIDR Range
   */
  const cidrError = useMemo(() => {
    if (networkRange == "") return "";
    const validCIDR = isValidIP(networkRange);
    if (!validCIDR) return t("routes.main:routeModal.text.pleaseEnterAValidIP");
  }, [networkRange]);

  const isGroupsEntered = useMemo(() => {
    return groups.length > 0;
  }, [groups]);

  /**
   * Allow to create route only when all fields are filled
   */
  const isNetworkEntered = useMemo(() => {
    return !(
      (cidrError && cidrError.length > 1) ||
      (peerTab === "peer-group" && routingPeerGroups.length == 0) ||
      (peerTab === "routing-peer" && !routingPeer) ||
      !isDomainOrRangeEntered
    );
  }, [
    cidrError,
    peerTab,
    routingPeerGroups.length,
    routingPeer,
    isDomainOrRangeEntered,
  ]);

  const networkIdentifierError = useMemo(() => {
    return (networkIdentifier?.length || 0) > 40
      ? t("routes.main:routeModal.text.networkIdentifierMustBeLess")
      : "";
  }, [networkIdentifier]);

  const metricError = useMemo(() => {
    return parseInt(metric) < 1 || parseInt(metric) > 9999
      ? t("routes.main:routeModal.text.metricMustBeBetween1")
      : "";
  }, [metric]);

  const isNameEntered = useMemo(() => {
    return networkIdentifier != "" && networkIdentifierError == "";
  }, [networkIdentifier, networkIdentifierError]);

  const canCreateOrSave = useMemo(() => {
    return isNetworkEntered && isNameEntered && metricError == "";
  }, [isNetworkEntered, isNameEntered, metricError]);

  const singleRoutingPeerGroups = useMemo(() => {
    if (!routingPeer) return [];
    return routingPeer?.groups;
  }, [routingPeer]);

  return (
    <ModalContent maxWidthClass={"max-w-2xl"}>
      <ModalHeader
        icon={
          exitNode ? (
            <IconDirectionSign size={20} />
          ) : (
            <NetworkRoutesIcon className={"fill-netbird"} />
          )
        }
        title={
          exitNode
            ? isFirstExitNode
              ? t("routes.main:routeModal.text.setUpExitNode")
              : t("routes.main:routeModal.text.addExitNode")
            : t("routes.main:routeModal.text.createNewRoute")
        }
        truncate={!!peer}
        description={
          exitNode
            ? peer
              ? t("routes.main:routeModal.text.routeAllTrafficThroughThe", { name: peer.name })
              : t("routes.main:routeModal.text.routeAllInternetTrafficThrough")
            : t("routes.main:routeModal.text.accessLANsAndVPCBy")
        }
        color={exitNode ? "yellow" : "netbird"}
      />

      <Tabs defaultValue={tab} onValueChange={(v) => setTab(v)} value={tab}>
        <TabsList justify={"start"} className={"px-8"}>
          {!(exitNode && peer) && (
            <TabsTrigger
              value={"network"}
              onClick={() => networkRangeRef.current?.focus()}
            >
              <RouteIcon
                size={16}
                className={
                  "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
                }
              />
              {t("routes.main:routeModal.text.route")}
            </TabsTrigger>
          )}

          <TabsTrigger value={"access-control"} disabled={!isNetworkEntered}>
            <FolderGit2
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("common:word.groups")}
          </TabsTrigger>
          <TabsTrigger
            value={"general"}
            disabled={!isGroupsEntered}
            onClick={() => nameRef.current?.focus()}
          >
            <Text
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("routes.main:routeModal.text.nameDescription")}
          </TabsTrigger>
          <TabsTrigger
            value={"settings"}
            disabled={!isNetworkEntered || !isNameEntered || !isGroupsEntered}
          >
            <Settings2
              size={16}
              className={
                "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
              }
            />
            {t("routes.main:routeModal.text.additionalSettings")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={"network"} className={"pb-8"}>
          <div className={"px-8 flex-col flex gap-4"}>
            <div className={cn(exitNode && "hidden")}>
              <Label>{t("routes.main:routeModal.text.routeType")}</Label>
              <HelpText>
                {t("routes.main:routeModal.text.selectYourRouteTypeTo")}
              </HelpText>
              <div className={"flex justify-between items-center w-full"}>
                <ButtonGroup className={"w-full"}>
                  <ButtonGroup.Button
                    variant={routeType == "ip-range" ? "tertiary" : "secondary"}
                    onClick={() => setRouteTyp("ip-range")}
                    className={"w-full"}
                  >
                    <NetworkIcon size={16} />
                    {t("routes.main:routeModal.text.networkRange")}
                  </ButtonGroup.Button>
                  <ButtonGroup.Button
                    variant={routeType == "domains" ? "tertiary" : "secondary"}
                    onClick={() => setRouteTyp("domains")}
                    className={"w-full"}
                    data-testid="route-type-domains"
                  >
                    <GlobeIcon size={16} />
                    {t("routes.main:routeModal.text.domains")}
                  </ButtonGroup.Button>
                </ButtonGroup>
              </div>

              <div
                className={cn(
                  "mt-5 mb-3",
                  routeType !== "ip-range" && "hidden",
                )}
              >
                <Label>{t("routes.main:routeModal.text.networkRange")}</Label>
                <HelpText>{t("routes.main:routeModal.text.addAPrivateIPv4Or")}</HelpText>
                <Input
                  ref={networkRangeRef}
                  customPrefix={<NetworkIcon size={16} />}
                  placeholder={t("routes.main:routeModal.placeholder.eG172160")}
                  value={networkRange}
                  data-testid={"network-range"}
                  className={"font-mono !text-[13px]"}
                  error={cidrError}
                  onChange={(e) => setNetworkRange(e.target.value)}
                />
              </div>

              <div
                className={cn("mt-5 mb-3", routeType !== "domains" && "hidden")}
              >
                <Label>{t("routes.main:routeModal.text.domains")}</Label>
                <HelpText>
                  {t("routes.main:routeModal.text.addDomainsThatDynamicallyResolve")}{" "}<br />{" "}{t("routes.main:routeModal.text.aMaximumOf32Domains")}
                </HelpText>
                <div>
                  {domainRoutes.length > 0 && (
                    <div className={"flex gap-3 w-full mb-3"}>
                      <div className={"flex flex-col gap-2 w-full"}>
                        {domainRoutes.map((domain, i) => {
                          return (
                            <InputDomain
                              key={domain.id}
                              value={domain}
                              data-testid={`domain-input-${i}`}
                              onChange={(d) =>
                                setDomainRoutes({
                                  type: "UPDATE",
                                  index: i,
                                  d,
                                })
                              }
                              onError={setDomainError}
                              onRemove={() =>
                                setDomainRoutes({
                                  type: "REMOVE",
                                  index: i,
                                })
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <Button
                    variant={"dotted"}
                    className={"w-full"}
                    size={"sm"}
                    disabled={domainRoutes.length === 32}
                    data-testid={"add-domain"}
                    onClick={() => setDomainRoutes({ type: "ADD" })}
                  >
                    <PlusIcon size={14} />
                    {t("routes.main:routeModal.text.addDomain")}
                  </Button>
                </div>
                <div className={cn("mt-6 w-full")}>
                  <FullTooltip
                    side={"top"}
                    content={
                      <div className={"text-xs max-w-xs"}>
                        {t("routes.main:routeModal.text.dNSRecordsForLoadBalanced")}
                      </div>
                    }
                    className={"w-full block"}
                  >
                    <FancyToggleSwitch
                      value={keepRoute}
                      onChange={setKeepRoute}
                      label={
                        <>
                          <div className={"flex gap-2"}>
                            <GlobeLockIcon size={14} />
                            {t("routes.main:routeModal.text.keepRoutes")}
                            <CircleHelp
                              size={12}
                              className={"top-[1px] relative text-nb-gray-300"}
                            />
                          </div>
                        </>
                      }
                      helpText={
                        <div>
                          {t("routes.main:routeModal.text.retainPreviouslyResolvedRoutesAfter")}
                        </div>
                      }
                    />
                  </FullTooltip>
                </div>
              </div>
            </div>

            {exitNode && peer ? (
              <></>
            ) : (
              <SegmentedTabs
                value={peerTab}
                onChange={(state) => {
                  setPeerTab(state);
                  setRoutingPeer(undefined);
                  setRoutingPeerGroups([]);
                }}
              >
                <SegmentedTabs.List>
                  <SegmentedTabs.Trigger
                    value={"routing-peer"}
                    data-testid="route-tab-routing-peer"
                  >
                    <MonitorSmartphoneIcon size={16} />
                    {t("routes.main:routeAddRoutingPeerModal.text.routingPeer")}
                  </SegmentedTabs.Trigger>

                  <SegmentedTabs.Trigger
                    value={"peer-group"}
                    disabled={!!peer}
                    data-testid="route-tab-peer-group"
                  >
                    <FolderGit2 size={16} />
                    {t("routes.main:routeModal.text.peerGroup")}
                  </SegmentedTabs.Trigger>
                </SegmentedTabs.List>
                <SegmentedTabs.Content value={"routing-peer"}>
                  <div>
                    <HelpText>
                      {t("routes.main:routeModal.text.assignASinglePeerAs")}
                      {exitNode ? t("routes.main:routeModal.text.exitNode2") : t("routes.main:routeModal.text.networkRoute")}
                    </HelpText>
                    <PeerSelector
                      onChange={setRoutingPeer}
                      value={routingPeer}
                      disabled={!!peer}
                    />
                  </div>
                </SegmentedTabs.Content>
                <SegmentedTabs.Content value={"peer-group"}>
                  <div>
                    <HelpText>
                      {t("routes.main:routeModal.text.assignAPeerGroupWith")}
                      {exitNode ? t("routes.main:routeModal.text.exitNodes") : t("routes.main:routeModal.text.routingPeers")}
                    </HelpText>
                    <PeerGroupSelector
                      data-testid={"routing-peer-groups-selector"}
                      max={1}
                      onChange={setRoutingPeerGroups}
                      values={routingPeerGroups}
                    />
                  </div>
                </SegmentedTabs.Content>
              </SegmentedTabs>
            )}
          </div>
        </TabsContent>
        <TabsContent value={"access-control"} className={"pb-8"}>
          <div className={"px-8 flex-col flex gap-6"}>
            <div>
              <Label>{t("common:word.distributionGroups")}</Label>
              <HelpText>
                {exitNode
                  ? peer
                    ? t("routes.main:routeModal.text.routeAllInternetTrafficThrough2")
                    : t("routes.main:routeModal.text.routeAllInternetTrafficThrough3")
                  : t("routes.main:routeAddRoutingPeerModal.text.advertiseThisRouteToPeers")}
              </HelpText>
              <PeerGroupSelector
                data-testid={"distribution-groups-selector"}
                onChange={setGroups}
                values={groups}
              />
            </div>
            <div>
              <Label>{t("routes.main:routeAddRoutingPeerModal.text.accessControlGroupsOptional")}</Label>
              <HelpText>
                {t("routes.main:routeModal.text.theseGroupsAllowYouTo")}
              </HelpText>
              <PeerGroupSelector
                data-testid={"access-control-groups-selector"}
                onChange={setAccessControlGroups}
                values={accessControlGroups}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value={"general"} className={"px-8 pb-6"}>
          <div className={"flex flex-col gap-6"}>
            <div>
              <Label>{t("routes.main:routeAddRoutingPeerModal.text.networkIdentifier")}</Label>
              <HelpText>
                {t("routes.main:routeModal.text.addAUniqueNetworkIdentifier")}
              </HelpText>
              <Input
                error={networkIdentifierError}
                autoFocus={true}
                data-testid={"network-identifier"}
                tabIndex={0}
                ref={nameRef}
                placeholder={t("routes.main:routeModal.placeholder.eGAwsEuCentral")}
                value={networkIdentifier}
                onChange={(e) => setNetworkIdentifier(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("common:word.descriptionOptional")}</Label>
              <HelpText>
                {t("routes.main:routeModal.text.writeAShortDescriptionTo")}
              </HelpText>
              <Textarea
                data-testid={"description"}
                placeholder={t("routes.main:routeModal.placeholder.eGRouteToAccess")}
                value={description}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value={"settings"} className={"pb-4"}>
          <div className={"px-8 flex flex-col gap-6"}>
            <FancyToggleSwitch
              value={enabled}
              onChange={setEnabled}
              label={
                <>
                  <Power size={15} />
                  {t("routes.main:routeModal.text.enableRoute")}
                </>
              }
              helpText={t("routes.main:routeModal.helpText.useThisSwitchToEnable")}
            />

            {exitNode && (
              <FancyToggleSwitch
                value={isForced}
                onChange={setIsForced}
                label={
                  <>
                    <IconDirectionSign size={15} />
                    {t("routes.main:routeModal.text.autoApplyRoute")}
                  </>
                }
                helpText={t("routes.main:routeModal.helpText.automaticallyApplyThisExitNode")}
              />
            )}

            {!exitNode && (
              <RoutingPeerMasqueradeSwitch
                value={masquerade}
                onChange={setMasquerade}
                disabled={isNonLinuxRoutingPeer}
                routingPeerGroupId={routingPeerGroups?.[0]?.id}
              />
            )}

            <div className={cn("flex justify-between")}>
              <div>
                <Label>{t("routes.main:routeModal.text.metric")}</Label>
                <HelpText className={"max-w-[200px]"}>
                  {t("routes.main:routeModal.text.aLowerMetricIndicatesHigher")}
                </HelpText>
              </div>

              <Input
                min={1}
                max={9999}
                maxWidthClass={"max-w-[200px]"}
                value={metric}
                error={metricError}
                data-testid={"metric"}
                errorTooltip={true}
                type={"number"}
                onChange={(e) => setMetric(e.target.value)}
                customPrefix={
                  <ArrowDownWideNarrow
                    size={16}
                    className={"text-nb-gray-300"}
                  />
                }
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ModalFooter className={"items-center"}>
        <div className={"w-full"}>
          <Paragraph className={"text-sm mt-auto"}>
            {t("common:word.learnMoreAbout")}
            <InlineLink
              href={
                exitNode
                  ? "https://docs.netbird.io/how-to/configuring-default-routes-for-internet-traffic"
                  : "https://docs.netbird.io/how-to/routing-traffic-to-private-networks"
              }
              target={"_blank"}
            >
              {exitNode ? t("routes.main:routeModal.text.exitNodes2") : t("common:word.networkRoutes")}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>
        <div className={"flex gap-3 w-full justify-end"}>
          {(tab == "network" || (tab == "access-control" && exitNode)) && (
            <ModalClose asChild={true}>
              <Button variant={"secondary"}>{t("common:word.cancel")}</Button>
            </ModalClose>
          )}

          {tab == "access-control" && !exitNode && (
            <Button variant={"secondary"} onClick={() => setTab("network")}>
              {t("common:word.back")}
            </Button>
          )}

          {tab == "general" && (
            <Button
              variant={"secondary"}
              onClick={() => setTab("access-control")}
            >
              {t("common:word.back")}
            </Button>
          )}

          {tab == "settings" && (
            <Button variant={"secondary"} onClick={() => setTab("general")}>
              {t("common:word.back")}
            </Button>
          )}

          {tab == "network" && (
            <Button
              variant={"primary"}
              onClick={() => setTab("access-control")}
              disabled={!isNetworkEntered}
              data-testid="route-continue"
            >
              {t("common:word.continue")}
            </Button>
          )}
          {tab == "access-control" && (
            <Button
              variant={"primary"}
              onClick={() => setTab("general")}
              disabled={!isGroupsEntered}
              data-testid="route-continue"
            >
              {t("common:word.continue")}
            </Button>
          )}
          {tab == "general" && (
            <Button
              variant={"primary"}
              onClick={() => setTab("settings")}
              disabled={!isNameEntered || !isNetworkEntered}
              data-testid="route-continue"
            >
              {t("common:word.continue")}
            </Button>
          )}
          {tab == "settings" && (
            <Button
              variant={"primary"}
              disabled={!canCreateOrSave}
              data-testid={"submit-route"}
              onClick={createRouteHandler}
            >
              <PlusCircle size={16} />
              {exitNode ? t("routes.main:routeModal.text.addExitNode") : t("routes.main:routeAddRoutingPeerModal.text.addRoute")}
            </Button>
          )}
        </div>
      </ModalFooter>
    </ModalContent>
  );
}
