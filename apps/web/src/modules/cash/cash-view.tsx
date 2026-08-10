"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useCash } from "@/hooks/use-cash";
import { formatCurrency, formatLongDate, formatTime } from "@/lib/format";

export function CashView() {
  const { summary, movements, isClosed, closeCash, addExpense } = useCash();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  function saveExpense() {
    const amount = Number(expenseAmount);
    if (!expenseDescription.trim() || !Number.isFinite(amount) || amount <= 0) return;
    addExpense({ description: expenseDescription.trim(), amount });
    setExpenseOpen(false);
    setExpenseDescription("");
    setExpenseAmount("");
  }

  return (
    <div>
      <PageHeader
        title="Caja"
        subtitle={formatLongDate(new Date())}
        action={
          <Button variant="dark" onClick={() => setConfirmOpen(true)} disabled={isClosed}>
            Cerrar caja
          </Button>
        }
      />

      {isClosed ? (
        <Card className="mb-4 bg-success/10">
          <p className="text-center font-semibold text-success">Caja cerrada — corte del día listo.</p>
        </Card>
      ) : null}

      {/* Móvil: total con desglose (mockup). Desktop: 3 stat cards. */}
      <Card className="mb-4 md:hidden">
        <span className="text-sm text-neutral-500">Total del día</span>
        <p className="mt-1 text-3xl font-bold">{formatCurrency(summary.total)}</p>
        <dl className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3">
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-neutral-600">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Efectivo
            </dt>
            <dd className="font-semibold">{formatCurrency(summary.cashTotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-neutral-600">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Transferencia
            </dt>
            <dd className="font-semibold">{formatCurrency(summary.transferTotal)}</dd>
          </div>
        </dl>
      </Card>
      <div className="mb-4 hidden gap-4 md:grid md:grid-cols-3">
        <StatCard label="Efectivo" value={formatCurrency(summary.cashTotal)} />
        <StatCard label="Transferencia" value={formatCurrency(summary.transferTotal)} />
        <StatCard label="Total" value={formatCurrency(summary.total)} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Movimientos de hoy
        </h2>
        <button
          type="button"
          onClick={() => setExpenseOpen(true)}
          className="text-sm font-semibold text-secondary"
        >
          + Registrar gasto
        </button>
      </div>

      <Card className="divide-y divide-neutral-100 p-0">
        {movements.map((m) => (
          <div key={m.id} className="flex items-center gap-4 px-4 py-3.5">
            <span className="w-12 text-sm font-semibold text-secondary">{formatTime(m.createdAt)}</span>
            <div className="flex-1">
              <p className="font-medium">{m.description}</p>
              {m.type === "income" && m.paymentMethod ? (
                <p className="text-sm text-neutral-400">
                  {m.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
                </p>
              ) : null}
            </div>
            <span className={m.type === "expense" ? "font-bold text-secondary" : "font-bold"}>
              {m.type === "expense" ? "−" : ""}
              {formatCurrency(m.amount)}
            </span>
          </div>
        ))}
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Cerrar caja">
        <p className="mb-4 text-neutral-600">
          Total del día: <strong>{formatCurrency(summary.total)}</strong> (Efectivo{" "}
          {formatCurrency(summary.cashTotal)} · Transferencia {formatCurrency(summary.transferTotal)}
          ). Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="dark"
            fullWidth
            onClick={() => {
              closeCash();
              setConfirmOpen(false);
            }}
          >
            Confirmar cierre
          </Button>
        </div>
      </Modal>

      <Modal open={expenseOpen} onClose={() => setExpenseOpen(false)} title="Registrar gasto">
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={expenseDescription}
            onChange={(e) => setExpenseDescription(e.target.value)}
            placeholder="Descripción"
            className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
          />
          <input
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            placeholder="Monto"
            inputMode="numeric"
            className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
          />
          <Button fullWidth onClick={saveExpense} disabled={!expenseDescription.trim() || !expenseAmount}>
            Guardar gasto
          </Button>
        </div>
      </Modal>
    </div>
  );
}
