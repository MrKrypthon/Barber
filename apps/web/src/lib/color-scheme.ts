export type ColorSchemePreference = "light" | "dark" | "system";

// Compartida entre el script bloqueante de app/layout.tsx (que evita el
// parpadeo aplicando la clase "dark" antes de que React hidrate) y
// use-color-scheme.ts, para que ambos lean/escriban la misma clave.
export const COLOR_SCHEME_STORAGE_KEY = "color-scheme";

export function resolveIsDark(preference: ColorSchemePreference): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
