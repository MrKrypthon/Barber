"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useSettings() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiClient.settings.get(),
  });

  return { settings: data, isLoading, isError };
}
