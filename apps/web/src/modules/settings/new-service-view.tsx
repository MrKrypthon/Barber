"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { PageHeader } from "@/components/page-header";
import { useServices } from "@/hooks/use-services";
import { cn } from "@/lib/cn";
import { SERVICE_COLORS, SERVICE_DURATIONS } from "@/mocks/services";

export function NewServiceView() {
  const router = useRouter();
  const { addService, isAdding } = useServices();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState(30);
  const [color, setColor] = useState(SERVICE_COLORS[0]);

  const priceNumber = Number(price);
  const isValid = name.trim().length > 0 && Number.isFinite(priceNumber) && priceNumber >= 0;

  async function save() {
    if (!isValid) return;
    await addService({ name: name.trim(), price: priceNumber, durationMinutes: duration, color });
    router.push("/config/servicios");
  }

  return (
    <div>
      <PageHeader title="Nuevo servicio" backHref="/config/servicios" />

      <Card className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-[1fr_10rem]">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Nombre
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Corte + Diseño"
              className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Precio
            </span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="$9.500"
              inputMode="numeric"
              className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
            />
          </label>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
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
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
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
                  color === c && "ring-2 ring-offset-2 ring-neutral-800",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <Button size="lg" fullWidth onClick={save} disabled={!isValid || isAdding} className="md:w-auto">
          {isAdding ? "Guardando..." : "Guardar servicio"}
        </Button>
      </Card>
    </div>
  );
}
