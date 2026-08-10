"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCustomerInput, Customer } from "@barber/types";
import { apiClient } from "@/lib/api-client";

const CUSTOMERS_QUERY_KEY = ["customers"] as const;

export function useCustomers() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: () => apiClient.customers.list(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateCustomerInput) => apiClient.customers.create(input),
    onSuccess: (customer) => {
      queryClient.setQueryData<Customer[]>(CUSTOMERS_QUERY_KEY, (prev) =>
        [...(prev ?? []), customer].sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
  });

  return {
    customers: data ?? [],
    isLoading,
    isError,
    addCustomer: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
  };
}
