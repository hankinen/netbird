"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import FullTooltip from "@components/FullTooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@components/Popover";
import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import { cn } from "@utils/helpers";
import { useReactFlow } from "@xyflow/react";
import { sortBy } from "lodash";
import {
  ArrowLeftIcon,
  CircleMinusIcon,
  CirclePlusIcon,
  FocusIcon,
  FullscreenIcon,
  InfoIcon,
  LayoutGridIcon,
  MoreVerticalIcon,
  NetworkIcon,
  SquarePenIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import {
  useCanvasState,
  useControlCenterUI,
  useDestinationGroup,
} from "@/modules/control-center/contexts/ControlCenterContext";
import { CanvasToolbar } from "@/modules/control-center/draft/CanvasToolbar";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { DraftModeSwitcher } from "@/modules/control-center/draft/DraftModeSwitcher";
import {
  FlowSelector,
  FlowView,
} from "@/modules/control-center/header/FlowSelector";
import { NetworkRoutingPeerCount } from "@/modules/control-center/header/NetworkRoutingPeerCount";
import { useCloseOnCanvasClick } from "@/modules/control-center/hooks/useCloseOnCanvasClick";
import { useControlCenterData } from "@/modules/control-center/hooks/useControlCenterData";
import { isInputFocused } from "@/modules/control-center/hooks/useControlCenterShortcuts";
import { useDeleteNetwork } from "@/modules/control-center/hooks/useDeleteNetwork";
import { useDraftGroupActions } from "@/modules/control-center/hooks/useDraftGroupActions";
import { useFrameRouterRows } from "@/modules/control-center/hooks/useFrameRouterRows";
import { RoutingPeersBar } from "@/modules/control-center/panels/RoutingPeersBar";
import {
  isDraftNetworkNode,
  isFrameNode,
  useStructuralNodes,
} from "@/modules/control-center/utils/helpers";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import {
  EdgeSwatch,
  GraphDefs,
  GraphDot,
  GraphLegend,
  GraphLodSync,
} from "@/theme/graph";
import { usePageHeader, usePageHeaderSlot } from "@/theme/shell/pageHeader";
import { ControlCenterHeader as UpstreamControlCenterHeader } from "../../../modules/control-center/header/ControlCenterHeader";

/**
 * The chrome around the canvas, replacing
 * src/modules/control-center/header/ControlCenterHeader.tsx through its
 * alias. Instead of cards floating over the canvas: the page registers
 * itself with the shell (title in the page header bar, the Live / Draft
 * switch and the draft actions portalled into the bar's slot), the view
 * switch, network selector and canvas tools sit in one chrome row above the
 * canvas, the focus pill is a transient status at the top centre and the
 * draft dock stays at the bottom. Every `cc-*` test id is upstream's. The
 * upstream feedback link is not rendered in the AntD build (decision 4 of
 * the control-center plan).
 * @replaces-file src/modules/control-center/header/ControlCenterHeader.tsx sha256:6633d2a61b1a8d77
 */
export * from "../../../modules/control-center/header/ControlCenterHeader";

export const ControlCenterHeader = () =>
  ANTD_THEME_ENABLED ? <ThemedHeader /> : <UpstreamControlCenterHeader />;

function ThemedHeader() {
  usePageHeader({ title: t("nav:navigation.label.controlCenter") });
  const slot = usePageHeaderSlot();
  return (
    <>
      <GraphDefs />
      <GraphLodSync />
      {slot && createPortal(<DraftModeSwitcher />, slot)}
      <div className={"nb-graph-chrome"} data-testid={"cc-chrome"}>
        <div className={"nb-graph-chrome__group"}>
          <ViewControls />
        </div>
        <div className={"nb-graph-chrome__spacer"} />
        <CanvasTools />
      </div>
      <FocusModePill />
      <DraftDock />
    </>
  );
}

/* ---- left: view switch, network selector, drill-down controls ------------ */

// Sized to the longest option label, clamped to 256px.
const networkSelectorWidth = (labels: unknown[]) => {
  const longest = labels.reduce<number>(
    (m, l) => Math.max(m, typeof l === "string" ? l.length : 0),
    0,
  );
  return Math.min(256, Math.max(160, 70 + longest * 7));
};

function ChromeButton({
  className,
  tooltip,
  shortcut,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tooltip?: string;
  shortcut?: string;
}) {
  const button = (
    <button
      type={"button"}
      className={cn("nb-graph-chrome__button", className)}
      {...props}
    />
  );
  if (!tooltip) return button;
  return (
    <FullTooltip
      content={
        <span className={"flex items-center text-xs"}>
          {tooltip}
          {shortcut && <kbd className={"nb-graph-kbd"}>{shortcut}</kbd>}
        </span>
      }
      side={"bottom"}
      sideOffset={8}
      interactive={false}
      contentClassName={"!px-2 !py-1.5"}
      variant={"lighter"}
    >
      {button}
    </FullTooltip>
  );
}

function BackButton({
  onClick,
  testId,
}: {
  onClick: () => void;
  testId: string;
}) {
  return (
    <ChromeButton
      data-testid={testId}
      aria-label={t("common:word.back")}
      onClick={onClick}
    >
      <ArrowLeftIcon size={16} />
    </ChromeButton>
  );
}

function NetworkActionsMenu({
  networkNodeId,
  onDeleted,
}: {
  networkNodeId: string;
  onDeleted?: () => void;
}) {
  const { isDraft, setNetworkEditor } = useDraftMode();
  const { permission } = usePermissions();
  const reactFlow = useReactFlow();
  const { removeNodeWithEdges } = useDraftGroupActions();
  const deleteNetwork = useDeleteNetwork();

  const isDraftNew = isDraftNetworkNode(
    reactFlow.getNodes().find((n) => n.id === networkNodeId),
  );

  // Live actions hit the API directly and follow the node menu's gates; draft
  // ones only queue changes, which the deploy pre-flight re-checks.
  const mayEdit = isDraft || permission.networks.update;
  const mayDelete = isDraft || permission.networks.delete;

  const handleDelete = React.useCallback(async () => {
    // deleteNetwork resolves false when the confirmation is cancelled.
    const removed = isDraftNew
      ? (removeNodeWithEdges(networkNodeId), true)
      : await deleteNetwork(networkNodeId);
    if (removed) onDeleted?.();
  }, [
    isDraftNew,
    networkNodeId,
    removeNodeWithEdges,
    deleteNetwork,
    onDeleted,
  ]);

  if (!mayEdit && !mayDelete) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type={"button"}
          aria-label={t(
            "control-center.header:controlCenterHeader.ariaLabel.networkActions",
          )}
          className={"nb-graph-chrome__button"}
        >
          <MoreVerticalIcon size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={"start"} className={"w-[180px]"}>
        {mayEdit && (
          <DropdownMenuItem onClick={() => setNetworkEditor({ networkNodeId })}>
            <div className={"flex gap-3 items-center"}>
              <SquarePenIcon size={14} className={"shrink-0"} />
              {t("common:word.edit")}
            </div>
          </DropdownMenuItem>
        )}
        {mayEdit && mayDelete && <DropdownMenuSeparator />}
        {mayDelete && (
          <DropdownMenuItem onClick={handleDelete} variant={"danger"}>
            <div className={"flex gap-3 items-center"}>
              {isDraftNew ? (
                <CircleMinusIcon size={14} className={"shrink-0"} />
              ) : (
                <Trash2Icon size={14} className={"shrink-0"} />
              )}
              {isDraftNew ? t("common:word.remove") : t("common:word.delete")}
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddResourceButton({ networkNodeId }: { networkNodeId: string }) {
  const { setResourceEditor } = useDraftMode();
  return (
    <ChromeButton
      data-testid={"cc-add-resource"}
      onClick={() =>
        setResourceEditor({ createInNetworkNodeId: networkNodeId })
      }
    >
      <CirclePlusIcon size={14} />
      {t("common:word.addResource")}
    </ChromeButton>
  );
}

function NetworkSelect({
  value,
  options,
  onChange,
  squareRight,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  squareRight?: boolean;
}) {
  // Controlled because the ReactFlow pane's stopPropagation hides canvas
  // clicks from Radix's own outside-detection.
  const [open, setOpen] = React.useState(false);
  useCloseOnCanvasClick(open, () => setOpen(false));
  return (
    <div
      className={"nb-graph-chrome__select"}
      style={{ width: networkSelectorWidth(options.map((o) => o.label)) }}
    >
      <SelectDropdown
        variant={"secondary"}
        deferChange
        value={value}
        onChange={onChange}
        options={options}
        showSearch={true}
        open={open}
        onOpenChange={setOpen}
        popoverMinWidth={220}
        className={cn(squareRight && "!rounded-r-none")}
        size={"xs"}
      />
    </div>
  );
}

function DraftDrillDownHeader() {
  const {
    drillDownNetworkNodeId,
    setDrillDownNetworkNodeId,
    setRoutingPeerModal,
  } = useDraftMode();
  const { nodes, currentView } = useCanvasState();
  const { rows, count } = useFrameRouterRows(
    drillDownNetworkNodeId ?? undefined,
    !!drillDownNetworkNodeId,
  );

  const frameOptions = React.useMemo(() => {
    const options: SelectOption[] = sortBy(
      nodes
        .filter((n) => isFrameNode(n))
        .map((n) => ({
          value: n.id,
          label:
            (n.data as { network?: { name?: string } })?.network?.name ??
            t("control-center.header:controlCenterHeader.text.network"),
          icon: NetworkIcon,
        })),
      "label",
    );
    options.unshift({
      value: "",
      label: t("control-center.header:controlCenterHeader.label.allNetworks"),
      icon: () => <LayoutGridIcon size={14} />,
    } as SelectOption);
    return options;
  }, [nodes]);

  const drilled = !!drillDownNetworkNodeId;

  // The overview selector belongs only to networks-view drafts; the
  // drill-down header itself is view-agnostic.
  if (!drilled && currentView !== FlowView.NETWORKS) return null;
  if (!drilled && frameOptions.length <= 1) return null;

  return (
    <>
      {drilled && (
        <BackButton
          testId={"cc-drill-back"}
          onClick={() => setDrillDownNetworkNodeId(null)}
        />
      )}
      <div className={"flex min-w-0 items-stretch"}>
        <NetworkSelect
          value={drillDownNetworkNodeId ?? ""}
          onChange={(nodeId) => setDrillDownNetworkNodeId(nodeId || null)}
          options={frameOptions}
          squareRight={drilled}
        />
        {drilled && (
          <NetworkActionsMenu
            networkNodeId={drillDownNetworkNodeId}
            onDeleted={() => setDrillDownNetworkNodeId(null)}
          />
        )}
      </div>
      {drilled && (
        <>
          <RoutingPeersBar
            rows={rows}
            count={count}
            onAdd={() =>
              setRoutingPeerModal({ networkNodeId: drillDownNetworkNodeId })
            }
          />
          <AddResourceButton networkNodeId={drillDownNetworkNodeId} />
        </>
      )}
    </>
  );
}

function ViewControls() {
  const { currentView, selectedNetwork } = useCanvasState();
  const { isDraft } = useDraftMode();
  const { networkOptions, currentNetwork, onViewChange, onNetworkSelect } =
    useControlCenterUI();
  const { networks } = useControlCenterData();
  const { permission } = usePermissions();
  const hasNetworks = (networks?.length ?? 0) > 0;
  // Live-only header: the ⋯ menu self-hides on missing permissions, and the
  // select's squared corner must follow it.
  const showNetworkActions =
    permission.networks.update || permission.networks.delete;

  if (isDraft) return <DraftDrillDownHeader />;

  return (
    <>
      {selectedNetwork !== "" && (
        <BackButton
          testId={"cc-network-back"}
          onClick={() => onNetworkSelect("")}
        />
      )}
      {selectedNetwork === "" && (
        <FlowSelector value={currentView} onChange={onViewChange} />
      )}
      {currentView === "networks" && hasNetworks && (
        <div className={"flex min-w-0 items-stretch"}>
          <NetworkSelect
            value={selectedNetwork}
            onChange={onNetworkSelect}
            options={networkOptions}
            squareRight={!!selectedNetwork && showNetworkActions}
          />
          {selectedNetwork && showNetworkActions && (
            <NetworkActionsMenu
              networkNodeId={`network-${selectedNetwork}`}
              onDeleted={() => onNetworkSelect("")}
            />
          )}
        </div>
      )}
      {selectedNetwork && currentNetwork && (
        <>
          <NetworkRoutingPeerCount network={currentNetwork} />
          {permission.networks.update && (
            <AddResourceButton networkNodeId={`network-${selectedNetwork}`} />
          )}
        </>
      )}
    </>
  );
}

/* ---- right: focus, fit, legend ------------------------------------------- */

function CanvasTools() {
  const { highlightArmed, setHighlightArmed, focusedNodeId, setFocusedNodeId } =
    useDestinationGroup();
  const reactFlow = useReactFlow();
  const focusing = highlightArmed || focusedNodeId !== "";
  return (
    <div
      className={"nb-graph-chrome__group"}
      role={"toolbar"}
      aria-label={t("components.graph:toolbar.ariaLabel.canvasTools")}
    >
      <ChromeButton
        tooltip={t("components.graph:toolbar.tooltip.focus")}
        shortcut={"F"}
        aria-pressed={focusing}
        onClick={() => {
          if (focusing) {
            setHighlightArmed(false);
            setFocusedNodeId("");
          } else {
            setHighlightArmed(true);
          }
        }}
      >
        <FocusIcon size={16} />
      </ChromeButton>
      <ChromeButton
        tooltip={t("components.graph:toolbar.tooltip.fit")}
        onClick={() =>
          void reactFlow.fitView({ padding: 0.1, duration: 400, maxZoom: 0.8 })
        }
      >
        <FullscreenIcon size={16} />
      </ChromeButton>
      <LegendButton />
    </div>
  );
}

function LegendButton() {
  const [open, setOpen] = React.useState(false);
  useCloseOnCanvasClick(open, () => setOpen(false));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type={"button"}
          className={"nb-graph-chrome__button"}
          aria-pressed={open}
          aria-label={t("components.graph:toolbar.tooltip.legend")}
        >
          <InfoIcon size={16} />
          <span className={"nb-graph-chrome__label"}>
            {t("components.graph:toolbar.tooltip.legend")}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align={"end"} sideOffset={8} className={"p-4"}>
        <GraphLegend
          title={t("components.graph:legend.text.title")}
          rows={[
            {
              key: "allowed",
              swatch: <EdgeSwatch />,
              label: t("components.graph:legend.text.edgeAllowed"),
            },
            {
              key: "both",
              swatch: <EdgeSwatch direction={"both"} />,
              label: t("components.graph:legend.text.edgeBidirectional"),
            },
            {
              key: "disabled",
              swatch: <EdgeSwatch tone={"disabled"} />,
              label: t("components.graph:legend.text.edgeDisabled"),
            },
            {
              key: "draft",
              swatch: <EdgeSwatch tone={"draft"} />,
              label: t("components.graph:legend.text.edgeDraft"),
            },
            {
              key: "policy",
              swatch: (
                <span className={"nb-graph-legend__pill"}>
                  <GraphDot />
                </span>
              ),
              label: t("components.graph:legend.text.nodePolicy"),
            },
            {
              key: "selected",
              swatch: <span className={"nb-graph-legend__ring"} />,
              label: t("components.graph:legend.text.nodeSelected"),
            },
          ]}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ---- status pill and the draft dock -------------------------------------- */

function FocusModePill() {
  const { highlightArmed, setHighlightArmed, focusedNodeId, setFocusedNodeId } =
    useDestinationGroup();
  const nodes = useStructuralNodes();
  const show = highlightArmed || focusedNodeId !== "";

  // "F" arms/exits, Escape exits; pane clicks intentionally don't.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && show && !e.defaultPrevented) {
        setHighlightArmed(false);
        setFocusedNodeId("");
        return;
      }
      if (e.key.toLowerCase() !== "f") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (isInputFocused()) return;
      e.preventDefault();
      if (show) {
        setHighlightArmed(false);
        setFocusedNodeId("");
      } else {
        setHighlightArmed(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [show, setHighlightArmed, setFocusedNodeId]);

  const focusedName = React.useMemo(() => {
    if (!focusedNodeId) return "";
    const data = nodes.find((n) => n.id === focusedNodeId)?.data as
      | {
          peer?: { name?: string };
          resource?: { name?: string };
          group?: { name?: string };
          policy?: { name?: string };
          network?: { name?: string };
          name?: string;
        }
      | undefined;
    return (
      data?.peer?.name ??
      data?.resource?.name ??
      data?.group?.name ??
      data?.policy?.name ??
      data?.network?.name ??
      // Agent policies and providers hold their name at the top level.
      data?.name ??
      ""
    );
  }, [nodes, focusedNodeId]);

  return (
    // Always mounted and animated in CSS: focusing re-renders every node on
    // the canvas to apply the dim, and a JS-driven spring stutters under it.
    <div className={"nb-graph-status-slot"}>
      <div
        className={cn(
          "transition-[opacity,transform,visibility] duration-300 ease-out",
          "motion-reduce:transition-none",
          show
            ? "visible opacity-100 translate-y-0"
            : "invisible opacity-0 -translate-y-6",
        )}
      >
        <div className={"nb-graph-status pointer-events-auto"} role={"status"}>
          <FocusIcon size={14} aria-hidden />
          {focusedNodeId
            ? t("control-center.header:controlCenterHeader.text.focusingOn", {
                value: focusedName || "node",
              })
            : t(
                "control-center.header:controlCenterHeader.text.selectANodeToFocus",
              )}
          <button
            type={"button"}
            onClick={() => {
              setHighlightArmed(false);
              setFocusedNodeId("");
            }}
            className={"nb-graph-status__close"}
            aria-label={t(
              "control-center.header:controlCenterHeader.ariaLabel.exitFocus",
            )}
          >
            <XIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftDock() {
  const { isDraft } = useDraftMode();
  return (
    <div
      className={cn(
        "absolute bottom-0 left-1/2 z-10 -translate-x-1/2",
        "transition-[opacity,transform,visibility] duration-300 ease-out will-change-transform",
        isDraft
          ? "visible opacity-100 translate-y-0"
          : "invisible opacity-0 translate-y-20 pointer-events-none",
      )}
    >
      <div className={"py-4"}>
        <CanvasToolbar />
      </div>
    </div>
  );
}
