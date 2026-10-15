/* Compile-time contract: the wrapper in ./DataTablePagination.tsx was written
   against exactly these upstream props. If upstream changes them, tsc fails
   here; update the wrapper (and the @replaces hash), then this type. */
import type { Table } from "@tanstack/react-table";
import type { DataTablePaginationProps } from "./DataTablePagination";

type ExpectedProps<TData> = {
  table: Table<TData>;
  text?: string;
  paginationPadding?: string;
  totalRecords?: number;
};

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;

export const upstreamPaginationPropsUnchanged: Equals<
  DataTablePaginationProps<unknown>,
  ExpectedProps<unknown>
> = true;
