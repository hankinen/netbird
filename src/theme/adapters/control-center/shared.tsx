"use client";

import { getOperatingSystem } from "@hooks/useOperatingSystem";
import { cn } from "@utils/helpers";
import { GlobeIcon, NetworkIcon, WorkflowIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { PLACEHOLDER_ICONS } from "@/modules/peers/PeerOperatingSystemIcon";
import { OSLogo } from "@/modules/peers/PeerOSCell";
import { GraphTag } from "@/theme/graph";

/**
 * Bits every control-center adapter shares. The adapters replace upstream's
 * node, edge and chrome files through exact tsconfig aliases
 * (src/theme/README.md "Control Center") and render the graph layer; each
 * one falls back to the upstream component when the AntD theme is not the
 * build's theme, so those builds stay pixel-identical to upstream.
 */

/** Operating-system logo for a peer, sized for a graph tile. */
export const PeerOsIcon = ({
  os,
  size = 16,
}: {
  os: string;
  size?: number;
}) => {
  const Placeholder = PLACEHOLDER_ICONS[os];
  if (Placeholder) {
    return (
      <span
        className={"flex items-center justify-center shrink-0"}
        style={{ width: size, height: size }}
      >
        <Placeholder size={size} />
      </span>
    );
  }
  const type = getOperatingSystem(os);
  return (
    <span
      className={cn(
        "flex items-center justify-center shrink-0 grayscale contrast-[40%]",
        type === OperatingSystem.WINDOWS && "p-[2px]",
        type === OperatingSystem.APPLE && "p-[2.5px]",
        type === OperatingSystem.FREEBSD && "p-[1.5px]",
      )}
      style={{ width: size, height: size }}
    >
      <OSLogo os={os} />
    </span>
  );
};

/** Icon per network resource type (domain / subnet / host). */
export const RESOURCE_ICONS = {
  domain: GlobeIcon,
  subnet: NetworkIcon,
  host: WorkflowIcon,
} as const;

export const ResourceTypeIcon = ({
  type,
  size = 16,
}: {
  type?: string;
  size?: number;
}) => {
  const Icon =
    RESOURCE_ICONS[(type ?? "host") as keyof typeof RESOURCE_ICONS] ??
    GlobeIcon;
  return <Icon size={size} />;
};

/** "Draft" tag of an entity that exists only in the draft (upstream: NEW). */
export const DraftTag = () => (
  <GraphTag tone={"draft"}>{t("components.graph:tag.text.draft")}</GraphTag>
);

/** A draft entity's client id starts with `new-`. */
export const isDraftId = (id?: string) => String(id ?? "").startsWith("new-");
