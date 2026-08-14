"use client";

import { useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { darken, hexToRgbTriplet, lighten } from "@/lib/color";

// Mismos valores por defecto que globals.css (mockup original, docs/Propuesta.pdf),
// para cuando el negocio todavía no eligió sus propios colores.
const DEFAULT_PRIMARY = "#24406B";
const DEFAULT_SECONDARY = "#C0392B";
const DEFAULT_BACKGROUND = "#F5F1E8";

// Aplica los colores del negocio (Configuración → Colores) como variables
// CSS en tiempo de ejecución. tailwind.config.ts ya expone bg-primary,
// bg-secondary, bg-cream, etc. a partir de estas variables (ver
// globals.css) — este componente es la pieza que faltaba para que elegir un
// color en Configuración se vea reflejado en el resto de la app (sidebar,
// botones, fondo). No renderiza nada, es puro efecto de lado.
export function ThemeVars() {
  const { settings } = useSettings();

  useEffect(() => {
    const primary = settings?.primaryColor ?? DEFAULT_PRIMARY;
    const secondary = settings?.secondaryColor ?? DEFAULT_SECONDARY;
    const background = settings?.backgroundColor ?? DEFAULT_BACKGROUND;

    const root = document.documentElement.style;
    root.setProperty("--color-primary", hexToRgbTriplet(primary));
    root.setProperty("--color-primary-dark", darken(primary, 0.22));
    root.setProperty("--color-secondary", hexToRgbTriplet(secondary));
    root.setProperty("--color-secondary-light", lighten(secondary, 0.87));
    root.setProperty("--color-cream", hexToRgbTriplet(background));

    // Al desmontar (logout, que navega fuera del layout autenticado sin
    // recargar la página) se sacan los overrides para no dejar los colores
    // de este negocio "pegados" en /login — vuelve a los defaults de
    // globals.css.
    return () => {
      root.removeProperty("--color-primary");
      root.removeProperty("--color-primary-dark");
      root.removeProperty("--color-secondary");
      root.removeProperty("--color-secondary-light");
      root.removeProperty("--color-cream");
    };
  }, [settings?.primaryColor, settings?.secondaryColor, settings?.backgroundColor]);

  return null;
}
