"use client";

import { useAssignableStaff } from "@/hooks/use-staff";
import { Chip } from "./chip";

// Selector de "¿quién atendió esto?" para agendar un turno o cobrar una
// venta. Con un solo miembro de equipo (el dueño solo, sin empleados
// todavía) no tiene sentido elegir, así que no se muestra.
export function StaffPicker({
  value,
  onChange,
  label = "¿Quién atiende?",
}: {
  value: string;
  onChange: (employeeId: string) => void;
  label?: string;
}) {
  const { staff } = useAssignableStaff();

  if (staff.length <= 1) return null;

  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {label}
      </span>
      <div className="mt-2 flex flex-wrap gap-2">
        {staff.map((s) => (
          <Chip key={s.id} selected={value === s.id} onClick={() => onChange(s.id)}>
            {s.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}
