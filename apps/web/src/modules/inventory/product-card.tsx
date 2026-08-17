"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@barber/types";
import { Card } from "@/components/card";
import { cn } from "@/lib/cn";
import { ProductPhoto } from "./product-photo";

export function ProductCard({
  product,
  onAdjust,
}: {
  product: Product;
  onAdjust: (delta: 1 | -1) => Promise<unknown>;
}) {
  // Estado local (no el de la mutación compartida en useProducts): así solo
  // se deshabilita el stepper de esta tarjeta mientras registra, no el de
  // todo el grid.
  const [busy, setBusy] = useState(false);
  const lowStock = product.minStock !== null && product.stock <= product.minStock;

  async function adjust(delta: 1 | -1) {
    if (busy) return;
    setBusy(true);
    try {
      await onAdjust(delta);
    } finally {
      setBusy(false);
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
          aria-label={`Quitar una unidad de ${product.name}`}
          onClick={() => adjust(-1)}
          disabled={busy || product.stock <= 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-lg font-bold text-neutral-600 transition active:scale-95 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300"
        >
          −
        </button>
        <span className={cn("min-w-[2.5ch] text-center font-bold", lowStock && "text-secondary")}>
          {product.stock}
        </span>
        <button
          type="button"
          aria-label={`Agregar una unidad de ${product.name}`}
          onClick={() => adjust(1)}
          disabled={busy}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white transition active:scale-95 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </Card>
  );
}
