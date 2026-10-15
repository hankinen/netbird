/* Compile-time contract: ./Table.tsx wraps upstream Table, which takes HTML
   table attributes + `minimal`. If upstream adds/removes/retypes props, tsc
   fails here; review the wrapper (labelTableCells), then update this type. */
import type * as React from "react";
import type { TableProps } from "./Table";

type ExpectedProps = React.HTMLAttributes<HTMLTableElement> & {
  minimal?: boolean;
};
type Actual = Omit<TableProps, "ref" | "key">;

// Each line fails to compile if the contract breaks.
export const actualFitsExpected: [Actual] extends [ExpectedProps] ? true : false =
  true;
export const expectedFitsActual: [ExpectedProps] extends [Actual] ? true : false =
  true;
export const noExtraProps: [Exclude<keyof Actual, keyof ExpectedProps>] extends [
  never,
]
  ? true
  : false = true;
export const noMissingProps: [Exclude<keyof ExpectedProps, keyof Actual>] extends [
  never,
]
  ? true
  : false = true;
