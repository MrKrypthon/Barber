"use client";

import { useState } from "react";
import type { UpdateWhatsAppConnectionInput } from "@barber/types";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";

export function EditWhatsAppConnectionModal({
  onClose,
  onSave,
  isSaving,
  error,
}: {
  onClose: () => void;
  onSave: (input: UpdateWhatsAppConnectionInput) => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const canSave = phoneNumberId.trim() && wabaId.trim() && accessToken.trim();

  return (
    <Modal open onClose={onClose} title="Conectar API oficial de WhatsApp">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          Pegá los datos de tu app de WhatsApp Business en Meta (Phone Number ID, WABA ID y token de
          acceso permanente).
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Phone Number ID
          </span>
          <input
            autoFocus
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            WABA ID
          </span>
          <input
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Token de acceso
          </span>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        {error ? <p className="text-sm text-secondary">{error}</p> : null}
        <div className="flex flex-col gap-3">
          <Button
            fullWidth
            disabled={!canSave || isSaving}
            onClick={() =>
              onSave({
                phoneNumberId: phoneNumberId.trim(),
                wabaId: wabaId.trim(),
                accessToken: accessToken.trim(),
              })
            }
          >
            {isSaving ? "Conectando..." : "Conectar"}
          </Button>
          <Button variant="danger-outline" fullWidth onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
