"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateServiceInput, Service } from "@barber/types";
import { apiClient } from "@/lib/api-client";

const SERVICES_QUERY_KEY = ["services"] as const;

export function useServices() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: () => apiClient.services.list(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateServiceInput) => apiClient.services.create(input),
    onSuccess: (service) => {
      queryClient.setQueryData<Service[]>(SERVICES_QUERY_KEY, (prev) =>
        [...(prev ?? []), service].sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
  });

  return {
    services: data ?? [],
    isLoading,
    isError,
    addService: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
  };
}
