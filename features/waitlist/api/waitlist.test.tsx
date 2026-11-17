import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/lib/query-client";
import { apiClient } from "@/lib/api-client";
import { useJoinWaitlist } from "./waitlist";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("waitlist mutation", () => {
  it("exposes pending state and posts to the local endpoint", async () => {
    let finish!: (value: unknown) => void;
    const post = vi.spyOn(apiClient, "post").mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const { result } = renderHook(useJoinWaitlist, { wrapper: QueryProvider });
    act(() => result.current.mutate({ name: "Ada", phone: "08012345678" }));
    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(post).toHaveBeenCalledWith("/api/waitlist", { name: "Ada", phone: "08012345678" }, { baseURL: "" });
    await act(async () => finish({ data: { success: true } }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("settles network failures and allows an explicit retry", async () => {
    const failure = new Error("Network unavailable");
    const post = vi.spyOn(apiClient, "post").mockRejectedValueOnce(failure).mockResolvedValueOnce({ data: { success: true } });
    const { result } = renderHook(useJoinWaitlist, { wrapper: QueryProvider });
    act(() => result.current.mutate({ name: "Ada", phone: "08012345678" }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(failure);
    expect(result.current.isPending).toBe(false);
    expect(post).toHaveBeenCalledTimes(1);
    act(() => result.current.mutate({ name: "Ada", phone: "08012345678" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledTimes(2);
  });
});
