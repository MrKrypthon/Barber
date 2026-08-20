"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Modal } from "@/components/modal";
import { useSettings } from "@/hooks/use-settings";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } from "@/lib/brand-defaults";
import { downloadCashReportPdf } from "@/lib/cash-report-pdf";
import { toDateParam } from "@/lib/format";

type Preset = "week" | "biweek" | "month";

// Semana = lunes a domingo (mismo criterio que getDateRangeBounds en el
// backend). Quincena = 1-15 o 16-fin de mes, según en qué mitad cae hoy.
function computePreset(preset: Preset, today: Date): { from: Date; to: Date } {
  if (preset === "week") {
    const daysSinceMonday = (today.getDay() + 6) % 7;
    const from = new Date(today);
    from.setDate(from.getDate() - daysSinceMonday);
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    return { from, to };
  }
  if (preset === "biweek") {
    const isFirstHalf = today.getDate() <= 15;
    const from = new Date(today.getFullYear(), today.getMonth(), isFirstHalf ? 1 : 16);
    const to = isFirstHalf
      ? new Date(today.getFullYear(), today.getMonth(), 15)
      : new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from, to };
  }
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from, to };
}

export function CashReportModal({ onClose }: { onClose: () => void }) {
  const { settings } = useSettings();
  const [today] = useState(() => new Date());
  const [preset, setPreset] = useState<Preset | null>("week");
  const [from, setFrom] = useState(() => toDateParam(computePreset("week", today).from));
  const [to, setTo] = useState(() => toDateParam(computePreset("week", today).to));
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectPreset(p: Preset) {
    setPreset(p);
    const { from: f, to: t } = computePreset(p, today);
    setFrom(toDateParam(f));
    setTo(toDateParam(t));
  }

  const isValid = from.length === 10 && to.length === 10 && from <= to;

  async function handleDownload() {
    if (!isValid) return;
    setError(null);
    setIsDownloading(true);
    try {
      const report = await apiClient.cash.getReport(from, to);
      await downloadCashReportPdf({
        businessName: settings?.businessName ?? "",
        logo: settings?.logo,
        primaryColor: settings?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
        secondaryColor: settings?.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
        from: report.from.slice(0, 10),
        to: report.to.slice(0, 10),
        income: report.income,
        expense: report.expense,
        balance: report.balance,
        days: report.days.map((d) => ({ ...d, date: d.date.slice(0, 10) })),
      });
      onClose();
    } catch {
      setError("No se pudo generar el reporte.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Generar reporte">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Chip selected={preset === "week"} onClick={() => selectPreset("week")}>
            Semana
          </Chip>
          <Chip selected={preset === "biweek"} onClick={() => selectPreset("biweek")}>
            Quincena
          </Chip>
          <Chip selected={preset === "month"} onClick={() => selectPreset("month")}>
            Mes
          </Chip>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Desde
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPreset(null);
              }}
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Hasta
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPreset(null);
              }}
              className="h-12 rounded-xl border border-neutral-200 bg-white px-4 outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
        </div>

        {!isValid && from && to ? (
          <p className="text-sm text-secondary">&quot;Desde&quot; no puede ser posterior a &quot;Hasta&quot;.</p>
        ) : null}
        {error ? <p className="text-sm text-secondary">{error}</p> : null}

        <Button fullWidth onClick={handleDownload} disabled={!isValid || isDownloading}>
          {isDownloading ? "Generando..." : "Descargar PDF"}
        </Button>
      </div>
    </Modal>
  );
}
