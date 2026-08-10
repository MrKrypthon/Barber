"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon, WhatsAppIcon } from "@/components/icons";
import { StepIndicator } from "@/components/step-indicator";
import { useCustomers } from "@/hooks/use-customers";
import { useSales } from "@/hooks/use-sales";
import { useServices } from "@/hooks/use-services";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { buildReceiptMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { mockBusiness } from "@/mocks/business";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/mocks/types";
import type { Customer, Service } from "@barber/types";

const OCCASIONAL = "occasional" as const;

export function CobrarWizard() {
  const router = useRouter();
  const { services } = useServices();
  const { customers, addCustomer } = useCustomers();
  const { addSale } = useSales();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [service, setService] = useState<Service | null>(null);
  const [customer, setCustomer] = useState<Customer | typeof OCCASIONAL | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [search, setSearch] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");

  const customerName = customer === OCCASIONAL ? "Cliente ocasional" : customer?.name ?? "";
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else router.push("/");
  }

  function pickService(s: Service) {
    setService(s);
    setStep(2);
  }

  function pickCustomer(c: Customer | typeof OCCASIONAL) {
    setCustomer(c);
    setStep(3);
  }

  async function saveNewCustomer() {
    const name = newCustomerName.trim();
    if (!name) return;
    pickCustomer(await addCustomer({ name }));
  }

  function confirmSale() {
    if (!service || !customer) return;
    addSale({
      customerName: customer === OCCASIONAL ? null : customer.name,
      serviceNames: [service.name],
      paymentMethod,
      total: service.price,
    });
    setStep(4);
  }

  const receiptUrl =
    service && customer
      ? buildWhatsAppUrl(
          buildReceiptMessage({
            businessName: mockBusiness.name,
            customerName,
            serviceName: service.name,
            paymentMethodLabel: PAYMENT_METHOD_LABELS[paymentMethod],
            totalLabel: formatCurrency(service.price),
          }),
          customer === OCCASIONAL ? null : customer.phone,
        )
      : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="Volver"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 active:bg-neutral-200"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold">Cobrar</h1>
      </header>

      {step <= 3 ? <StepIndicator step={step} /> : null}

      {/* Paso 1 — Elegí el servicio */}
      {step === 1 ? (
        <section>
          <p className="mb-3 text-sm text-neutral-500">1. Elegí el servicio</p>
          <div className="grid grid-cols-2 gap-3">
            {services
              .filter((s) => s.active)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickService(s)}
                  className="rounded-2xl bg-white p-5 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <p className="font-semibold">{s.name}</p>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(s.price)}</p>
                </button>
              ))}
          </div>
        </section>
      ) : null}

      {/* Paso 2 — Elegí el cliente */}
      {step === 2 && service ? (
        <section className="flex flex-col gap-4">
          <div>
            <Chip selected className="pointer-events-none">
              {service.name} · {formatCurrency(service.price)}
            </Chip>
          </div>

          <label className="flex items-center gap-2 rounded-xl bg-white px-4 shadow-sm">
            <SearchIcon className="h-5 w-5 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="h-12 w-full bg-transparent outline-none placeholder:text-neutral-400"
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
                className="h-12 flex-1 rounded-xl border border-secondary bg-white px-4 outline-none"
              />
              <Button variant="secondary" onClick={saveNewCustomer} disabled={!newCustomerName.trim()}>
                Guardar
              </Button>
            </div>
          ) : (
            <Button variant="danger-outline" fullWidth onClick={() => setAddingCustomer(true)}>
              <PlusIcon className="h-5 w-5" /> Nuevo cliente
            </Button>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Recientes
            </p>
            <Card className="divide-y divide-neutral-100 p-0">
              <button
                type="button"
                onClick={() => pickCustomer(OCCASIONAL)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <Avatar name="CO" className="bg-neutral-400" />
                <span className="flex-1 font-medium">Cliente ocasional</span>
                <ChevronRightIcon className="h-5 w-5 text-neutral-300" />
              </button>
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCustomer(c)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <Avatar name={c.name} />
                  <span className="flex-1 font-medium">{c.name}</span>
                  <ChevronRightIcon className="h-5 w-5 text-neutral-300" />
                </button>
              ))}
            </Card>
          </div>
        </section>
      ) : null}

      {/* Paso 3 — Confirmar y cobrar */}
      {step === 3 && service && customer ? (
        <section className="flex flex-col gap-5">
          <Card>
            <dl className="flex flex-col gap-2">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Cliente</dt>
                <dd className="font-semibold">{customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Servicio</dt>
                <dd className="font-semibold">{service.name}</dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-neutral-100 pt-3">
                <dt className="text-neutral-500">Total</dt>
                <dd className="text-3xl font-bold">{formatCurrency(service.price)}</dd>
              </div>
            </dl>
          </Card>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Método de pago
            </p>
            <div className="flex gap-3">
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <Chip
                  key={method}
                  selected={paymentMethod === method}
                  onClick={() => setPaymentMethod(method)}
                  className="flex-1"
                >
                  {PAYMENT_METHOD_LABELS[method]}
                </Chip>
              ))}
            </div>
          </div>

          <Button size="lg" fullWidth onClick={confirmSale}>
            Cobrar {formatCurrency(service.price)}
          </Button>
        </section>
      ) : null}

      {/* Paso 4 — Cobrado */}
      {step === 4 && service ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            <CheckIcon className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">¡Cobrado!</h2>
            <p className="mt-1 text-neutral-500">
              {formatCurrency(service.price)} · {PAYMENT_METHOD_LABELS[paymentMethod]}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            {receiptUrl ? (
              <a href={receiptUrl} target="_blank" rel="noreferrer" className="w-full">
                <Button variant="success" size="lg" fullWidth>
                  <WhatsAppIcon className="h-5 w-5" /> Enviar recibo por WhatsApp
                </Button>
              </a>
            ) : null}
            <Button variant="outline" size="lg" fullWidth onClick={() => router.push("/")}>
              Volver al Dashboard
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setService(null);
                setCustomer(null);
                setPaymentMethod("cash");
                setSearch("");
                setAddingCustomer(false);
                setNewCustomerName("");
              }}
              className={cn("text-sm font-medium text-primary")}
            >
              Cobrar otra venta
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
