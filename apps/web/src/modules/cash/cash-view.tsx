"use client";

import { useState } from "react";
import { ApiError } from "@barber/api-client";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useCash } from "@/hooks/use-cash";
import { formatCurrency, formatLongDate, formatTime } from "@/lib/format";

export function CashView() {
  const { summary, isLoading, isError, isClosed, closeCash, isClosing, addExpense, isAddingExpense } =
    useCash();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  async function saveExpense() {
    const amount = Number(expenseAmount);
    if (!expenseDescription.trim() || !Number.isFinite(amount) || amount <= 0) return;
    await addExpense({ description: expenseDescription.trim(), amount });
    setExpenseOpen(false);
    setExpenseDescription("");
    setExpenseAmount("");
  }

  async function handleClose() {
    setCloseError(null);
    try {
      await closeCash();
      setConfirmOpen(false);
    } catch (err) {
      setCloseError(err instanceof ApiError ? err.message : "No se pudo cerrar la caja.");
    }
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
          <p className="text-center font-semibold text-success">
            Caja cerrada{summary?.closedAt ? ` a las ${formatTime(summary.closedAt)}` : ""} — corte del
            día listo.
          </p>
        </Card>
      ) : null}

      {isLoading ? (
        <Card className="mb-4">
          <p className="py-6 text-center text-neutral-400">Cargando caja...</p>
        </Card>
      ) : isError || !summary ? (
        <Card className="mb-4">
          <p className="py-6 text-center text-secondary">No se pudo cargar la caja.</p>
        </Card>
      ) : (
        <>
          {/* Móvil: balance con desglose (mockup). Desktop: 3 stat cards. */}
          <Card className="mb-4 md:hidden">
            <span className="text-sm text-neutral-500">Balance del día</span>
            <p className="mt-1 text-3xl font-bold">{formatCurrency(summary.balance)}</p>
            <dl className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-neutral-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Ingresos
                </dt>
                <dd className="font-semibold">{formatCurrency(summary.income)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-neutral-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Gastos
                </dt>
                <dd className="font-semibold">{formatCurrency(summary.expense)}</dd>
              </div>
            </dl>
          </Card>
          <div className="mb-4 hidden gap-4 md:grid md:grid-cols-3">
            <StatCard label="Ingresos" value={formatCurrency(summary.income)} />
            <StatCard label="Gastos" value={formatCurrency(summary.expense)} />
            <StatCard label="Balance" value={formatCurrency(summary.balance)} />
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
            {summary.movements.length === 0 ? (
              <p className="py-6 text-center text-neutral-400">Sin movimientos manuales hoy.</p>
            ) : (
              summary.movements.map((m) => (
                <div key={m.id} className="flex items-center gap-4 px-4 py-3.5">
                  <span className="w-12 text-sm font-semibold text-secondary">
                    {formatTime(m.createdAt)}
                  </span>
                  <p className="flex-1 font-medium">{m.description}</p>
                  <span className={m.type === "expense" ? "font-bold text-secondary" : "font-bold"}>
                    {m.type === "expense" ? "−" : "+"}
                    {formatCurrency(m.amount)}
                  </span>
                </div>
              ))
            )}
          </Card>
        </>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setCloseError(null);
        }}
        title="Cerrar caja"
      >
        {summary ? (
          <p className="mb-4 text-neutral-600">
            Balance del día: <strong>{formatCurrency(summary.balance)}</strong> (Ingresos{" "}
            {formatCurrency(summary.income)} · Gastos {formatCurrency(summary.expense)}). Esta acción
            queda registrada y no se puede deshacer.
          </p>
        ) : null}
        {closeError ? <p className="mb-4 text-sm text-secondary">{closeError}</p> : null}
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              setConfirmOpen(false);
              setCloseError(null);
            }}
          >
            Cancelar
          </Button>
          <Button variant="dark" fullWidth onClick={handleClose} disabled={isClosing}>
            {isClosing ? "Cerrando..." : "Confirmar cierre"}
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
          <Button
            fullWidth
            onClick={saveExpense}
            disabled={!expenseDescription.trim() || !expenseAmount || isAddingExpense}
          >
            {isAddingExpense ? "Guardando..." : "Guardar gasto"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
