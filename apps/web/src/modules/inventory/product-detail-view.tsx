"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useProductMovements, useProducts } from "@/hooks/use-products";
import { formatLongDate } from "@/lib/format";
import { ProductFormModal } from "./product-form-modal";
import { RegisterMovementModal } from "./register-movement-modal";

export function ProductDetailView({ productId }: { productId: string }) {
  const { user } = useAuth();
  const canEdit = user?.role === "owner";
  const { products, isLoading, updateProduct, isUpdating, registerMovement, isRegisteringMovement } =
    useProducts();
  const { movements, isLoading: isLoadingMovements } = useProductMovements(productId);
  const [editing, setEditing] = useState(false);
  const [registering, setRegistering] = useState(false);

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return (
      <div>
        <PageHeader title="Producto" backHref="/config/inventario" />
        <p className="py-10 text-center text-neutral-400 dark:text-neutral-500">
          {isLoading ? "Cargando..." : "Producto no encontrado."}
        </p>
      </div>
    );
  }

  const lowStock = product.minStock !== null && product.stock <= product.minStock;

  return (
    <div>
      <PageHeader
        title={product.name}
        backHref="/config/inventario"
        action={
          canEdit ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              Editar
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4 flex flex-col items-center gap-1 py-6 text-center">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">Stock actual</span>
        <p className="text-3xl font-bold">{product.stock} u.</p>
        {lowStock ? (
          <p className="text-sm font-medium text-secondary">
            Por debajo del mínimo ({product.minStock} u.)
          </p>
        ) : null}
      </Card>

      <Button fullWidth variant="dark" onClick={() => setRegistering(true)} className="mb-6">
        Registrar movimiento
      </Button>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        Movimientos
      </h2>
      <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
        {isLoadingMovements ? (
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">Cargando...</p>
        ) : movements.length === 0 ? (
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">
            Todavía no hay movimientos.
          </p>
        ) : (
          movements.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1">
                <p className="font-medium">{m.description || (m.type === "entry" ? "Entrada" : "Salida")}</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  {formatLongDate(new Date(m.createdAt))}
                </p>
              </div>
              <span className={m.type === "exit" ? "font-bold text-secondary" : "font-bold text-success"}>
                {m.type === "exit" ? "−" : "+"}
                {m.quantity} u.
              </span>
            </div>
          ))
        )}
      </Card>

      {editing ? (
        <ProductFormModal
          product={product}
          onClose={() => setEditing(false)}
          isSaving={isUpdating}
          onSave={async ({ name, minStock }) => {
            await updateProduct({ id: product.id, input: { name, minStock } });
            setEditing(false);
          }}
        />
      ) : null}

      {registering ? (
        <RegisterMovementModal
          currentStock={product.stock}
          onClose={() => setRegistering(false)}
          isSaving={isRegisteringMovement}
          onSave={async (input) => {
            await registerMovement({ id: product.id, input });
            setRegistering(false);
          }}
        />
      ) : null}
    </div>
  );
}
