// Formato de moneda estilo mockup: $46.500 (separador de miles con punto).
export function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-AR")}`;
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
