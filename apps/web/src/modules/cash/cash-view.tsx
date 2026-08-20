"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError } from "@barber/api-client";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/hooks/use-auth";
import { useCash } from "@/hooks/use-cash";
import { useSettings } from "@/hooks/use-settings";
import { DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } from "@/lib/brand-defaults";
import { downloadCashClosingPdf } from "@/lib/cash-closing-pdf";
import { formatCurrency, formatLongDate, formatTime } from "@/lib/format";

export function CashView() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { summary, isLoading, isError, isClosed, closeCash, isClosing, addExpense, isAddingExpense } =
    useCash();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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

  async function handleDownloadPdf() {
    if (!summary || !summary.closedAt) return;
    setIsDownloadingPdf(true);
    try {
      await downloadCashClosingPdf({
        businessName: settings?.businessName ?? "",
        primaryColor: settings?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
        secondaryColor: settings?.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
        closedByName: user?.name ?? "",
        date: summary.closedAt.slice(0, 10),
        closedAt: summary.closedAt,
        income: summary.income,
        expense: summary.expense,
        balance: summary.balance,
        movements: summary.movements,
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Caja"
        subtitle={formatLongDate(new Date())}
        action={
          <div className="flex items-center gap-3">
            <Link href="/caja/historial" className="text-sm font-medium text-primary">
              Cortes anteriores
            </Link>
            <Button variant="dark" onClick={() => setConfirmOpen(true)} disabled={isClosed}>
              Cerrar caja
            </Button>
          </div>
        }
      />

      {isClosed ? (
        <Card className="mb-4 flex flex-col items-center gap-3 bg-success/10 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-semibold text-success">
            Caja cerrada{summary?.closedAt ? ` a las ${formatTime(summary.closedAt)}` : ""} — corte del
            día listo.
          </p>
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
            {isDownloadingPdf ? "Generando PDF..." : "Descargar PDF"}
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card className="mb-4">
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">Cargando caja...</p>
        </Card>
      ) : isError || !summary ? (
        <Card className="mb-4">
          <p className="py-6 text-center text-secondary">No se pudo cargar la caja.</p>
        </Card>
      ) : (
        <>
          {/* Móvil: balance con desglose (mockup). Desktop: 3 stat cards. */}
          <Card className="mb-4 md:hidden">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Balance del día</span>
            <p className="mt-1 text-3xl font-bold">{formatCurrency(summary.balance)}</p>
            <dl className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Ingresos
                </dt>
                <dd className="font-semibold">{formatCurrency(summary.income)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
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
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
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

          <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
            {summary.movements.length === 0 ? (
              <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">
                Sin movimientos manuales hoy.
              </p>
            ) : (
              summary.movements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
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
          <p className="mb-4 text-neutral-600 dark:text-neutral-300">
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
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <input
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            placeholder="Monto"
            inputMode="numeric"
            className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
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
