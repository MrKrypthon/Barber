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
import { mockBusiness } from "@/mocks/business";

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
    <div className="flex items-center gap-3 px-4 py-3.5">
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
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Configuración" />

      <Card className="divide-y divide-neutral-100 p-0">
        <ConfigRow label="Nombre del negocio" value={mockBusiness.name} />
        <ConfigRow label="Horario de atención" value={mockBusiness.schedule} />
        <ConfigRow label="Servicios y precios" href="/config/servicios" dot={mockBusiness.secondaryColor} />
        {/* Vista exclusiva del owner (mockup pág. 9); el gate por rol llega con auth. */}
        <ConfigRow label="Panel del administrador" href="/panel" dot={mockBusiness.primaryColor} />
      </Card>

      <Card className="divide-y divide-neutral-100 p-0">
        <ConfigRow label="Color primario" value={mockBusiness.primaryColor} dot={mockBusiness.primaryColor} />
        <ConfigRow label="Color secundario" value={mockBusiness.secondaryColor} dot={mockBusiness.secondaryColor} />
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="h-3 w-3 rounded-full bg-success" />
          <span className="flex-1 font-medium">WhatsApp</span>
          <span className="text-sm font-medium text-success">
            {mockBusiness.whatsappConnected ? "Conectado" : "No conectado"}
          </span>
        </div>
      </Card>

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
