"use client";

import { useState } from "react";
import type { ProductMovementType } from "@barber/types";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Modal } from "@/components/modal";

export function RegisterMovementModal({
  currentStock,
  defaultType = "entry",
  defaultQuantity = "",
  onClose,
  onSave,
  isSaving,
}: {
  currentStock: number;
  // El stepper +/- del grid abre este mismo modal con el tipo y la cantidad
  // ya sugeridos (docs/API.md, Inventario) en vez de registrar el
  // movimiento directo, para que siempre quede un motivo asociado.
  defaultType?: ProductMovementType;
  defaultQuantity?: string;
  onClose: () => void;
  onSave: (input: { type: ProductMovementType; quantity: number; description?: string }) => void;
  isSaving: boolean;
}) {
  const [type, setType] = useState<ProductMovementType>(defaultType);
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [description, setDescription] = useState("");

  const quantityNumber = Number(quantity);
  const isValid =
    quantity.trim().length > 0 &&
    Number.isInteger(quantityNumber) &&
    quantityNumber > 0 &&
    (type === "entry" || quantityNumber <= currentStock);

  function save() {
    if (!isValid) return;
    onSave({ type, quantity: quantityNumber, description: description.trim() || undefined });
  }

  return (
    <Modal open onClose={onClose} title="Registrar movimiento">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Chip selected={type === "entry"} onClick={() => setType("entry")} className="flex-1">
            Entrada
          </Chip>
          <Chip selected={type === "exit"} onClick={() => setType("exit")} className="flex-1">
            Salida
          </Chip>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Cantidad
          </span>
          <input
            autoFocus
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1"
            inputMode="numeric"
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          {type === "exit" && quantityNumber > currentStock ? (
            <span className="text-sm text-secondary">Solo hay {currentStock} en stock.</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Motivo (opcional)
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === "entry" ? "Compra / Reposición" : "Merma / Rotura"}
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>

        <Button fullWidth onClick={save} disabled={!isValid || isSaving}>
          {isSaving ? "Guardando..." : "Guardar movimiento"}
        </Button>
      </div>
    </Modal>
  );
}
