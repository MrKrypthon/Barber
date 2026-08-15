"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from "@barber/types";
import { apiClient } from "@/lib/api-client";

const EMPLOYEES_QUERY_KEY = ["employees"] as const;

export function useEmployees() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: () => apiClient.employees.list(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateEmployeeInput) => apiClient.employees.create(input),
    onSuccess: (employee) => {
      queryClient.setQueryData<Employee[]>(EMPLOYEES_QUERY_KEY, (prev) =>
        [...(prev ?? []), employee].sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeInput }) =>
      apiClient.employees.update(id, input),
    onSuccess: (employee) => {
      queryClient.setQueryData<Employee[]>(EMPLOYEES_QUERY_KEY, (prev) =>
        (prev ?? [])
          .map((e) => (e.id === employee.id ? employee : e))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiClient.employees.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Employee[]>(EMPLOYEES_QUERY_KEY, (prev) =>
        (prev ?? []).filter((e) => e.id !== id),
      );
    },
  });

  return {
    employees: data ?? [],
    isLoading,
    isError,
    addEmployee: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
    updateEmployee: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    removeEmployee: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
