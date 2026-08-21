"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateSaleInput } from "@barber/types";
import { apiClient } from "@/lib/api-client";

export type SalesFilter = "today" | "week" | "month";

export function useSales(filter: SalesFilter = "today") {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sales", filter],
    queryFn: () => apiClient.sales.list({ range: filter }),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateSaleInput) => apiClient.sales.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  return {
    sales: data ?? [],
    isLoading,
    isError,
    addSale: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
  };
}
