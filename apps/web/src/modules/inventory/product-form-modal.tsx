"use client";

import { useRef, useState } from "react";
import type { Product } from "@barber/types";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { resizeImageToDataUrl } from "@/lib/image";
import { ProductPhoto } from "./product-photo";

export function ProductFormModal({
  product,
  onClose,
  onSave,
  isSaving,
}: {
  // Sin producto = alta (permite cargar stock inicial). Con producto =
  // edición (name/photo/minStock nada más, el stock ya no se toca acá).
  product?: Product;
  onClose: () => void;
  onSave: (input: { name: string; photo?: string; stock?: number; minStock: number | null }) => void;
  isSaving: boolean;
}) {
  const isEdit = Boolean(product);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [photo, setPhoto] = useState(product?.photo ?? undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);
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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    try {
      setPhoto(await resizeImageToDataUrl(file));
    } catch {
      setPhotoError("No se pudo cargar la foto. Probá con otra imagen.");
    }
  }

  function save() {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      photo,
      stock: isEdit ? undefined : stockNumber,
      minStock: minStockNumber,
    });
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Editar producto" : "Nuevo producto"}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Elegir foto del producto"
            className="h-24 w-24 overflow-hidden rounded-2xl ring-1 ring-neutral-200 dark:ring-neutral-700"
          >
            <ProductPhoto name={name || "?"} src={photo} className="h-full w-full" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-semibold text-primary"
          >
            {photo ? "Cambiar foto" : "Agregar foto"}
          </button>
          {photoError ? <p className="text-sm text-secondary">{photoError}</p> : null}
        </div>

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
