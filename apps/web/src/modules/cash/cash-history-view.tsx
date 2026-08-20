"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useCashClosings } from "@/hooks/use-cash";
import { useSettings } from "@/hooks/use-settings";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } from "@/lib/brand-defaults";
import { downloadCashClosingPdf } from "@/lib/cash-closing-pdf";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { CashReportModal } from "./cash-report-modal";

export function CashHistoryView() {
  const { settings } = useSettings();
  const { closings, isLoading, isError } = useCashClosings();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  // El listado ya trae los totales, pero no los movimientos del día (eso se
  // pide recién al descargar, para no cargar el detalle de cortes que el
  // dueño capaz nunca exporta).
  async function handleDownload(closingId: string, date: string) {
    setError(null);
    setDownloadingId(closingId);
    try {
      const detail = await apiClient.cash.getClosing(date.slice(0, 10));
      await downloadCashClosingPdf({
        businessName: settings?.businessName ?? "",
        primaryColor: settings?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
        secondaryColor: settings?.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
        closedByName: detail.closedBy.name,
        date: detail.date.slice(0, 10),
        closedAt: detail.closedAt,
        income: detail.income,
        expense: detail.expense,
        balance: detail.balance,
        movements: detail.movements,
      });
    } catch {
      setError("No se pudo generar el PDF de ese día.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Cortes anteriores"
        backHref="/caja"
        action={
          <Button variant="outline" onClick={() => setReportOpen(true)}>
            Generar reporte
          </Button>
        }
      />

      {error ? <p className="mb-4 text-sm text-secondary">{error}</p> : null}

      {isLoading ? (
        <Card>
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">Cargando cortes...</p>
        </Card>
      ) : isError ? (
        <Card>
          <p className="py-6 text-center text-secondary">No se pudo cargar el historial.</p>
        </Card>
      ) : closings.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-neutral-400 dark:text-neutral-500">
            Todavía no cerraste ninguna caja.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
          {closings.map((c) => (
            <div
              key={c.id}
              className="flex flex-col items-start gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium capitalize">{formatLongDate(new Date(c.date))}</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  Ingresos {formatCurrency(c.income)} · Gastos {formatCurrency(c.expense)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold">{formatCurrency(c.balance)}</span>
                <Button
                  variant="outline"
                  onClick={() => handleDownload(c.id, c.date)}
                  disabled={downloadingId === c.id}
                >
                  {downloadingId === c.id ? "Generando..." : "Descargar PDF"}
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {reportOpen ? <CashReportModal onClose={() => setReportOpen(false)} /> : null}
    </div>
  );
}
