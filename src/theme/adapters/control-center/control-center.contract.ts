/**
 * Compile-time contract between upstream's control-center node, edge, handle
 * and toolbar components and the adapters that replace them (one exact
 * tsconfig alias each). Each adapter declares its props as
 * `Parameters<typeof Upstream>[0]`, so a drift can only come from upstream
 * changing a signature; this file makes `tsc` say so in one place, the way
 * SidebarItem.contract.ts does for the shell.
 */
import type UpstreamAnimatedLine from "../../../modules/control-center/edges/AnimatedLine";
import type { ConnectionLine as UpstreamConnectionLine } from "../../../modules/control-center/edges/ConnectionLine";
import type { DirectionIn as UpstreamDirectionIn } from "../../../modules/control-center/edges/DirectionIn";
import type { SimpleConnection as UpstreamSimpleConnection } from "../../../modules/control-center/edges/SimpleConnection";
import type { SmartEdge as UpstreamSmartEdge } from "../../../modules/control-center/edges/SmartEdge";
import type { ConnectHandle as UpstreamConnectHandle } from "../../../modules/control-center/handles/ConnectHandle";
import type { AgentPolicyNode as UpstreamAgentPolicyNode } from "../../../modules/control-center/nodes/AgentPolicyNode";
import type { GroupNode as UpstreamGroupNode } from "../../../modules/control-center/nodes/GroupNode";
import type { MoreResourcesNode as UpstreamMoreResourcesNode } from "../../../modules/control-center/nodes/MoreResourcesNode";
import type { NetworkNode as UpstreamNetworkNode } from "../../../modules/control-center/nodes/NetworkNode";
import type { PeerNode as UpstreamPeerNode } from "../../../modules/control-center/nodes/PeerNode";
import type { PolicyNode as UpstreamPolicyNode } from "../../../modules/control-center/nodes/PolicyNode";
import type { ProviderNode as UpstreamProviderNode } from "../../../modules/control-center/nodes/ProviderNode";
import type { ResourceGroupNode as UpstreamResourceGroupNode } from "../../../modules/control-center/nodes/ResourceGroupNode";
import type { ResourceNode as UpstreamResourceNode } from "../../../modules/control-center/nodes/ResourceNode";
import type { SelectGroupNode as UpstreamSelectGroupNode } from "../../../modules/control-center/nodes/SelectGroupNode";
import type { SelectPeerNode as UpstreamSelectPeerNode } from "../../../modules/control-center/nodes/SelectPeerNode";
import type { SelectUserNode as UpstreamSelectUserNode } from "../../../modules/control-center/nodes/SelectUserNode";
import type { StandaloneResourceNode as UpstreamStandaloneResourceNode } from "../../../modules/control-center/nodes/StandaloneResourceNode";
import type { ToolbarButton as UpstreamToolbarButton } from "../../../modules/control-center/toolbar/ToolbarButton";
import type { ToolbarContainer as UpstreamToolbarContainer } from "../../../modules/control-center/toolbar/ToolbarContainer";
import type { ToolbarDivider as UpstreamToolbarDivider } from "../../../modules/control-center/toolbar/ToolbarDivider";
import type { ToolbarGroup as UpstreamToolbarGroup } from "../../../modules/control-center/toolbar/ToolbarGroup";
import type { AgentPolicyNode } from "./AgentPolicyNode";
import type AnimatedLine from "./AnimatedLine";
import type { ConnectHandle } from "./ConnectHandle";
import type { ConnectionLine } from "./ConnectionLine";
import type { DirectionIn } from "./DirectionIn";
import type { GroupNode } from "./GroupNode";
import type { MoreResourcesNode } from "./MoreResourcesNode";
import type { NetworkNode } from "./NetworkNode";
import type { PeerNode } from "./PeerNode";
import type { PolicyNode } from "./PolicyNode";
import type { ProviderNode } from "./ProviderNode";
import type { ResourceGroupNode } from "./ResourceGroupNode";
import type { ResourceNode } from "./ResourceNode";
import type { SelectGroupNode } from "./SelectGroupNode";
import type { SelectPeerNode } from "./SelectPeerNode";
import type { SelectUserNode } from "./SelectUserNode";
import type { SimpleConnection } from "./SimpleConnection";
import type { SmartEdge } from "./SmartEdge";
import type { StandaloneResourceNode } from "./StandaloneResourceNode";
import type { ToolbarButton } from "./ToolbarButton";
import type { ToolbarContainer } from "./ToolbarContainer";
import type { ToolbarDivider } from "./ToolbarDivider";
import type { ToolbarGroup } from "./ToolbarGroup";

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type P<T extends (...a: never[]) => unknown> = Parameters<T>[0];

export const contracts: {
  peerNode: Same<P<typeof UpstreamPeerNode>, P<typeof PeerNode>>;
  groupNode: Same<P<typeof UpstreamGroupNode>, P<typeof GroupNode>>;
  policyNode: Same<P<typeof UpstreamPolicyNode>, P<typeof PolicyNode>>;
  agentPolicyNode: Same<
    P<typeof UpstreamAgentPolicyNode>,
    P<typeof AgentPolicyNode>
  >;
  providerNode: Same<P<typeof UpstreamProviderNode>, P<typeof ProviderNode>>;
  resourceNode: Same<P<typeof UpstreamResourceNode>, P<typeof ResourceNode>>;
  standaloneResourceNode: Same<
    P<typeof UpstreamStandaloneResourceNode>,
    P<typeof StandaloneResourceNode>
  >;
  resourceGroupNode: Same<
    P<typeof UpstreamResourceGroupNode>,
    P<typeof ResourceGroupNode>
  >;
  moreResourcesNode: Same<
    P<typeof UpstreamMoreResourcesNode>,
    P<typeof MoreResourcesNode>
  >;
  networkNode: Same<P<typeof UpstreamNetworkNode>, P<typeof NetworkNode>>;
  selectPeerNode: Same<
    P<typeof UpstreamSelectPeerNode>,
    P<typeof SelectPeerNode>
  >;
  selectGroupNode: Same<
    P<typeof UpstreamSelectGroupNode>,
    P<typeof SelectGroupNode>
  >;
  selectUserNode: Same<
    P<typeof UpstreamSelectUserNode>,
    P<typeof SelectUserNode>
  >;
  smartEdge: Same<P<typeof UpstreamSmartEdge>, P<typeof SmartEdge>>;
  simpleConnection: Same<
    P<typeof UpstreamSimpleConnection>,
    P<typeof SimpleConnection>
  >;
  animatedLine: Same<P<typeof UpstreamAnimatedLine>, P<typeof AnimatedLine>>;
  directionIn: Same<P<typeof UpstreamDirectionIn>, P<typeof DirectionIn>>;
  connectionLine: Same<
    P<typeof UpstreamConnectionLine>,
    P<typeof ConnectionLine>
  >;
  connectHandle: Same<P<typeof UpstreamConnectHandle>, P<typeof ConnectHandle>>;
  toolbarButton: Same<P<typeof UpstreamToolbarButton>, P<typeof ToolbarButton>>;
  toolbarContainer: Same<
    P<typeof UpstreamToolbarContainer>,
    P<typeof ToolbarContainer>
  >;
  toolbarGroup: Same<P<typeof UpstreamToolbarGroup>, P<typeof ToolbarGroup>>;
  toolbarDivider: Same<
    P<typeof UpstreamToolbarDivider>,
    P<typeof ToolbarDivider>
  >;
} = {
  peerNode: true,
  groupNode: true,
  policyNode: true,
  agentPolicyNode: true,
  providerNode: true,
  resourceNode: true,
  standaloneResourceNode: true,
  resourceGroupNode: true,
  moreResourcesNode: true,
  networkNode: true,
  selectPeerNode: true,
  selectGroupNode: true,
  selectUserNode: true,
  smartEdge: true,
  simpleConnection: true,
  animatedLine: true,
  directionIn: true,
  connectionLine: true,
  connectHandle: true,
  toolbarButton: true,
  toolbarContainer: true,
  toolbarGroup: true,
  toolbarDivider: true,
};
