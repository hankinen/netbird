"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import Card from "@components/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import FullTooltip from "@components/FullTooltip";
import InlineLink from "@components/InlineLink";
import { SkeletonNetwork } from "@components/skeletons/SkeletonNetwork";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import useRedirect from "@hooks/useRedirect";
import useFetchApi from "@utils/api";
import { cn, singularize } from "@utils/helpers";
import {
  ArrowUpRightIcon,
  HelpCircle,
  Layers3Icon,
  MoreVertical,
  PencilLineIcon,
  ServerIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";
import CircleIcon from "@/assets/icons/CircleIcon";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import PeerIcon from "@/assets/icons/PeerIcon";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ReverseProxiesProvider, {
  flattenReverseProxies,
  useReverseProxies,
} from "@/contexts/ReverseProxiesProvider";
import useUrlTab from "@/hooks/useUrlTab";
import { t } from "@/i18n";
import { Network, NetworkResource, NetworkRouter } from "@/interfaces/Network";
import PageContainer from "@/layouts/PageContainer";
import { NetworkInformationSquare } from "@/modules/networks/misc/NetworkInformationSquare";
import { NetworkAccessControlProvider } from "@/modules/networks/NetworkAccessControlProvider";
import {
  NetworkProvider,
  useNetworksContext,
} from "@/modules/networks/NetworkProvider";
import { ResourcesTabContent } from "@/modules/networks/resources/ResourcesTabContent";
import { NetworkRoutingPeersTabContent } from "@/modules/networks/routing-peers/NetworkRoutingPeersTabContent";
import { ReverseProxyFlatTargetsTabContent } from "@/modules/reverse-proxy/targets/flat/ReverseProxyFlatTargetsTabContent";
import { usePageHeader } from "@/theme/shell/pageHeader";
import {
  PageHeaderActions,
  PageHeaderTitle,
} from "@/theme/shell/PageHeaderActions";
export default function NetworkDetailPage() {
  const queryParameter = useSearchParams();
  const networkId = queryParameter.get("id");
  const { data: network, isLoading } = useFetchApi<Network>(
    `/networks/${networkId}`,
    true,
  );

  useRedirect("/networks", false, !networkId);

  return network && !isLoading ? (
    <ReverseProxiesProvider initialNetwork={network}>
      <NetworkOverview network={network} />
    </ReverseProxiesProvider>
  ) : (
    <SkeletonNetwork />
  );
}

function NetworkOverview({ network }: Readonly<{ network: Network }>) {
  const { permission } = usePermissions();

  const { data: resources, isLoading: isResourcesLoading } = useFetchApi<
    NetworkResource[]
  >(`/networks/${network.id}/resources`);
  const { data: routers, isLoading: isRoutersLoading } = useFetchApi<
    NetworkRouter[]
  >(`/networks/${network.id}/routers`);

  const { reverseProxies, isLoading: isServicesLoading } = useReverseProxies();
  const services = useMemo(
    () => flattenReverseProxies({ reverseProxies, network }),
    [reverseProxies, network],
  );

  const [tab, setTab] = useUrlTab(
    ["resources", "routing-peers", "services"],
    "resources",
  );

  const isActive = !!(
    network?.routing_peers_count && network.routing_peers_count > 0
  );

  usePageHeader({
    title: network.name,
    titleText: network.name,
    subtitle: network.description,
    backHref: "/networks",
  });

  return (
    <PageContainer>
      <NetworkAccessControlProvider>
        <NetworkProvider network={network}>
          <div className={"p-default py-6"}>
            <Breadcrumbs>
              <Breadcrumbs.Item
                href={"/networks"}
                label={t("common:word.networks")}
                disabled={!permission.networks.read}
                icon={<NetworkRoutesIcon size={13} />}
              />
              <Breadcrumbs.Item
                href={"/network"}
                label={network.name}
                active={true}
              />
            </Breadcrumbs>

            {/* @theme: page-template. Breadcrumb to the top bar (Breadcrumbs
                adapter), name + status to the page header bar, the ⋮ menu to
                its actions row (bottom bar on phones); see src/theme/README.md. */}
            <PageHeaderTitle>
              <span className={"inline-flex items-center gap-3"}>
                <CircleIcon active={isActive} size={12} className={"shrink-0"} />
                {network.name}
              </span>
            </PageHeaderTitle>
            <PageHeaderActions>
              <NetworkActions />
            </PageHeaderActions>

            <div className={"flex gap-10 w-full max-w-6xl items-start"}>
              <NetworkInformationCard network={network} />
            </div>
          </div>

          <Tabs
            defaultValue={tab}
            onValueChange={setTab}
            value={tab}
            className={"pb-0 mb-0"}
          >
            <TabsList justify={"start"} className={"px-8"}>
              <TabsTrigger value={"resources"} data-testid="network-tab-resources">
                <Layers3Icon size={14} />
                {singularize("Resources", network?.resources?.length)}
              </TabsTrigger>
              <TabsTrigger
                value={"routing-peers"}
                data-testid="network-tab-routing-peers"
              >
                <PeerIcon
                  size={12}
                  className={
                    "fill-nb-gray-500 group-data-[state=active]/trigger:fill-netbird transition-all"
                  }
                />
                {singularize("Routing Peers", network?.routing_peers_count)}
              </TabsTrigger>
              <TabsTrigger value={"services"} data-testid="network-tab-services">
                <ReverseProxyIcon
                  size={16}
                  className={
                    "fill-nb-gray-500 group-data-[state=active]/trigger:fill-netbird transition-all"
                  }
                />
                {singularize("Services", services.length)}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={"resources"} className={"pb-8"}>
              <ResourcesTabContent
                data={resources}
                isLoading={isResourcesLoading}
              />
            </TabsContent>

            <TabsContent value={"routing-peers"} className={"pb-8"}>
              <NetworkRoutingPeersTabContent
                routers={routers}
                isLoading={isRoutersLoading}
              />
            </TabsContent>

            <TabsContent value={"services"} className={"pb-8"}>
              <ReverseProxyFlatTargetsTabContent
                targets={services}
                isLoading={isServicesLoading}
              />
            </TabsContent>
          </Tabs>
        </NetworkProvider>
      </NetworkAccessControlProvider>
    </PageContainer>
  );
}

function NetworkActions() {
  const { permission } = usePermissions();
  const { deleteNetwork, openEditNetworkModal, network } = useNetworksContext();
  const router = useRouter();

  if (!network) return;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        asChild={true}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Button variant={"secondary"} className={"!px-3"} data-testid="network-detail-actions">
          <MoreVertical size={16} className={"shrink-0"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto" align="end">
        <DropdownMenuItem
          onClick={() => openEditNetworkModal(network)}
          disabled={!permission.networks.update}
          data-testid="rename-network"
        >
          <div className={"flex gap-3 items-center"}>
            <PencilLineIcon size={14} className={"shrink-0"} />
            {t("network.page:page.text.rename")}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() =>
            deleteNetwork(network).then(() => router.push("/networks"))
          }
          variant={"danger"}
          disabled={!permission.networks.delete}
        >
          <div className={"flex gap-3 items-center"}>
            <Trash2 size={14} className={"shrink-0"} />
            {t("common:word.delete")}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NetworkInformationCard({ network }: Readonly<{ network: Network }>) {
  const isHighlyAvailable = !!(
    network?.routing_peers_count && network?.routing_peers_count >= 2
  );

  const disabledText = useMemo(
    () => (
      <>
        {t("network.page:page.text.highAvailabilityIsCurrently")}{" "}
        <span className={"text-yellow-400 font-medium"}>{t("network.page:page.text.inactive")}</span>{" "}{t("network.page:page.text.forThisNetwork")}
      </>
    ),
    [],
  );

  const enabledText = useMemo(
    () => (
      <>
        {t("common:word.highAvailabilityIs")}{" "}
        <span className={"text-green-500 font-medium"}>{t("network.page:page.text.active")}</span>{" "}{t("network.page:page.text.forThisNetwork")}
      </>
    ),
    [],
  );

  const policyCount = network.policies?.length ?? 0;

  return (
    <Card className={"w-full lg:w-1/2"}>
      <Card.List>
        <Card.ListItem
          tooltip={false}
          label={
            <>
              <ServerIcon size={16} />
              {t("network.page:page.text.highAvailability")}
            </>
          }
          value={
            <FullTooltip
              interactive={false}
              content={
                <div className={"max-w-xs text-xs"}>
                  {isHighlyAvailable ? enabledText : disabledText}
                  {isHighlyAvailable ? (
                    <div className={"inline-flex mt-2"}>
                      {t("network.page:page.text.youCanAddMoreRouting")}
                    </div>
                  ) : (
                    <div className={"inline-flex mt-2"}>
                      {t("network.page:page.text.goAheadAndAddMore")}
                    </div>
                  )}
                </div>
              }
            >
              <div
                className={cn(
                  "flex gap-2.5 items-center text-nb-gray-300 text-sm cursor-help",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    !isHighlyAvailable ? "bg-yellow-400" : "bg-green-500",
                  )}
                ></span>
                {isHighlyAvailable ? t("common:word.active") : t("common:word.inactive")}
                <HelpCircle size={12} />
              </div>
            </FullTooltip>
          }
        />
        <Card.ListItem
          tooltip={false}
          label={
            policyCount > 0 ? (
              <>
                <ShieldCheckIcon size={16} className={"text-green-500"} />
                {policyCount}{" "}
                {policyCount === 1 ? t("network.page:page.text.activePolicy") : t("network.page:page.text.activePolicies")}
              </>
            ) : (
              <>
                <ShieldXIcon size={16} className={"text-red-500"} />
                {t("network.page:page.text.noActivePolicies")}
              </>
            )
          }
          value={
            policyCount > 0 ? (
              <InlineLink href={"/access-control"}>
                {t("network.page:page.text.goToPolicies")}
                <ArrowUpRightIcon size={14} />
              </InlineLink>
            ) : null
          }
        />
      </Card.List>
    </Card>
  );
}
