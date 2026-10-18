import type { Meta } from "@storybook/nextjs-vite";
import React from "react";
import PeersPage from "@/app/(dashboard)/peers/page";
import PageContainer from "@/layouts/PageContainer";
import {
  click,
  inLayout,
  nav,
  resetStorage,
  type Story,
  text,
} from "@/storybook/core";
import { usePageHeader } from "./pageHeader";

/* The shell (sider, top bar, page header bar, drawer, bottom bar) around the
   Peers page, the first page that declares its header to the shell. The
   vp-<width> tags make the visual guard capture the phone and tablet modes. */
const meta: Meta = {
  title: "Theme/Shell",
  parameters: nav("/peers"),
  beforeEach: resetStorage,
  render: inLayout(PeersPage),
};
export default meta;

const loaded = () => text("olivias-macbook-pro");

export const Desktop: Story = {
  play: async () => void (await loaded()),
};

export const DesktopCollapsed: Story = {
  play: async () => {
    await loaded();
    await click(
      document.querySelector<HTMLElement>("[data-navbar-colappse-toggle]")!,
    );
  },
};

export const DesktopCollapsedGroupPopover: Story = {
  play: async () => {
    await loaded();
    await click(
      document.querySelector<HTMLElement>("[data-navbar-colappse-toggle]")!,
    );
    await click(
      document.querySelector<HTMLElement>(
        '[data-nav-item="/access-control"] button',
      )!,
    );
    await text("Posture Checks");
  },
};

export const Tablet: Story = {
  tags: ["vp-1024"],
  play: async () => void (await loaded()),
};

export const Phone: Story = {
  tags: ["vp-390"],
  play: async () => void (await loaded()),
};

export const PhoneDrawerOpen: Story = {
  tags: ["vp-390"],
  play: async () => {
    await loaded();
    await click(document.querySelector<HTMLElement>(".nb-topbar__menu")!);
    await text("Posture Checks").catch(() => undefined);
  },
};

/* A page that registers actions too: desktops show them in the page header
   bar, phones put the primary one in the bottom bar. */
function DemoActionsPage() {
  usePageHeader({
    title: "Demo page",
    count: 42,
    breadcrumb: [{ label: "Demo", href: "/demo" }, { label: "Actions" }],
    help: "What this page is for, in one sentence.",
    primaryAction: { label: "Create item", "data-testid": "demo-primary" },
    secondaryActions: [{ label: "Export" }],
  });
  return (
    <PageContainer>
      <div className={"p-default"}>Page content</div>
    </PageContainer>
  );
}

export const WithActions: Story = {
  render: inLayout(DemoActionsPage),
  play: async () => void (await text("Page content")),
};

export const WithActionsPhone: Story = {
  tags: ["vp-390"],
  render: inLayout(DemoActionsPage),
  play: async () => void (await text("Page content")),
};
