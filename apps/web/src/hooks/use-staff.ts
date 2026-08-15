"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// Owner + empleados activos del tenant, para el selector "¿quién atendió
// esto?" al agendar un turno o cobrar una venta. Accesible para ambos
// roles (a diferencia de useEmployees, que es solo del owner).
export function useAssignableStaff() {
  const { data, isLoading } = useQuery({
    queryKey: ["employees", "assignable"],
    queryFn: () => apiClient.employees.assignable(),
  });

  return { staff: data ?? [], isLoading };
}
