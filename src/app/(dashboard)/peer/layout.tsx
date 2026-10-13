import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import React from "react";
import NamespaceGate from "@/i18n/NamespaceGate";
import BlankLayout from "@/layouts/BlankLayout";

export const metadata: Metadata = {
  title: `Peer - Peers - ${globalMetaTitle}`,
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <BlankLayout>
      <NamespaceGate
        modules={[
          "peer",
          "peers",
          "groups",
          "access-control",
          "routes",
          "networks",
          "jobs",
          "remote-access",
          "posture-checks",
          "access-tokens",
        ]}
      >
        {children}
      </NamespaceGate>
    </BlankLayout>
  );
}
