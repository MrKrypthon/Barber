// Formato de moneda estilo mockup: $46.500 (separador de miles con punto).
export function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-AR")}`;
}

// Etiqueta de un movimiento de Caja para la lista y el PDF: una venta
// muestra qué servicio(s) y a quién ("Corte, Barba — Juan Pérez"); un
// movimiento manual muestra su descripción (o "Ingreso"/"Gasto" si no
// tiene). Un solo lugar para este criterio — lo usan cash-view.tsx y
// pdf-draw.ts, y no deben divergir.
export function movementLabel(movement: {
  type: "income" | "expense";
  description: string | null;
  source: "manual" | "sale";
  customerName: string | null;
  serviceNames: string[];
}): string {
  if (movement.source === "sale") {
    const services = movement.serviceNames.join(", ") || "Venta";
    return movement.customerName ? `${services} — ${movement.customerName}` : services;
  }
  return movement.description ?? (movement.type === "income" ? "Ingreso" : "Gasto");
}

// Formato compacto para gráficos: $98k (panel del administrador).
export function formatCompactCurrency(amount: number): string {
  return `$${Math.round(amount / 1000)}k`;
}

// "10:02" a partir de un ISO string.
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// "jueves 7 de agosto" (sin coma, como en los mockups).
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(date)
    .replace(",", "");
}

// Saludo estilo mockup: "Hola, buen jueves".
export function greeting(date: Date): string {
  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date);
  return `Hola, buen ${weekday}`;
}

// "Hoy" | "Ayer" | "Hace 2 días" | "Hace 1 semana" — para la lista de clientes.
export function formatRelativeVisit(iso: string | null): string {
  if (!iso) return "Sin visitas";
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diffDays <= 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? "Hace 1 semana" : `Hace ${weeks} semanas`;
}

// "2026-08-20" a partir de un Date local — nunca vía toISOString (eso
// convierte a UTC y puede correr el día calendario en husos horarios
// detrás de UTC). Es el formato que espera la API para rangos de fecha
// (parseDateParam en apps/api/src/cash/cash.service.ts).
export function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Inversa de toDateParam. NUNCA usar new Date("YYYY-MM-DD") para mostrar
// una fecha: ese formato se interpreta como medianoche UTC, así que en
// cualquier huso horario detrás de UTC (todo el continente americano) el
// día calendario mostrado queda corrido uno para atrás (mismo bug que
// parseDateParam evita en apps/api/src/cash/cash.service.ts).
export function fromDateParam(dateParam: string): Date {
  const [year, month, day] = dateParam.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Combina una fecha (día) con un horario "HH:MM" en un único Date local.
export function withTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

export function isSameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function isWithinLastDays(iso: string, days: number, ref: Date): boolean {
  return ref.getTime() - new Date(iso).getTime() <= days * 86_400_000;
}

// Días de la semana para el horario de atención (business_settings.schedule_days).
export const SCHEDULE_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const SCHEDULE_DAY_LABELS: Record<(typeof SCHEDULE_DAYS)[number], string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
};

// "Lun-Sáb 9:00-19:00h" — junta días consecutivos en un rango en vez de
// listarlos todos, igual al criterio del mockup original (docs/Propuesta.pdf).
export function formatSchedule(days: string[], open: string | null, close: string | null): string | null {
  if (days.length === 0 || !open || !close) return null;

  const sorted = SCHEDULE_DAYS.filter((d) => days.includes(d));
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    const isConsecutive =
      current !== undefined && SCHEDULE_DAYS.indexOf(current) === SCHEDULE_DAYS.indexOf(prev) + 1;
    if (!isConsecutive) {
      ranges.push(
        start === prev
          ? SCHEDULE_DAY_LABELS[start]
          : `${SCHEDULE_DAY_LABELS[start]}-${SCHEDULE_DAY_LABELS[prev]}`,
      );
      if (current !== undefined) start = current;
    }
    if (current !== undefined) prev = current;
  }

  return `${ranges.join(", ")} ${open}-${close}h`;
}
