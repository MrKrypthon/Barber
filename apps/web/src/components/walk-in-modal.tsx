"use client";

import { ApiError } from "@barber/api-client";
import type { Service } from "@barber/types";
import { useState } from "react";
import { useCreateAppointment } from "@/hooks/use-agenda";
import { useAuth } from "@/hooks/use-auth";
import { useCustomers } from "@/hooks/use-customers";
import { useServices } from "@/hooks/use-services";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { Button } from "./button";
import { Modal } from "./modal";
import { StaffPicker } from "./staff-picker";

const CUSTOMERS_DATALIST_ID = "walk-in-customers";

// Cliente sin turno: el horario es "ahora" (no se elige día/hora) y el
// cliente se busca por nombre exacto (sin distinguir mayúsculas) — si ya
// existe se reusa (con su teléfono ya guardado, sin pisarlo), si no existe
// se crea con el nombre y teléfono cargados acá, para no fragmentar su
// historial de visitas/recordatorios en registros duplicados.
export function WalkInModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { services } = useServices();
  const { customers, addCustomer } = useCustomers();
  const { createAppointment, isCreating } = useCreateAppointment();

  const [service, setService] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeId, setEmployeeId] = useState(() => user?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const existingCustomer = customers.find(
    (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase(),
  );
  const canSubmit = Boolean(service) && trimmedName.length > 0 && !isCreating;

  async function handleSubmit() {
    if (!service || !trimmedName) return;

    setError(null);
    try {
      const customerId = existingCustomer
        ? existingCustomer.id
        : (await addCustomer({ name: trimmedName, phone: phone.trim() || undefined })).id;

      await createAppointment({
        customerId,
        serviceId: service.id,
        employeeId: employeeId || undefined,
        startAt: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la visita.");
    }
  }

  return (
    <Modal open onClose={onClose} title="Cliente sin turno">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Se registra como un turno ahora mismo, con el servicio y el nombre del cliente.
        </p>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Servicio
          </span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {services
              .filter((s) => s.active)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setService(s)}
                  className={cn(
                    "rounded-2xl p-4 text-left transition duration-150 active:scale-[0.98]",
                    service?.id === s.id
                      ? "bg-primary text-white shadow-card-hover"
                      : "bg-white shadow-card hover:shadow-card-hover dark:bg-neutral-900 dark:ring-1 dark:ring-neutral-800",
                  )}
                >
                  <p className="font-semibold">{s.name}</p>
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      service?.id === s.id ? "text-white/80" : "text-neutral-500 dark:text-neutral-400",
                    )}
                  >
                    {formatCurrency(s.price)}
                  </p>
                </button>
              ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Nombre del cliente
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
            placeholder="Nombre y apellido"
            list={CUSTOMERS_DATALIST_ID}
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <datalist id={CUSTOMERS_DATALIST_ID}>
            {customers.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </label>

        {existingCustomer ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Cliente existente — se usa su teléfono ya guardado.
          </p>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Teléfono (opcional)
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
              placeholder="11 5555-5555"
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
        )}

        <StaffPicker value={employeeId} onChange={setEmployeeId} />

        {error ? <p className="text-sm text-secondary">{error}</p> : null}

        <div className="flex flex-col gap-3">
          <Button fullWidth onClick={handleSubmit} disabled={!canSubmit}>
            {isCreating ? "Registrando..." : "Registrar"}
          </Button>
          <Button variant="danger-outline" fullWidth onClick={onClose} disabled={isCreating}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
