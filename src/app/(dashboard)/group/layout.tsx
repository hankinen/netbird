import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import React from "react";
import NamespaceGate from "@/i18n/NamespaceGate";
import BlankLayout from "@/layouts/BlankLayout";

export const metadata: Metadata = {
  title: `Group - ${globalMetaTitle}`,
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <BlankLayout>
      <NamespaceGate
        modules={[
          "groups",
          "peers",
          "access-control",
          "setup-keys",
          "routes",
          "networks",
          "dns",
          "posture-checks",
          "users",
        ]}
      >
        {children}
      </NamespaceGate>
    </BlankLayout>
  );
}
