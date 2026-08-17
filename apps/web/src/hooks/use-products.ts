"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateProductInput,
  CreateProductMovementInput,
  Product,
  UpdateProductInput,
} from "@barber/types";
import { apiClient } from "@/lib/api-client";

const PRODUCTS_QUERY_KEY = ["products"] as const;

export function useProducts() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: () => apiClient.products.list(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateProductInput) => apiClient.products.create(input),
    onSuccess: (product) => {
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (prev) =>
        [...(prev ?? []), product].sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      apiClient.products.update(id, input),
    onSuccess: (product) => {
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (prev) =>
        (prev ?? [])
          .map((p) => (p.id === product.id ? product : p))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
  });

  // Un movimiento cambia el stock del producto: se invalida la lista en vez
  // de parchear a mano, para no duplicar la cuenta que ya hace el backend.
  const movementMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateProductMovementInput }) =>
      apiClient.products.registerMovement(id, input),
    onSuccess: (_movement, { id }) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products", id, "movements"] });
    },
  });

  return {
    products: data ?? [],
    isLoading,
    isError,
    addProduct: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    registerMovement: movementMutation.mutateAsync,
    isRegisteringMovement: movementMutation.isPending,
  };
}

export function useProductMovements(productId: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", productId, "movements"],
    queryFn: () => apiClient.products.listMovements(productId),
  });

  return { movements: data ?? [], isLoading, isError };
}
