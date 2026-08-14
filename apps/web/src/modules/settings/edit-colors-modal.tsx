"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const isValid = HEX_COLOR_PATTERN.test(value);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={isValid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-12 shrink-0 cursor-pointer rounded-xl border border-neutral-200 dark:border-neutral-700"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="h-12 flex-1 rounded-xl border border-neutral-200 bg-white px-4 uppercase outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
    </label>
  );
}

export function EditColorsModal({
  currentPrimary,
  currentSecondary,
  currentBackground,
  onClose,
  onSave,
  isSaving,
}: {
  currentPrimary: string;
  currentSecondary: string;
  currentBackground: string;
  onClose: () => void;
  onSave: (input: { primaryColor: string; secondaryColor: string; backgroundColor: string }) => void;
  isSaving: boolean;
}) {
  const [primary, setPrimary] = useState(currentPrimary);
  const [secondary, setSecondary] = useState(currentSecondary);
  const [background, setBackground] = useState(currentBackground);

  const isValid =
    HEX_COLOR_PATTERN.test(primary) &&
    HEX_COLOR_PATTERN.test(secondary) &&
    HEX_COLOR_PATTERN.test(background);
  const hasChanged =
    isValid &&
    (primary !== currentPrimary || secondary !== currentSecondary || background !== currentBackground);

  return (
    <Modal open onClose={onClose} title="Colores del negocio">
      <div className="flex flex-col gap-5">
        <ColorField label="Color primario" value={primary} onChange={setPrimary} />
        <ColorField label="Color secundario" value={secondary} onChange={setSecondary} />
        <ColorField label="Color de fondo" value={background} onChange={setBackground} />
        {!isValid ? (
          <p className="text-sm text-secondary">Usá un color válido en formato #RRGGBB.</p>
        ) : null}

        <div className="flex flex-col gap-3">
          {hasChanged ? (
            <Button
              fullWidth
              onClick={() =>
                onSave({ primaryColor: primary, secondaryColor: secondary, backgroundColor: background })
              }
              disabled={isSaving}
            >
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
