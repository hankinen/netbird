import { act, cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Records every useFetchApi call so the request order can be asserted
// without a network: a call with allowFetch=false sends nothing.
type Call = { url: string; allowFetch: boolean };
const calls: Call[] = [];
const responses: Record<string, { data?: unknown; error?: unknown }> = {};
const handleErrors = vi.fn(async () => undefined);
const swrMutate = vi.fn(async () => undefined);
const oidcLogout = vi.fn(async () => undefined);

vi.mock("@utils/api", () => ({
  default: (url: string, _ignore = false, _rev = true, allowFetch = true) => {
    calls.push({ url, allowFetch });
    const response = allowFetch ? responses[url] ?? {} : {};
    return {
      data: response.data,
      error: response.error,
      isLoading: allowFetch && !response.data && !response.error,
      mutate: vi.fn(async () => undefined),
    };
  },
  useApiErrorHandling: () => handleErrors,
}));
vi.mock("swr", () => ({ mutate: swrMutate }));
vi.mock("@utils/config", () => ({ default: () => ({ clientId: "c" }) }));
vi.mock("@axa-fr/react-oidc", () => ({
  useOidc: () => ({ logout: oidcLogout }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/contexts/PermissionsProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/contexts/ApplicationProvider", () => ({
  useApplicationContext: () => ({ setGlobalApiParams: vi.fn() }),
}));
vi.mock("@/modules/users/PendingApproval", () => ({
  PendingApproval: () => <p>pending</p>,
}));
vi.mock("@components/ui/FullScreenLoading", () => ({
  default: () => <p>loading</p>,
}));

const { default: UsersProvider, useLoggedInUser } = await import(
  "@/contexts/UsersProvider"
);

const LIST = "/users?service_user=false";
const SERVICE = "/users?service_user=true";
const me = { id: "u1", is_current: true, role: "owner" };

const LogoutButton = () => {
  const { logout } = useLoggedInUser();
  return <button onClick={() => logout()}>logout</button>;
};

describe("UsersProvider request gate", () => {
  afterEach(cleanup);

  beforeEach(() => {
    calls.length = 0;
    for (const key of Object.keys(responses)) delete responses[key];
    handleErrors.mockClear();
    swrMutate.mockClear();
    oidcLogout.mockClear();
  });

  it("holds the user lists until /users/current settles", () => {
    const { rerender } = render(
      <UsersProvider>
        <p>workspace</p>
      </UsersProvider>,
    );
    expect(calls.find((c) => c.url === "/users/current")?.allowFetch).toBe(
      true,
    );
    expect(
      calls.filter((c) => c.url === LIST || c.url === SERVICE),
    ).not.toEqual([]);
    expect(
      calls.filter(
        (c) => (c.url === LIST || c.url === SERVICE) && c.allowFetch,
      ),
    ).toEqual([]);
    expect(calls.some((c) => c.url === "/users")).toBe(false);
    expect(screen.getByText("loading")).toBeTruthy();

    responses["/users/current"] = { data: me };
    calls.length = 0;
    rerender(
      <UsersProvider>
        <p>workspace</p>
      </UsersProvider>,
    );
    expect(screen.getByText("workspace")).toBeTruthy();
    expect(calls.find((c) => c.url === LIST)?.allowFetch).toBe(true);
    expect(calls.find((c) => c.url === SERVICE)?.allowFetch).toBe(true);
  });

  it("hands a non-refusal error to the shared handler instead of spinning", () => {
    responses["/users/current"] = {
      error: { code: 401, message: "no valid authentication provided" },
    };
    responses[LIST] = { data: [me] };
    render(
      <UsersProvider>
        <p>workspace</p>
      </UsersProvider>,
    );
    expect(screen.queryByText("workspace")).toBeNull();
    expect(handleErrors).toHaveBeenCalledWith({
      code: 401,
      message: "no valid authentication provided",
    });
  });

  it("falls back to the list on old management (404)", () => {
    responses["/users/current"] = {
      error: { code: 404, message: "Not Found" },
    };
    responses[LIST] = { data: [me] };
    render(
      <UsersProvider>
        <p>workspace</p>
      </UsersProvider>,
    );
    expect(screen.getByText("workspace")).toBeTruthy();
    expect(handleErrors).not.toHaveBeenCalled();
  });

  it("logout drops the whole SWR cache without revalidating", async () => {
    responses["/users/current"] = { data: me };
    render(
      <UsersProvider>
        <LogoutButton />
      </UsersProvider>,
    );
    await act(async () => {
      screen.getByText("logout").click();
    });
    expect(swrMutate).toHaveBeenCalledWith(expect.any(Function), undefined, {
      revalidate: false,
    });
    expect(swrMutate.mock.invocationCallOrder[0]).toBeLessThan(
      oidcLogout.mock.invocationCallOrder[0],
    );
  });
});
