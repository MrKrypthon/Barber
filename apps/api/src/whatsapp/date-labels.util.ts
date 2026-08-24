// Mismo criterio de formato que apps/web/src/lib/format.ts (formatLongDate/
// formatTime), pero server-side — no se puede compartir código entre
// backend y frontend acá (deploys separados), así que se duplica esta
// función chica en vez de las convenciones completas de la app web.
export function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(
    date,
  );
}

export function formatTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    date,
  );
}
