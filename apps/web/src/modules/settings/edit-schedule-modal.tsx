"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Modal } from "@/components/modal";
import { SCHEDULE_DAYS, SCHEDULE_DAY_LABELS } from "@/lib/format";

export function EditScheduleModal({
  currentDays,
  currentOpen,
  currentClose,
  onClose,
  onSave,
  isSaving,
}: {
  currentDays: string[];
  currentOpen: string | null;
  currentClose: string | null;
  onClose: () => void;
  onSave: (input: { scheduleDays: string[]; scheduleOpen: string; scheduleClose: string }) => void;
  isSaving: boolean;
}) {
  const [days, setDays] = useState<string[]>(currentDays);
  const [open, setOpen] = useState(currentOpen ?? "09:00");
  const [close, setClose] = useState(currentClose ?? "19:00");

  const isValid = days.length > 0 && open < close;
  const hasChanged =
    isValid &&
    (days.length !== currentDays.length ||
      !days.every((d) => currentDays.includes(d)) ||
      open !== currentOpen ||
      close !== currentClose);

  function toggleDay(day: string) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  return (
    <Modal open onClose={onClose} title="Horario de atención">
      <div className="flex flex-col gap-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Días abiertos
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SCHEDULE_DAYS.map((day) => (
              <Chip key={day} selected={days.includes(day)} onClick={() => toggleDay(day)}>
                {SCHEDULE_DAY_LABELS[day]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Abre
            </span>
            <input
              type="time"
              value={open}
              onChange={(e) => setOpen(e.target.value)}
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Cierra
            </span>
            <input
              type="time"
              value={close}
              onChange={(e) => setClose(e.target.value)}
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
        </div>
        {days.length > 0 && open >= close ? (
          <p className="text-sm text-secondary">La hora de cierre debe ser posterior a la de apertura.</p>
        ) : null}

        <div className="flex flex-col gap-3">
          {hasChanged ? (
            <Button
              fullWidth
              onClick={() => onSave({ scheduleDays: days, scheduleOpen: open, scheduleClose: close })}
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
