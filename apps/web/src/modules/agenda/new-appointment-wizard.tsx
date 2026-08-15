"use client";

import { ApiError } from "@barber/api-client";
import type { Customer, Service } from "@barber/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { StaffPicker } from "@/components/staff-picker";
import { StepIndicator } from "@/components/step-indicator";
import { useCreateAppointment } from "@/hooks/use-agenda";
import { useAuth } from "@/hooks/use-auth";
import { useCustomers } from "@/hooks/use-customers";
import { useServices } from "@/hooks/use-services";
import { useSettings } from "@/hooks/use-settings";
import { formatCurrency, withTime } from "@/lib/format";

function todayIsoDate(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function NewAppointmentWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const { services } = useServices();
  const { customers, addCustomer, isAdding: isAddingCustomer } = useCustomers();
  const { settings } = useSettings();
  const { createAppointment, isCreating } = useCreateAppointment();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [service, setService] = useState<Service | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [date, setDate] = useState(todayIsoDate);
  const [time, setTime] = useState("");
  const [employeeId, setEmployeeId] = useState(() => user?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else router.push("/agenda");
  }

  function pickService(s: Service) {
    setService(s);
    setStep(2);
  }

  function pickCustomer(c: Customer) {
    setCustomer(c);
    setStep(3);
  }

  async function saveNewCustomer() {
    const name = newCustomerName.trim();
    if (!name) return;
    pickCustomer(await addCustomer({ name }));
  }

  async function confirmAppointment() {
    if (!service || !customer || !time) return;
    setError(null);
    try {
      await createAppointment({
        customerId: customer.id,
        serviceId: service.id,
        employeeId: employeeId || undefined,
        startAt: withTime(new Date(`${date}T00:00:00`), time).toISOString(),
      });
      setStep(4);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo agendar el turno.");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="Volver"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 active:bg-neutral-200 dark:text-neutral-300 dark:active:bg-neutral-800"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold">Nuevo turno</h1>
      </header>

      {step <= 3 ? <StepIndicator step={step} /> : null}

      {/* Paso 1 — Elegí el servicio */}
      {step === 1 ? (
        <section>
          <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">1. Elegí el servicio</p>
          <div className="grid grid-cols-2 gap-3">
            {services
              .filter((s) => s.active)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickService(s)}
                  className="rounded-2xl bg-white p-5 text-left shadow-card transition duration-150 hover:shadow-card-hover active:scale-[0.98] dark:bg-neutral-900 dark:ring-1 dark:ring-neutral-800"
                >
                  <p className="font-semibold">{s.name}</p>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(s.price)}</p>
                </button>
              ))}
          </div>
        </section>
      ) : null}

      {/* Paso 2 — Elegí el cliente (siempre uno: un turno no admite "cliente ocasional") */}
      {step === 2 && service ? (
        <section className="flex flex-col gap-4">
          <label className="flex items-center gap-2 rounded-xl bg-white px-4 shadow-card dark:bg-neutral-900 dark:ring-1 dark:ring-neutral-800">
            <SearchIcon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="h-12 w-full bg-transparent outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </label>

          {addingCustomer ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveNewCustomer()}
                placeholder="Nombre del cliente"
                className="h-12 flex-1 rounded-xl border border-secondary bg-white px-4 outline-none dark:bg-neutral-900 dark:text-neutral-100"
              />
              <Button
                variant="secondary"
                onClick={saveNewCustomer}
                disabled={!newCustomerName.trim() || isAddingCustomer}
              >
                {isAddingCustomer ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          ) : (
            <Button variant="danger-outline" fullWidth onClick={() => setAddingCustomer(true)}>
              <PlusIcon className="h-5 w-5" /> Nuevo cliente
            </Button>
          )}

          <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
            {filteredCustomers.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
                Sin clientes que coincidan con la búsqueda.
              </p>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCustomer(c)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-800 dark:active:bg-neutral-700"
                >
                  <Avatar name={c.name} />
                  <span className="flex-1 font-medium">{c.name}</span>
                  <ChevronRightIcon className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
                </button>
              ))
            )}
          </Card>
        </section>
      ) : null}

      {/* Paso 3 — Día, hora y confirmación */}
      {step === 3 && service && customer ? (
        <section className="flex flex-col gap-5">
          <Card>
            <dl className="flex flex-col gap-2">
              <div className="flex justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">Cliente</dt>
                <dd className="font-semibold">{customer.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">Servicio</dt>
                <dd className="font-semibold">
                  {service.name} · {formatCurrency(service.price)}
                </dd>
              </div>
            </dl>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                Día
              </span>
              <input
                type="date"
                value={date}
                min={todayIsoDate()}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                Hora
              </span>
              <input
                type="time"
                value={time}
                min={settings?.scheduleOpen ?? undefined}
                max={settings?.scheduleClose ?? undefined}
                onChange={(e) => setTime(e.target.value)}
                className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
          </div>

          <StaffPicker value={employeeId} onChange={setEmployeeId} />

          {error ? <p className="text-sm text-secondary">{error}</p> : null}

          <Button size="lg" fullWidth onClick={confirmAppointment} disabled={!time || isCreating}>
            {isCreating ? "Agendando..." : "Agendar turno"}
          </Button>
        </section>
      ) : null}

      {/* Paso 4 — Agendado */}
      {step === 4 && service && customer ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            <CheckIcon className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">¡Turno agendado!</h2>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">
              {customer.name} · {service.name}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <Button variant="outline" size="lg" fullWidth onClick={() => router.push("/agenda")}>
              Volver a la Agenda
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setService(null);
                setCustomer(null);
                setSearch("");
                setAddingCustomer(false);
                setNewCustomerName("");
                setDate(todayIsoDate());
                setTime("");
                setEmployeeId(user?.id ?? "");
                setError(null);
              }}
              className="text-sm font-medium text-primary"
            >
              Agendar otro turno
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
