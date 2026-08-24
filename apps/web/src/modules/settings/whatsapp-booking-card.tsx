"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { buildBookingMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

// Primera etapa de WhatsApp (docs/PROJECT.md §WhatsApp): un enlace wa.me con
// mensaje predefinido para compartir fuera de la app — no hay página pública
// propia todavía, así que "reservar por WhatsApp" es esto: un link que el
// dueño pega en su bio de Instagram, WhatsApp Business, etc.
export function WhatsAppBookingCard({
  businessName,
  phone,
}: {
  businessName: string;
  phone: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = buildWhatsAppUrl(buildBookingMessage(businessName), phone);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso/soporte de clipboard (ej. sin HTTPS) el botón "Probar"
      // sigue funcionando como alternativa — no hace falta avisar de esto.
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        Reservar por WhatsApp
      </h2>
      <Card className="flex flex-col gap-3">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Compartí este enlace donde prefieras (bio de Instagram, WhatsApp Business, Google) — al
          tocarlo, el cliente te escribe directo con un mensaje ya armado.
        </p>
        <div className="flex gap-3">
          <a href={url} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="outline" fullWidth>
              Probar
            </Button>
          </a>
          <div className="flex-1">
            <Button variant="secondary" fullWidth onClick={handleCopy}>
              {copied ? "¡Copiado!" : "Copiar enlace"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
