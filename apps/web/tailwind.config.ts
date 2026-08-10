import type { Config } from "tailwindcss";

// Los colores de marca se definen como variables CSS en globals.css para que
// cada negocio pueda personalizarlos (ver docs/UI_UX.md §Colores y
// business_settings en docs/DATABASE.md). Tailwind los expone como clases
// (bg-primary, text-secondary, ...) con soporte de opacidad via <alpha-value>.
const config: Config = {
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
    },
  },
  plugins: [],
};

export default config;
