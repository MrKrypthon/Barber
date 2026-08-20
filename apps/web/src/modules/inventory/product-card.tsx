"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product, ProductMovementType } from "@barber/types";
import { Card } from "@/components/card";
import { cn } from "@/lib/cn";
import { ProductPhoto } from "./product-photo";
import { RegisterMovementModal } from "./register-movement-modal";

export function ProductCard({
  product,
  onRegisterMovement,
}: {
  product: Product;
  onRegisterMovement: (input: {
    type: ProductMovementType;
    quantity: number;
    description?: string;
  }) => Promise<unknown>;
}) {
  // Qué tipo abrió el modal (el + sugiere entrada, el − sugiere salida) —
  // igual modal que "Registrar movimiento" en el detalle del producto, así
  // el stepper del grid también deja un motivo, no solo la cantidad.
  const [pendingType, setPendingType] = useState<ProductMovementType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lowStock = product.minStock !== null && product.stock <= product.minStock;

  async function save(input: { type: ProductMovementType; quantity: number; description?: string }) {
    setIsSaving(true);
    try {
      await onRegisterMovement(input);
      setPendingType(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <Link href={`/inventario/${product.id}`} className="block">
        <div className="relative aspect-square w-full">
          <ProductPhoto name={product.name} src={product.photo} className="h-full w-full" />
          {lowStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-white">
              Stock bajo
            </span>
          ) : null}
        </div>
        <p className="px-3 pt-3 font-medium leading-tight line-clamp-2">{product.name}</p>
      </Link>

      <div className="mt-2 flex items-center justify-between gap-2 px-3 pb-3">
        <button
          type="button"
          aria-label={`Registrar salida de ${product.name}`}
          onClick={() => setPendingType("exit")}
          disabled={product.stock <= 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-lg font-bold text-neutral-600 transition active:scale-95 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300"
        >
          −
        </button>
        <span className={cn("min-w-[2.5ch] text-center font-bold", lowStock && "text-secondary")}>
          {product.stock}
        </span>
        <button
          type="button"
          aria-label={`Registrar entrada de ${product.name}`}
          onClick={() => setPendingType("entry")}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white transition active:scale-95 disabled:opacity-40"
        >
          +
        </button>
      </div>

      {pendingType ? (
        <RegisterMovementModal
          currentStock={product.stock}
          defaultType={pendingType}
          defaultQuantity="1"
          onClose={() => setPendingType(null)}
          isSaving={isSaving}
          onSave={save}
        />
      ) : null}
    </Card>
  );
}
