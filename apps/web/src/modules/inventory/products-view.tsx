"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/card";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useProducts } from "@/hooks/use-products";
import { cn } from "@/lib/cn";
import { ProductFormModal } from "./product-form-modal";

export function ProductsView() {
  const { user } = useAuth();
  const canEdit = user?.role === "owner";
  const { products, isLoading, isError, addProduct, isAdding } = useProducts();
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        title="Inventario"
        backHref="/config"
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

      <Card className="p-0">
        {isLoading ? (
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">
            Cargando productos...
          </p>
        ) : isError ? (
          <p className="py-6 text-center text-secondary">No se pudieron cargar los productos.</p>
        ) : products.length === 0 ? (
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">
            Todavía no cargaste ningún producto.
          </p>
        ) : (
          <ul className="grid md:grid-cols-2">
            {products.map((p) => {
              const lowStock = p.minStock !== null && p.stock <= p.minStock;
              return (
                <li key={p.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <Link
                    href={`/config/inventario/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{p.name}</p>
                      {lowStock ? (
                        <p className="text-sm font-medium text-secondary">Stock bajo</p>
                      ) : null}
                    </div>
                    <span className={cn("font-bold", lowStock && "text-secondary")}>
                      {p.stock} u.
                    </span>
                    <ChevronRightIcon className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

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
