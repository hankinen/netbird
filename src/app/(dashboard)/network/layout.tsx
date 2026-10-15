import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import React from "react";
import NamespaceGate from "@/i18n/NamespaceGate";
import BlankLayout from "@/layouts/BlankLayout";

export const metadata: Metadata = {
  title: `Network - Networks - ${globalMetaTitle}`,
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <BlankLayout>
      <NamespaceGate
        modules={[
          "reverse-proxy",
          "network",
          "networks",
          "routes",
          "route-group",
          "groups",
          "peers",
          "access-control",
          "posture-checks",
          "setup-keys",
        ]}
      >
        {children}
      </NamespaceGate>
    </BlankLayout>
  );
}
