"use client";

import React from "react";
import NamespaceGate from "@/i18n/NamespaceGate";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NamespaceGate
      modules={[
        "team",
        "users",
        "groups",
        "peers",
        "access-tokens",
        "access-control",
      ]}
    >
      {children}
    </NamespaceGate>
  );
}
