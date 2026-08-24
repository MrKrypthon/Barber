"use client";

import { useState } from "react";
import { ApiError } from "@barber/api-client";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { useWhatsAppConnection } from "@/hooks/use-whatsapp-connection";
import { EditWhatsAppConnectionModal } from "./edit-whatsapp-connection-modal";

// Segunda etapa de WhatsApp (docs/DECISIONS.md ADR-011): recordatorios de
// turno y recibos de pago vía la API oficial de Meta. A diferencia de
// WhatsAppBookingCard (el enlace wa.me gratuito), esto requiere que el
// dueño ya tenga su propia app de WhatsApp Business creada en Meta.
export function WhatsAppConnectionCard() {
  const { connection, isLoading, upsertConnection, isUpserting, removeConnection, isRemoving } =
    useWhatsAppConnection();
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function handleRemove() {
    setRemoveError(null);
    try {
      await removeConnection();
    } catch (err) {
      setRemoveError(err instanceof ApiError ? err.message : "No se pudo desconectar.");
    }
  }

  if (isLoading) return null;

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        Recordatorios y recibos por WhatsApp
      </h2>
      <Card className="flex flex-col gap-3">
        {connection?.connected ? (
          <>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success" />
              <p className="font-medium">Conectado</p>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Token •••{connection.accessTokenPreview}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Los clientes reciben un recordatorio 2 horas antes de su turno y el recibo en foto al
              cobrar la venta.
            </p>
            {removeError ? <p className="text-sm text-secondary">{removeError}</p> : null}
            <Button variant="danger-outline" fullWidth onClick={handleRemove} disabled={isRemoving}>
              {isRemoving ? "Desconectando..." : "Desconectar"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Conectá tu app de WhatsApp Business en Meta para mandar recordatorios de turno y
              recibos de pago en foto de forma automática.
            </p>
            <Button fullWidth onClick={() => setEditing(true)}>
              Conectar
            </Button>
          </>
        )}
      </Card>

      {editing ? (
        <EditWhatsAppConnectionModal
          isSaving={isUpserting}
          error={saveError}
          onClose={() => {
            setEditing(false);
            setSaveError(null);
          }}
          onSave={async (input) => {
            setSaveError(null);
            try {
              await upsertConnection(input);
              setEditing(false);
            } catch (err) {
              setSaveError(err instanceof ApiError ? err.message : "No se pudo conectar.");
            }
          }}
        />
      ) : null}
    </div>
  );
}
