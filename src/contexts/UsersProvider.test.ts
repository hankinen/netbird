import { describe, expect, it, vi } from "vitest";
import {
  RefusalKind,
  resolveLoggedInUser,
  resolveRefusedUser,
} from "@/contexts/UsersProvider";

// Importing the provider pulls in the runtime config and, through the pending
// screen, an SVG import vitest does not transform. Neither reaches the pure
// decision under test.
vi.mock("@utils/config", () => ({ default: () => ({}) }));
vi.mock("@components/NetBirdLogo", () => ({ NetBirdLogo: () => null }));

// What each management version returns for a user awaiting approval.
const blocked = { code: 403, message: "user is blocked" };
const listPending = {
  code: 403,
  message: "failed to validate user permissions: user is pending approval",
};
const currentPendingNamed = {
  code: 403,
  message:
    "failed to validate user permissions: user is pending approval by owner ma****k@acme-corp.com",
};

const settled = { isCurrentLoading: false, isListLoading: false };

describe("resolveRefusedUser", () => {
  it("prefers the response that names the owner", () => {
    expect(
      resolveRefusedUser({
        currentError: currentPendingNamed,
        listError: listPending,
        ...settled,
      }),
    ).toEqual({
      kind: RefusalKind.PendingApproval,
      error: currentPendingNamed,
    });
  });

  it("falls back to the list on management that reports pending as blocked", () => {
    expect(
      resolveRefusedUser({
        currentError: blocked,
        listError: listPending,
        ...settled,
      }),
    ).toEqual({ kind: RefusalKind.PendingApproval, error: listPending });
  });

  // The blocked branch used to conclude here, sending a user awaiting approval
  // to the blocked screen because the response saying otherwise had not landed.
  it("waits for the list rather than concluding blocked while it is in flight", () => {
    expect(
      resolveRefusedUser({
        currentError: blocked,
        isCurrentLoading: false,
        isListLoading: true,
      }),
    ).toBeUndefined();
  });

  it("waits for the named response rather than settling for the list", () => {
    expect(
      resolveRefusedUser({
        listError: listPending,
        isCurrentLoading: true,
        isListLoading: false,
      }),
    ).toBeUndefined();
  });

  it("routes a genuinely blocked user once both have settled", () => {
    expect(
      resolveRefusedUser({
        currentError: blocked,
        listError: blocked,
        ...settled,
      }),
    ).toEqual({ kind: RefusalKind.Blocked, error: blocked });
  });

  it("leaves an unrefused user alone", () => {
    expect(resolveRefusedUser({ ...settled })).toBeUndefined();
  });
});

describe("resolveLoggedInUser", () => {
  const me = { id: "u1", is_current: true } as never;
  const other = { id: "u2", is_current: false } as never;
  const notFound = { code: 404, message: "Not Found" };
  const notAllowed = { code: 405, message: "Method Not Allowed" };
  const unauthorized = {
    code: 401,
    message: "no valid authentication provided",
  };
  const forbidden = { code: 403, message: "permission denied" };
  const serverError = { code: 500, message: "internal server error" };

  it.each([
    ["current pending", { currentError: undefined }, "loading"],
    ["current succeeded", { currentUser: me }, "ready"],
    [
      "401 never falls back to the list",
      { currentError: unauthorized, listUsers: [me] },
      "error",
    ],
    [
      "403 permission denied never falls back",
      { currentError: forbidden, listUsers: [me] },
      "error",
    ],
    [
      "5xx after retries is an error",
      { currentError: serverError, listUsers: [me] },
      "error",
    ],
    ["blocked is a refusal", { currentError: blocked }, "refused"],
    ["pending is a refusal", { currentError: currentPendingNamed }, "refused"],
    [
      "old management (404) waits for the list",
      { currentError: notFound, isListLoading: true },
      "loading",
    ],
    [
      "old management (404) uses is_current",
      { currentError: notFound, listUsers: [other, me] },
      "ready",
    ],
    [
      "old management (405) uses is_current",
      { currentError: notAllowed, listUsers: [me] },
      "ready",
    ],
    [
      "old management, list refused",
      { currentError: notFound, listError: listPending },
      "refused",
    ],
    [
      "old management, list failing is an error, not a spinner",
      { currentError: notFound, listError: serverError },
      "error",
    ],
    [
      "old management, no current user in list",
      { currentError: notFound, listUsers: [other] },
      "error",
    ],
  ])("%s", (_name, input, status) => {
    const state = resolveLoggedInUser({
      isListLoading: false,
      ...(input as Partial<Parameters<typeof resolveLoggedInUser>[0]>),
    });
    expect(state.status).toBe(status);
    if (state.status === "ready") expect(state.user).toBe(me);
  });

  it("reports the list error when the old-management fallback fails", () => {
    expect(
      resolveLoggedInUser({
        currentError: notFound,
        listError: serverError,
        isListLoading: false,
      }),
    ).toEqual({ status: "error", error: serverError });
  });
});
