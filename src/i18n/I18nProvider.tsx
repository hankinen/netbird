"use client";

import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import FullScreenLoading from "@/components/ui/FullScreenLoading";
import { detectLanguage, i18n, initLanguage } from "@/i18n";

/**
 * Picks the language once on the client and loads the preloaded namespaces
 * before rendering. The static export is prerendered in English, so nothing
 * renders until the client language is known (no hydration mismatch).
 */
export default function I18nProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initLanguage(detectLanguage()).finally(() => setReady(true));
  }, []);
  if (!ready) return <FullScreenLoading />;
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
