"use client";

import { useState } from "react";
import type { Product } from "@barber/types";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";

export function ProductFormModal({
  product,
  onClose,
  onSave,
  isSaving,
}: {
  // Sin producto = alta (permite cargar stock inicial). Con producto =
  // edición (name/minStock nada más, el stock ya no se toca acá).
  product?: Product;
  onClose: () => void;
  onSave: (input: { name: string; stock?: number; minStock: number | null }) => void;
  isSaving: boolean;
}) {
  const isEdit = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [stock, setStock] = useState(product ? "" : "0");
  const [minStock, setMinStock] = useState(product?.minStock != null ? String(product.minStock) : "");

  const stockNumber = stock.trim() ? Number(stock) : 0;
  // null (no undefined) para que, al editar, borrar el campo realmente
  // quite el mínimo ya configurado en vez de dejarlo sin tocar.
  const minStockNumber = minStock.trim() ? Number(minStock) : null;
  const isValid =
    name.trim().length > 0 &&
    Number.isInteger(stockNumber) &&
    stockNumber >= 0 &&
    (minStockNumber === null || (Number.isInteger(minStockNumber) && minStockNumber >= 0));

  function save() {
    if (!isValid) return;
    onSave({ name: name.trim(), stock: isEdit ? undefined : stockNumber, minStock: minStockNumber });
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Editar producto" : "Nuevo producto"}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Nombre
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pomada mate"
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          {!isEdit ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                Stock inicial
              </span>
              <input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                inputMode="numeric"
                className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Stock mínimo
            </span>
            <input
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              placeholder="Sin aviso"
              inputMode="numeric"
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
        </div>

        <Button fullWidth onClick={save} disabled={!isValid || isSaving}>
          {isSaving ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar producto"}
        </Button>
      </div>
    </Modal>
  );
}
