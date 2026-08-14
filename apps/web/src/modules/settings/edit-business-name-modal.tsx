"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";

export function EditBusinessNameModal({
  currentName,
  onClose,
  onSave,
  isSaving,
}: {
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(currentName);
  const hasChanged = name.trim().length > 0 && name.trim() !== currentName;

  return (
    <Modal open onClose={onClose} title="Nombre del negocio">
      <div className="flex flex-col gap-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del negocio"
          className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <div className="flex flex-col gap-3">
          {hasChanged ? (
            <Button fullWidth onClick={() => onSave(name.trim())} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar cambio"}
            </Button>
          ) : null}
          <Button variant="danger-outline" fullWidth onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
