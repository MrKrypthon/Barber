"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type NewExpense = { description: string; amount: number };

export function useCash() {
  const queryClient = useQueryClient();

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ["cash", "today"],
    queryFn: () => apiClient.cash.getSummary("today"),
  });

  const expenseMutation = useMutation({
    mutationFn: (input: NewExpense) =>
      apiClient.cash.registerMovement({
        type: "expense",
        amount: input.amount,
        description: input.description,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cash"] }),
  });

  const closeMutation = useMutation({
    mutationFn: () => apiClient.cash.close(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cash"] }),
  });

  return {
    summary,
    isLoading,
    isError,
    isClosed: Boolean(summary?.closedAt),
    addExpense: expenseMutation.mutateAsync,
    isAddingExpense: expenseMutation.isPending,
    closeCash: closeMutation.mutateAsync,
    isClosing: closeMutation.isPending,
  };
}
