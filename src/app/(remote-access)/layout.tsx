"use client";

import MSPProvider from "@/cloud/msp/contexts/MSPProvider";
import UsersProvider from "@/contexts/UsersProvider";
import NamespaceGate from "@/i18n/NamespaceGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MSPProvider>
      <UsersProvider>
        <NamespaceGate modules={["remote-access", "peer"]}>
          {children}
        </NamespaceGate>
      </UsersProvider>
    </MSPProvider>
  );
}
