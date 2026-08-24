"use client";

import { useState } from "react";
import type { PaymentMethod } from "@barber/types";
import { ApiError } from "@barber/api-client";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { PageHeader } from "@/components/page-header";
import { useSuperAdminTenantDetail } from "@/hooks/use-superadmin-tenants";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { SubscriptionStatusBadge } from "./subscription-status-badge";

export function TenantDetailView({ tenantId }: { tenantId: string }) {
  const {
    tenant,
    isLoading,
    isError,
    suspend,
    isSuspending,
    activate,
    isActivating,
    recordPayment,
    isRecordingPayment,
  } = useSuperAdminTenantDetail(tenantId);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidUntil, setPaidUntil] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading || !tenant) {
    return (
      <div>
        <PageHeader title="Negocio" backHref="/superadmin" />
        <p className="py-10 text-center text-neutral-400 dark:text-neutral-500">
          {isLoading ? "Cargando..." : isError ? "No se pudo cargar el negocio." : "Negocio no encontrado."}
        </p>
      </div>
    );
  }

  const amountNumber = Number(amount);
  const isPaymentValid = Number.isFinite(amountNumber) && amountNumber > 0 && paidUntil.length === 10;
  const isActive = tenant.subscriptionStatus === "active";

  async function handleToggle() {
    setActionError(null);
    try {
      if (isActive) {
        await suspend();
      } else {
        await activate();
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar el estado.");
    }
  }

  async function handleRecordPayment() {
    if (!isPaymentValid) return;
    setFormError(null);
    try {
      await recordPayment({ amount: amountNumber, method, paidUntil, note: note.trim() || undefined });
      setAmount("");
      setPaidUntil("");
      setNote("");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo registrar el pago.");
    }
  }

  return (
    <div>
      <PageHeader title={tenant.name} backHref="/superadmin" />

      <Card className="mb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 dark:text-neutral-400">Estado</span>
          <SubscriptionStatusBadge status={tenant.subscriptionStatus} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 dark:text-neutral-400">Dueño</span>
          <span className="font-medium">{tenant.ownerName ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 dark:text-neutral-400">Contacto</span>
          <span className="font-medium">{tenant.ownerEmail ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 dark:text-neutral-400">Alta</span>
          <span className="font-medium">{formatLongDate(new Date(tenant.createdAt))}</span>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800">
          <span className="text-neutral-500 dark:text-neutral-400">Pago cubre hasta</span>
          <span className="font-medium">
            {tenant.subscriptionPaidUntil ? formatLongDate(new Date(tenant.subscriptionPaidUntil)) : "—"}
          </span>
        </div>

        {actionError ? <p className="text-sm text-secondary">{actionError}</p> : null}
        <Button
          variant={isActive ? "danger-outline" : "success"}
          fullWidth
          onClick={handleToggle}
          disabled={isSuspending || isActivating}
        >
          {isActive
            ? isSuspending
              ? "Suspendiendo..."
              : "Suspender negocio"
            : isActivating
              ? "Activando..."
              : "Reactivar negocio"}
        </Button>
      </Card>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        Registrar pago
      </h2>
      <Card className="mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Monto
            </span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              inputMode="numeric"
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Cubre hasta
            </span>
            <input
              type="date"
              value={paidUntil}
              onChange={(e) => setPaidUntil(e.target.value)}
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <Chip selected={method === "cash"} onClick={() => setMethod("cash")} className="flex-1">
            Efectivo
          </Chip>
          <Chip selected={method === "transfer"} onClick={() => setMethod("transfer")} className="flex-1">
            Transferencia
          </Chip>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
          className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />

        {formError ? <p className="text-sm text-secondary">{formError}</p> : null}
        <Button fullWidth onClick={handleRecordPayment} disabled={!isPaymentValid || isRecordingPayment}>
          {isRecordingPayment ? "Guardando..." : "Registrar pago y reactivar"}
        </Button>
      </Card>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        Historial de pagos
      </h2>
      <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
        {tenant.payments.length === 0 ? (
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">Sin pagos registrados.</p>
        ) : (
          tenant.payments.map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1">
                <p className="font-medium">
                  {p.method === "cash" ? "Efectivo" : "Transferencia"}
                  {p.note ? ` — ${p.note}` : ""}
                </p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  Cubre hasta {formatLongDate(new Date(p.paidUntil))} · registrado el{" "}
                  {formatLongDate(new Date(p.createdAt))}
                </p>
              </div>
              <span className="font-bold">{formatCurrency(p.amount)}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
