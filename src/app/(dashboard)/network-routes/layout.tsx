import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import React from "react";
import NamespaceGate from "@/i18n/NamespaceGate";
import BlankLayout from "@/layouts/BlankLayout";

export const metadata: Metadata = {
  title: `Network Routes - ${globalMetaTitle}`,
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <BlankLayout>
      <NamespaceGate
        modules={[
          "network-routes",
          "routes",
          "route-group",
          "exit-node",
          "groups",
          "peers",
          "access-control",
          "networks",
        ]}
      >
        {children}
      </NamespaceGate>
    </BlankLayout>
  );
}
