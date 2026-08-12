"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateSettingsInput } from "@barber/types";
import { apiClient } from "@/lib/api-client";

const SETTINGS_QUERY_KEY = ["settings"] as const;

export function useSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => apiClient.settings.get(),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateSettingsInput) => apiClient.settings.update(input),
    onSuccess: (settings) => queryClient.setQueryData(SETTINGS_QUERY_KEY, settings),
  });

  return {
    settings: data,
    isLoading,
    isError,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
