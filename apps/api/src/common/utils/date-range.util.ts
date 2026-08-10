export type DateRange = "today" | "week" | "month";

export type DateRangeBounds = {
  start: Date;
  end: Date;
};

// Filtros "Hoy / Semana / Mes" de docs/PROJECT.md (Historial) y la caja
// actual. Semana = lunes a domingo. Cálculo simple con Date nativo: el
// alcance del MVP no requiere soporte de zona horaria por tenant.
export function getDateRangeBounds(
  range: DateRange | undefined,
  now: Date = new Date(),
): DateRangeBounds | null {
  if (!range) {
    return null;
  }

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);

  if (range === "today") {
    end.setDate(end.getDate() + 1);
  } else if (range === "week") {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 7);
  } else {
    start.setDate(1);
    end.setTime(start.getTime());
    end.setMonth(end.getMonth() + 1);
  }

  return { start, end };
}
