"use client";

import React, { useEffect, useState } from "react";
import { i18n, loadNamespaces, namespacesFor } from "@/i18n";

/**
 * Lazily loads the namespaces of a route (every namespace named after one of
 * the given modules) before rendering it. Strings of namespaces that are not
 * loaded fall back to English.
 */
export default function NamespaceGate({
  modules,
  children,
}: Readonly<{ modules: readonly string[]; children: React.ReactNode }>) {
  const ns = namespacesFor(modules);
  const [ready, setReady] = useState(
    () =>
      i18n.language === "en" ||
      ns.every((n) => i18n.hasResourceBundle(i18n.language, n)),
  );
  useEffect(() => {
    if (ready) return;
    loadNamespaces(ns).finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ready ? <>{children}</> : null;
}
