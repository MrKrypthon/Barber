"use client";

import { ApiError } from "@barber/api-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { PageHeader } from "@/components/page-header";
import { useEmployees } from "@/hooks/use-employees";

const INPUT_CLASS =
  "h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const LABEL_CLASS = "text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500";

export function EmployeeFormView({ employeeId }: { employeeId?: string }) {
  const router = useRouter();
  const {
    employees,
    isLoading,
    addEmployee,
    isAdding,
    updateEmployee,
    isUpdating,
    removeEmployee,
    isRemoving,
  } = useEmployees();
  const isEdit = Boolean(employeeId);
  const existing = employeeId ? employees.find((e) => e.id === employeeId) : undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hydrated, setHydrated] = useState(!isEdit);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  // El empleado a editar viene del cache de useEmployees (ya cargado al
  // entrar desde la lista); si se abre esta URL directamente puede tardar en
  // llegar, por eso se hidrata el formulario en un efecto (mismo criterio
  // que ServiceFormView).
  useEffect(() => {
    if (existing && !hydrated) {
      setName(existing.name);
      setEmail(existing.email);
      setHydrated(true);
    }
  }, [existing, hydrated]);

  const isValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    (isEdit || password.length >= 8) &&
    (password.length === 0 || password.length >= 8);
  const isSaving = isAdding || isUpdating;

  async function save() {
    if (!isValid) return;
    setError(null);
    try {
      if (isEdit && employeeId) {
        await updateEmployee({
          id: employeeId,
          input: { name: name.trim(), email: email.trim(), password: password || undefined },
        });
      } else {
        await addEmployee({ name: name.trim(), email: email.trim(), password });
      }
      router.push("/config/empleados");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el empleado.");
    }
  }

  async function confirmRemove() {
    if (!employeeId) return;
    await removeEmployee(employeeId);
    router.push("/config/empleados");
  }

  if (isEdit && !hydrated) {
    return (
      <div>
        <PageHeader title="Editar empleado" backHref="/config/empleados" />
        <p className="py-10 text-center text-neutral-400 dark:text-neutral-500">
          {isLoading ? "Cargando..." : "Empleado no encontrado."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={isEdit ? "Editar empleado" : "Nuevo empleado"} backHref="/config/empleados" />

      <Card className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Nombre</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre y apellido"
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="empleado@negocio.com"
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>{isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? "Dejar en blanco para no cambiarla" : "Mínimo 8 caracteres"}
            className={INPUT_CLASS}
          />
        </label>

        {error ? <p className="text-sm text-secondary">{error}</p> : null}

        <Button size="lg" fullWidth onClick={save} disabled={!isValid || isSaving} className="md:w-auto">
          {isSaving ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar empleado"}
        </Button>
      </Card>

      {isEdit ? (
        <Card className="mt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Dar de baja</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Ya no va a poder iniciar sesión. Sus ventas y turnos pasados quedan intactos.
              </p>
            </div>
            <Button variant="danger-outline" onClick={() => setConfirmRemoveOpen(true)}>
              Dar de baja
            </Button>
          </div>
        </Card>
      ) : null}

      {confirmRemoveOpen ? (
        <Modal open onClose={() => setConfirmRemoveOpen(false)} title="Dar de baja empleado">
          <p className="mb-4 text-neutral-600 dark:text-neutral-300">
            <strong>{existing?.name}</strong> ya no va a poder iniciar sesión. Sus ventas y turnos
            pasados quedan en el historial.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setConfirmRemoveOpen(false)}>
              Cancelar
            </Button>
            <Button variant="dark" fullWidth onClick={confirmRemove} disabled={isRemoving}>
              {isRemoving ? "Dando de baja..." : "Confirmar"}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
