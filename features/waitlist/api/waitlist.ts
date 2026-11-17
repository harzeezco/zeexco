import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface WaitlistRequest {
  name: string;
  phone: string;
}

export async function joinWaitlist(payload: WaitlistRequest) {
  const { data } = await apiClient.post("/api/waitlist", payload, { baseURL: "" });
  return data;
}

export function useJoinWaitlist() {
  return useMutation({ mutationFn: joinWaitlist });
}
