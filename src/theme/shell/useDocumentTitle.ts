"use client";

import * as React from "react";

function subscribe(onChange: () => void) {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  return () => observer.disconnect();
}

const read = () => (typeof document === "undefined" ? "" : document.title);
const empty = () => "";

/**
 * The page's name from the document title Next.js sets per route
 * ("Peers - NetBird Dashboard" -> "Peers", already translated by
 * src/i18n/pageTitle.ts). The shell shows it until a page registers its own
 * header through usePageHeader().
 */
export function useDocumentPageName(): string {
  const title = React.useSyncExternalStore(subscribe, read, empty);
  return title.split(" - ")[0]?.trim() ?? "";
}
