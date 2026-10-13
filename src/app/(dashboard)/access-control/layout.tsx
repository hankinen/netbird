import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import React from "react";
import NamespaceGate from "@/i18n/NamespaceGate";
import BlankLayout from "@/layouts/BlankLayout";

export const metadata: Metadata = {
  title: `Access Control - ${globalMetaTitle}`,
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <BlankLayout>
      <NamespaceGate
        modules={[
          "access-control",
          "groups",
          "peers",
          "posture-checks",
          "networks",
        ]}
      >
        {children}
      </NamespaceGate>
    </BlankLayout>
  );
}
