// Convierte un hex (#RRGGBB) al formato "R G B" que usan las variables CSS
// de globals.css (rgb(var(--color-x) / <alpha-value>) en tailwind.config.ts).
export function hexToRgbTriplet(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function mix(hex: string, target: number, amount: number): string {
  const channels = [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  return channels.map((c) => Math.round(c + (target - c) * amount)).join(" ");
}

// Variante oscura de un color de marca (mezclando hacia negro), para poder
// derivar automáticamente lo que antes eran tonos elegidos a mano por
// negocio (docs/UI_UX.md §Colores) a partir del único color que el dueño
// elige en Configuración.
export function darken(hex: string, amount: number): string {
  return mix(hex, 0, amount);
}

// Variante clara (mezclando hacia blanco) — se usa para fondos suaves tipo
// badge/banner (bg-secondary-light).
export function lighten(hex: string, amount: number): string {
  return mix(hex, 255, amount);
}
