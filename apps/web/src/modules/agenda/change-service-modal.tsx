"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { useServices } from "@/hooks/use-services";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { Appointment } from "@/mocks/types";

export function ChangeServiceModal({
  appointment,
  onClose,
  onSave,
  isSaving,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSave: (serviceId: string) => void;
  isSaving: boolean;
}) {
  const { services } = useServices();
  const [selectedServiceId, setSelectedServiceId] = useState(appointment.serviceId);
  const hasChanged = selectedServiceId !== appointment.serviceId;

  return (
    <Modal open onClose={onClose} title={`Turno de ${appointment.customerName}`}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-neutral-500">Cambiar servicio</p>
        <div className="grid grid-cols-2 gap-3">
          {services
            .filter((s) => s.active)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedServiceId(s.id)}
                className={cn(
                  "rounded-2xl p-4 text-left transition duration-150 active:scale-[0.98]",
                  selectedServiceId === s.id
                    ? "bg-primary text-white shadow-card-hover"
                    : "bg-white shadow-card hover:shadow-card-hover",
                )}
              >
                <p className="font-semibold">{s.name}</p>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    selectedServiceId === s.id ? "text-white/80" : "text-neutral-500",
                  )}
                >
                  {formatCurrency(s.price)}
                </p>
              </button>
            ))}
        </div>
        <div className="flex flex-col gap-3">
          {hasChanged ? (
            <Button fullWidth onClick={() => onSave(selectedServiceId)} disabled={isSaving}>
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
