"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateWhatsAppConnectionInput } from "@barber/types";
import { apiClient } from "@/lib/api-client";

const CONNECTION_QUERY_KEY = ["whatsapp", "connection"] as const;

export function useWhatsAppConnection() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: CONNECTION_QUERY_KEY,
    queryFn: () => apiClient.whatsapp.getConnection(),
  });

  const upsertMutation = useMutation({
    mutationFn: (input: UpdateWhatsAppConnectionInput) => apiClient.whatsapp.upsertConnection(input),
    onSuccess: (connection) => queryClient.setQueryData(CONNECTION_QUERY_KEY, connection),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiClient.whatsapp.removeConnection(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEY }),
  });

  return {
    connection: data,
    isLoading,
    isError,
    upsertConnection: upsertMutation.mutateAsync,
    isUpserting: upsertMutation.isPending,
    removeConnection: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
