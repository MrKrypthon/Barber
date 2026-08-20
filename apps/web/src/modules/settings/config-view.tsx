"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { ChevronRightIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Toggle } from "@/components/toggle";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettings } from "@/hooks/use-settings";
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } from "@/lib/brand-defaults";
import { cn } from "@/lib/cn";
import { formatSchedule } from "@/lib/format";
import { resizeImageToDataUrl } from "@/lib/image";
import { EditBusinessNameModal } from "./edit-business-name-modal";
import { EditColorsModal } from "./edit-colors-modal";
import { EditScheduleModal } from "./edit-schedule-modal";

function ConfigRow({
  label,
  value,
  href,
  onClick,
  dot,
}: {
  label: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  dot?: string;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        (href || onClick) &&
          "transition-colors duration-150 hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-800 dark:active:bg-neutral-700",
      )}
    >
      {dot ? (
        <span
          className="h-3 w-3 rounded-full border border-neutral-200 dark:border-neutral-700"
          style={{ backgroundColor: dot }}
        />
      ) : null}
      <span className="flex-1 font-medium">{label}</span>
      {value ? <span className="text-sm text-neutral-400 dark:text-neutral-500">{value}</span> : null}
      {href || onClick ? (
        <ChevronRightIcon className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
      ) : null}
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  if (onClick)
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  return content;
}

const APPEARANCE_OPTIONS: { value: "light" | "dark" | "system"; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
];

export function ConfigView() {
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const { user, logout } = useAuth();
  const { preference, setPreference } = useColorScheme();
  const canEdit = user?.role === "owner";
  const { settings, isLoading, isError, updateSettings, isUpdating } = useSettings();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [editingColors, setEditingColors] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      await updateSettings({ logo: dataUrl });
    } catch {
      setPhotoError("No se pudo actualizar la foto. Probá con otra imagen.");
    }
  }

  const primaryColor = settings?.primaryColor ?? DEFAULT_PRIMARY_COLOR;
  const secondaryColor = settings?.secondaryColor ?? DEFAULT_SECONDARY_COLOR;
  const backgroundColor = settings?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR;
  const scheduleLabel = settings
    ? formatSchedule(settings.scheduleDays, settings.scheduleOpen, settings.scheduleClose) ??
      "No configurado"
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Configuración" />

      {isLoading ? (
        <Card>
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">Cargando configuración...</p>
        </Card>
      ) : isError ? (
        <Card>
          <p className="py-6 text-center text-secondary">No se pudo cargar la configuración.</p>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col items-center gap-3 py-6">
            <Avatar
              name={settings?.businessName ?? ""}
              src={settings?.logo}
              className="h-24 w-24 text-2xl"
            />
            {canEdit ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Subiendo..." : "Cambiar foto"}
                </Button>
                {photoError ? <p className="text-sm text-secondary">{photoError}</p> : null}
              </>
            ) : null}
          </Card>

          <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
            <ConfigRow
              label="Nombre del negocio"
              value={settings?.businessName}
              onClick={canEdit ? () => setEditingName(true) : undefined}
            />
            <ConfigRow
              label="Horario de atención"
              value={scheduleLabel}
              onClick={canEdit ? () => setEditingSchedule(true) : undefined}
            />
            <ConfigRow label="Servicios y precios" href="/config/servicios" dot={secondaryColor} />
            {/* Gestión de empleados es exclusiva del owner (docs/PROJECT.md) — a
                diferencia de "Panel del administrador", ni siquiera se muestra. */}
            {canEdit ? (
              <ConfigRow label="Empleados" href="/config/empleados" dot={primaryColor} />
            ) : null}
            {/* Vista exclusiva del owner (mockup pág. 9); el gate por rol llega con auth. */}
            <ConfigRow label="Panel del administrador" href="/panel" dot={primaryColor} />
          </Card>

          <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
            <ConfigRow
              label="Color primario"
              value={primaryColor}
              dot={primaryColor}
              onClick={canEdit ? () => setEditingColors(true) : undefined}
            />
            <ConfigRow
              label="Color secundario"
              value={secondaryColor}
              dot={secondaryColor}
              onClick={canEdit ? () => setEditingColors(true) : undefined}
            />
            <ConfigRow
              label="Color de fondo"
              value={backgroundColor}
              dot={backgroundColor}
              onClick={canEdit ? () => setEditingColors(true) : undefined}
            />
            {/* Integración de WhatsApp es v0.4 (docs/ROADMAP.md) — todavía no existe. */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="h-3 w-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span className="flex-1 font-medium">WhatsApp</span>
              <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">No conectado</span>
            </div>
          </Card>
        </>
      )}

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Apariencia
        </h2>
        <Card className="flex items-center justify-between gap-4">
          <span className="font-medium">Tema</span>
          <div className="flex gap-2">
            {APPEARANCE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={preference === option.value}
                onClick={() => setPreference(option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
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

      {editingName && settings ? (
        <EditBusinessNameModal
          currentName={settings.businessName}
          onClose={() => setEditingName(false)}
          isSaving={isUpdating}
          onSave={async (businessName) => {
            await updateSettings({ businessName });
            setEditingName(false);
          }}
        />
      ) : null}

      {editingSchedule && settings ? (
        <EditScheduleModal
          currentDays={settings.scheduleDays}
          currentOpen={settings.scheduleOpen}
          currentClose={settings.scheduleClose}
          onClose={() => setEditingSchedule(false)}
          isSaving={isUpdating}
          onSave={async (input) => {
            await updateSettings(input);
            setEditingSchedule(false);
          }}
        />
      ) : null}

      {editingColors ? (
        <EditColorsModal
          currentPrimary={primaryColor}
          currentSecondary={secondaryColor}
          currentBackground={backgroundColor}
          onClose={() => setEditingColors(false)}
          isSaving={isUpdating}
          onSave={async (input) => {
            await updateSettings(input);
            setEditingColors(false);
          }}
        />
      ) : null}
    </div>
  );
}
