"use client";

import { cn } from "@utils/helpers";
import React from "react";

/**
 * The page's scroll container, replacing src/layouts/PageContainer.tsx
 * through the `@/layouts/PageContainer` alias.
 * @replaces-file src/layouts/PageContainer.tsx sha256:8b52c186afbde919
 *
 * The shell lays the sider and the main column out with flex, so the
 * upstream `md:pl-[64px]` offset for a fixed, collapsed sidebar is gone. The
 * `flex-auto overflow-auto` classes stay: the responsive layer and the
 * overflow guard find the page scroller by them.
 */
type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function PageContainer({
  children,
  className,
}: Readonly<Props>) {
  return (
    <main
      className={cn(
        className,
        "nb-page relative flex-auto overflow-auto bg-nb-gray z-1 focus:outline-none",
      )}
    >
      {children}
    </main>
  );
}
