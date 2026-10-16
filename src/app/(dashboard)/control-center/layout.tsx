import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import React from "react";
import NamespaceGate from "@/i18n/NamespaceGate";
import BlankLayout from "@/layouts/BlankLayout";

export const metadata: Metadata = {
  title: `Control Center - ${globalMetaTitle}`,
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <BlankLayout>
      <NamespaceGate
        modules={[
          "control-center",
          "agent-network",
          "reverse-proxy",
          "access-control",
          "networks",
          "groups",
          "peers",
          "setup-netbird-modal",
          "posture-checks",
          "setup-keys",
          "users",
        ]}
      >
        {children}
      </NamespaceGate>
    </BlankLayout>
  );
}
