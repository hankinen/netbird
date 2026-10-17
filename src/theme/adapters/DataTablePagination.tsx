"use client";

/**
 * AntD-style replacement for src/components/table/DataTablePagination.tsx.
 *
 * Swapped in by one exact tsconfig `paths` entry
 *   "@components/table/DataTablePagination": [this file]
 * which Next (Turbopack), Storybook (tsconfigAliases in .storybook/main.ts),
 * vitest and tsc all honour. Same export and props as upstream.
 *
 * Renders the upstream component unchanged unless the AntD light theme is
 * active (<html class="theme-antd"> without .dark — the same condition every
 * theme CSS rule uses), so the dark and upstream-light themes stay identical.
 * See README.md "Pagination component replacement".
 *
 * Contract with upstream, checked by npm run theme:check-selectors (signature
 * = props interface + export line, whitespace-normalised, sha256/16) and by
 * tsc (DataTablePagination.contract.ts):
 * @replaces src/components/table/DataTablePagination.tsx DataTablePagination sha256:0eb1673a035f8e2c
 */
import { SelectDropdown } from "@components/select/SelectDropdown";
import type { PaginationLocale } from "@rc-component/pagination";
import Pagination from "@rc-component/pagination";
import { cn } from "@utils/helpers";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import * as React from "react";
// Non-aliased path to the upstream file (the alias would point back here).
import { DataTablePagination as UpstreamDataTablePagination } from "@/components/table/DataTablePagination";
import { t } from "@/i18n";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";

export type DataTablePaginationProps<TData> = Parameters<
  typeof UpstreamDataTablePagination<TData>
>[0];

/** Upstream's rows-per-page choices (DataTableRowsPerPage). */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 1000];

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}
const antdLightSnapshot = () => {
  const c = document.documentElement.classList;
  return c.contains("theme-antd") && !c.contains("dark");
};
// Static export prerender: the class the HTML ships with (see defaultTheme.ts).
const antdLightServerSnapshot = () => ANTD_THEME_ENABLED;

/** True while the AntD light theme is applied to <html>. */
export function useAntdLight() {
  return React.useSyncExternalStore(
    subscribe,
    antdLightSnapshot,
    antdLightServerSnapshot,
  );
}

const PHONE_QUERY = "(max-width: 767.98px)";
// matchMedia is missing in some environments (jsdom): treat as not a phone.
const phoneQuery = () =>
  typeof window.matchMedia === "function"
    ? window.matchMedia(PHONE_QUERY)
    : null;
function subscribePhone(onChange: () => void) {
  const mql = phoneQuery();
  if (!mql) return () => {};
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
/** True below 768px (phones): compact pagination, see README "手机端适配". */
export function useIsPhone() {
  return React.useSyncExternalStore(
    subscribePhone,
    () => phoneQuery()?.matches ?? false,
    () => false,
  );
}

function paginationLocale(): PaginationLocale {
  return {
    items_per_page: t("components.table:dataTablePagination.text.itemsPerPage"),
    jump_to: t("components.table:dataTablePagination.text.jumpTo"),
    page: t("components.table:dataTablePagination.text.page"),
    prev_page: t("components.table:dataTablePagination.label.previousPage"),
    next_page: t("components.table:dataTablePagination.label.nextPage"),
    prev_5: t("components.table:dataTablePagination.label.previous5Pages"),
    next_5: t("components.table:dataTablePagination.label.next5Pages"),
    page_size: t("components.table:dataTablePagination.label.pageSize"),
  };
}

export function DataTablePagination<TData>(
  props: DataTablePaginationProps<TData>,
) {
  const antdLight = useAntdLight();
  if (!antdLight) return <UpstreamDataTablePagination {...props} />;
  return <AntdDataTablePagination {...props} />;
}

/** "•••" that turns into « / » on hover (theme CSS toggles the two spans). */
function JumpIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <span className={"rc-pagination-item-link nb-pagination-jump"}>
      <span className={"nb-pagination-jump-icon"}>{icon}</span>
      <span className={"nb-pagination-jump-ellipsis"}>•••</span>
    </span>
  );
}

function AntdDataTablePagination<TData>({
  table,
  paginationPadding = "px-8 py-8",
  totalRecords,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const phone = useIsPhone();
  const manual = !!table.options.manualPagination;

  // Upstream DataTable drops the first onPaginationChange in manual mode
  // (isInitialRender), so the first page click on a server-paginated table
  // does nothing. Spend that first call on a no-op (same page) at mount.
  // Runs once, as soon as the table is server-paginated (totalRecords known).
  const consumed = React.useRef(false);
  const serverPaginated = manual && totalRecords !== undefined;
  React.useEffect(() => {
    if (!serverPaginated || consumed.current) return;
    consumed.current = true;
    table.setPageIndex((i) => i);
  }, [serverPaginated, table]);

  // manualPagination without totalRecords is how upstream turns pagination
  // off for embedded tables (RouteTable, DNSRecordsTable,
  // ReverseProxyTargetsTable): pageCount is -1 there and upstream renders
  // nothing. Keep that.
  if (table.options.manualPagination && totalRecords === undefined) return null;

  const total =
    totalRecords !== undefined
      ? totalRecords
      : table.getFilteredRowModel().rows.length;
  if (total <= 0) return null;

  const locale = paginationLocale();

  return (
    <div
      className={cn("flex items-center justify-end", paginationPadding)}
      data-testid={"antd-pagination"}
    >
      <Pagination
        current={pageIndex + 1}
        pageSize={pageSize}
        total={total}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        showSizeChanger
        showQuickJumper={!phone}
        showLessItems={phone}
        showTitle={false}
        locale={locale}
        showTotal={(n) =>
          t("components.table:dataTablePagination.text.total", { total: n })
        }
        prevIcon={<ChevronLeft size={14} />}
        nextIcon={<ChevronRight size={14} />}
        jumpPrevIcon={<JumpIcon icon={<ChevronsLeft size={14} />} />}
        jumpNextIcon={<JumpIcon icon={<ChevronsRight size={14} />} />}
        sizeChangerRender={({
          size,
          onSizeChange,
          disabled,
          className,
          options,
        }) => (
          <div className={className} data-testid={"antd-page-size"}>
            <SelectDropdown
              value={String(size)}
              onChange={(v) => onSizeChange(v)}
              disabled={disabled}
              options={options.map((o) => ({
                value: String(o.value),
                label: `${o.value} ${locale.items_per_page}`,
              }))}
              popoverWidth={"auto"}
              popoverMinWidth={130}
            />
          </div>
        )}
        onChange={(page, nextSize) => {
          if (nextSize !== pageSize) {
            // tanstack keeps the first visible row on screen when resizing.
            table.setPageSize(nextSize);
          } else {
            table.setPageIndex(page - 1);
          }
        }}
      />
    </div>
  );
}
