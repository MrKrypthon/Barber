"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RecordTenantPaymentInput } from "@barber/types";
import { superAdminApiClient } from "@/lib/superadmin-api-client";

const TENANTS_QUERY_KEY = ["superadmin", "tenants"] as const;

export function useSuperAdminTenants() {
  const { data, isLoading, isError } = useQuery({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: () => superAdminApiClient.tenants.list(),
  });

  const tenants = data ?? [];
  return {
    tenants,
    activeCount: tenants.filter((t) => t.subscriptionStatus === "active").length,
    isLoading,
    isError,
  };
}

export function useSuperAdminTenantDetail(id: string) {
  const queryClient = useQueryClient();
  const queryKey = [...TENANTS_QUERY_KEY, id] as const;

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => superAdminApiClient.tenants.get(id),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
  }

  const suspendMutation = useMutation({
    mutationFn: () => superAdminApiClient.tenants.suspend(id),
    onSuccess: invalidateAll,
  });

  const activateMutation = useMutation({
    mutationFn: () => superAdminApiClient.tenants.activate(id),
    onSuccess: invalidateAll,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (input: RecordTenantPaymentInput) => superAdminApiClient.tenants.recordPayment(id, input),
    onSuccess: invalidateAll,
  });

  return {
    tenant: data,
    isLoading,
    isError,
    suspend: suspendMutation.mutateAsync,
    isSuspending: suspendMutation.isPending,
    activate: activateMutation.mutateAsync,
    isActivating: activateMutation.isPending,
    recordPayment: recordPaymentMutation.mutateAsync,
    isRecordingPayment: recordPaymentMutation.isPending,
  };
}
