"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";

export function EditPhoneModal({
  currentPhone,
  onClose,
  onSave,
  isSaving,
}: {
  currentPhone: string | null;
  onClose: () => void;
  onSave: (phone: string) => void;
  isSaving: boolean;
}) {
  const [phone, setPhone] = useState(currentPhone ?? "");
  const hasChanged = phone.trim().length > 0 && phone.trim() !== (currentPhone ?? "");

  return (
    <Modal open onClose={onClose} title="WhatsApp del negocio">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Número con código de país
          </span>
          <input
            autoFocus
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="52 55 1234 5678"
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          Es el número al que te van a escribir los clientes que reserven por WhatsApp.
        </p>
        <div className="flex flex-col gap-3">
          {hasChanged ? (
            <Button fullWidth onClick={() => onSave(phone.trim())} disabled={isSaving}>
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
