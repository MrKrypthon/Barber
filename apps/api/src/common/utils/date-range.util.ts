import { BadRequestException } from "@nestjs/common";

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

// "YYYY-MM-DD" → Date anclada a medianoche local de ese día calendario.
// new Date("YYYY-MM-DD") NO sirve acá: ese formato lo interpreta como
// medianoche UTC (a diferencia de un ISO con hora), así que en cualquier
// servidor con huso horario detrás de UTC (todo el continente americano)
// el día calendario local queda corrido uno para atrás. Compartido por
// cash, sales y appointments — todos filtran por un rango de fecha que
// llega como string desde el cliente.
export function parseDateParam(dateParam: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
  if (!match) {
    throw new BadRequestException("Fecha inválida, se espera YYYY-MM-DD");
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}
