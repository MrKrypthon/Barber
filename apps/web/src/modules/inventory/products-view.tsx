"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "./product-card";
import { ProductFormModal } from "./product-form-modal";

export function ProductsView() {
  const { user } = useAuth();
  const canEdit = user?.role === "owner";
  const { products, isLoading, isError, addProduct, isAdding, registerMovement } = useProducts();
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        title="Inventario"
        action={
          canEdit ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              aria-label="Nuevo producto"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-white active:brightness-95"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Card>
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">
            Cargando productos...
          </p>
        </Card>
      ) : isError ? (
        <Card>
          <p className="py-6 text-center text-secondary">No se pudieron cargar los productos.</p>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">
            Todavía no cargaste ningún producto.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onRegisterMovement={(input) => registerMovement({ id: p.id, input })}
            />
          ))}
        </div>
      )}

      {creating ? (
        <ProductFormModal
          onClose={() => setCreating(false)}
          isSaving={isAdding}
          onSave={async (input) => {
            await addProduct(input);
            setCreating(false);
          }}
        />
      ) : null}
    </div>
  );
}
