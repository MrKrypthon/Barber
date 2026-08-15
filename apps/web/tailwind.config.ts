import type { Config } from "tailwindcss";

// Los colores de marca se definen como variables CSS en globals.css para que
// cada negocio pueda personalizarlos (ver docs/UI_UX.md §Colores y
// business_settings en docs/DATABASE.md). Tailwind los expone como clases
// (bg-primary, text-secondary, ...) con soporte de opacidad via <alpha-value>.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          light: "rgb(var(--color-secondary-light) / <alpha-value>)",
        },
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
      },
      // Sombras con tinte del primario (en vez de gris genérico) para que
      // las tarjetas se sientan "físicas" sobre el fondo crema — más cálido
      // y propio que un shadow-sm neutro (pedido de diseño, ago 2026).
      boxShadow: {
        card: "0 1px 2px rgb(var(--color-primary) / 0.06), 0 6px 16px -4px rgb(var(--color-primary) / 0.14)",
        "card-hover": "0 2px 4px rgb(var(--color-primary) / 0.08), 0 14px 28px -6px rgb(var(--color-primary) / 0.20)",
        button: "0 4px 10px -2px rgb(var(--color-primary) / 0.35)",
        "button-secondary": "0 4px 10px -2px rgb(var(--color-secondary) / 0.35)",
        nav: "0 -4px 16px -4px rgb(var(--color-primary) / 0.10)",
        sidebar: "4px 0 16px -4px rgb(var(--color-primary) / 0.15)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "sheet-in": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Feedback de "modo arrastre" al mantener presionado un turno de la
        // agenda (docs/Propuesta.pdf agenda) — mismo lenguaje que el
        // "jiggle" de reordenar íconos, para indicar que ya se puede soltar
        // y mover.
        wiggle: {
          "0%, 100%": { transform: "scale(1.04) rotate(-1.5deg)" },
          "50%": { transform: "scale(1.04) rotate(1.5deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "sheet-in": "sheet-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        wiggle: "wiggle 0.15s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
