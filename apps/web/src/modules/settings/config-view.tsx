"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { ChevronRightIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Toggle } from "@/components/toggle";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/cn";

const DEFAULT_PRIMARY_COLOR = "#24406B";
const DEFAULT_SECONDARY_COLOR = "#C0392B";

function ConfigRow({
  label,
  value,
  href,
  dot,
}: {
  label: string;
  value?: string;
  href?: string;
  dot?: string;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        href && "transition-colors duration-150 hover:bg-neutral-50 active:bg-neutral-100",
      )}
    >
      {dot ? <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dot }} /> : null}
      <span className="flex-1 font-medium">{label}</span>
      {value ? <span className="text-sm text-neutral-400">{value}</span> : null}
      {href ? <ChevronRightIcon className="h-5 w-5 text-neutral-300" /> : null}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export function ConfigView() {
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const { logout } = useAuth();
  const { settings, isLoading, isError } = useSettings();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const primaryColor = settings?.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const secondaryColor = settings?.secondaryColor ?? DEFAULT_SECONDARY_COLOR;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Configuración" />

      {isLoading ? (
        <Card>
          <p className="py-6 text-center text-neutral-400">Cargando configuración...</p>
        </Card>
      ) : isError ? (
        <Card>
          <p className="py-6 text-center text-secondary">No se pudo cargar la configuración.</p>
        </Card>
      ) : (
        <>
          <Card className="divide-y divide-neutral-100 p-0">
            <ConfigRow label="Nombre del negocio" value={settings?.businessName} />
            {/* Sin campo en el backend todavía (docs/DATABASE.md solo define
                logo/colores/contacto para business_settings). */}
            <ConfigRow label="Horario de atención" value="No configurado" />
            <ConfigRow label="Servicios y precios" href="/config/servicios" dot={secondaryColor} />
            {/* Vista exclusiva del owner (mockup pág. 9); el gate por rol llega con auth. */}
            <ConfigRow label="Panel del administrador" href="/panel" dot={primaryColor} />
          </Card>

          <Card className="divide-y divide-neutral-100 p-0">
            <ConfigRow label="Color primario" value={primaryColor} dot={primaryColor} />
            <ConfigRow label="Color secundario" value={secondaryColor} dot={secondaryColor} />
            {/* Integración de WhatsApp es v0.4 (docs/ROADMAP.md) — todavía no existe. */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="h-3 w-3 rounded-full bg-neutral-300" />
              <span className="flex-1 font-medium">WhatsApp</span>
              <span className="text-sm font-medium text-neutral-400">No conectado</span>
            </div>
          </Card>
        </>
      )}

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Notificaciones
        </h2>
        <Card className="flex items-center justify-between gap-4">
          <span className="font-medium">Recordatorio de turno por WhatsApp</span>
          <Toggle
            checked={reminderEnabled}
            onChange={setReminderEnabled}
            label="Recordatorio de turno por WhatsApp"
          />
        </Card>
      </div>

      <Button variant="danger-soft" fullWidth onClick={handleLogout}>
        Cerrar sesión
      </Button>
    </div>
  );
}
