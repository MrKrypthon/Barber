"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { PageHeader } from "@/components/page-header";
import { useServices } from "@/hooks/use-services";
import { cn } from "@/lib/cn";
import { SERVICE_COLORS, SERVICE_DURATIONS } from "@/mocks/services";

export function ServiceFormView({ serviceId }: { serviceId?: string }) {
  const router = useRouter();
  const { services, isLoading, addService, isAdding, updateService, isUpdating } = useServices();
  const isEdit = Boolean(serviceId);
  const existing = serviceId ? services.find((s) => s.id === serviceId) : undefined;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState(SERVICE_DURATIONS[0]);
  const [color, setColor] = useState(SERVICE_COLORS[0]);
  const [commissionPercent, setCommissionPercent] = useState("");
  const [hydrated, setHydrated] = useState(!isEdit);

  // El servicio a editar viene del cache de useServices (ya cargado al
  // entrar desde la lista); si se abre esta URL directamente puede tardar
  // en llegar, por eso se hidrata el formulario en un efecto en vez de en
  // el useState inicial.
  useEffect(() => {
    if (existing && !hydrated) {
      setName(existing.name);
      setPrice(String(existing.price));
      setDuration(existing.durationMinutes ?? SERVICE_DURATIONS[0]);
      setColor(existing.color ?? SERVICE_COLORS[0]);
      setCommissionPercent(existing.commissionPercent === null ? "" : String(existing.commissionPercent));
      setHydrated(true);
    }
  }, [existing, hydrated]);

  const priceNumber = Number(price);
  const commissionNumber = commissionPercent.trim() ? Number(commissionPercent) : null;
  const isValid =
    name.trim().length > 0 &&
    Number.isFinite(priceNumber) &&
    priceNumber >= 0 &&
    (commissionNumber === null || (Number.isFinite(commissionNumber) && commissionNumber >= 0 && commissionNumber <= 100));
  const isSaving = isAdding || isUpdating;

  async function save() {
    if (!isValid) return;
    const input = {
      name: name.trim(),
      price: priceNumber,
      durationMinutes: duration,
      color,
      commissionPercent: commissionNumber,
    };
    if (isEdit && serviceId) {
      await updateService({ id: serviceId, input });
    } else {
      await addService(input);
    }
    router.push("/config/servicios");
  }

  if (isEdit && !hydrated) {
    return (
      <div>
        <PageHeader title="Editar servicio" backHref="/config/servicios" />
        <p className="py-10 text-center text-neutral-400 dark:text-neutral-500">
          {isLoading ? "Cargando..." : "Servicio no encontrado."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={isEdit ? "Editar servicio" : "Nuevo servicio"} backHref="/config/servicios" />

      <Card className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-[1fr_10rem]">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Nombre
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Corte + Diseño"
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Precio
            </span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="$9.500"
              inputMode="numeric"
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Duración
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICE_DURATIONS.map((d) => (
              <Chip key={d} selected={duration === d} onClick={() => setDuration(d)}>
                {d} min
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Color
          </span>
          <div className="mt-2 flex gap-3">
            {SERVICE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={cn(
                  "h-10 w-10 rounded-full transition",
                  color === c && "ring-2 ring-offset-2 ring-neutral-800 dark:ring-offset-neutral-900",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <label className="flex max-w-[10rem] flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Comisión (opcional)
          </span>
          <div className="flex items-center gap-2">
            <input
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              placeholder="Sin comisión"
              inputMode="numeric"
              className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <span className="text-neutral-400 dark:text-neutral-500">%</span>
          </div>
        </label>

        <Button size="lg" fullWidth onClick={save} disabled={!isValid || isSaving} className="md:w-auto">
          {isSaving ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar servicio"}
        </Button>
      </Card>
    </div>
  );
}
