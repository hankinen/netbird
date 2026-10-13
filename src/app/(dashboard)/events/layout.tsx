"use client";

import React from "react";
import NamespaceGate from "@/i18n/NamespaceGate";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NamespaceGate modules={["events", "activity"]}>{children}</NamespaceGate>
  );
}
