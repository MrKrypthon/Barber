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

// Historial de cortes ya hechos, para poder volver a descargar el PDF de un
// día anterior (no solo el de hoy recién cerrado).
export function useCashClosings() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["cash", "closings"],
    queryFn: () => apiClient.cash.listClosings(),
  });

  return { closings: data ?? [], isLoading, isError };
}

// date en formato "YYYY-MM-DD"; null mientras no hay ninguno seleccionado
// para no pedir un detalle que todavía no hace falta.
export function useCashClosingDetail(date: string | null) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["cash", "closings", date],
    queryFn: () => apiClient.cash.getClosing(date as string),
    enabled: date !== null,
  });

  return { closing: data, isLoading, isError };
}
