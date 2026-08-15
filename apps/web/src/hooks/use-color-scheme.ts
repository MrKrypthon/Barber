"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COLOR_SCHEME_STORAGE_KEY,
  resolveIsDark,
  type ColorSchemePreference,
} from "@/lib/color-scheme";

function readStoredPreference(): ColorSchemePreference {
  const stored = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function applyIsDark(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

// Preferencia de apariencia por dispositivo (no por negocio, a diferencia de
// los colores de marca de ThemeVars): "sistema" sigue prefers-color-scheme
// del SO, o se puede fijar explícitamente. El valor inicial de la clase
// "dark" ya lo aplica un script bloqueante en layout.tsx antes de que React
// hidrate (para no parpadear); este hook solo mantiene la UI del selector
// sincronizada y reacciona a cambios posteriores (toggle manual, o cambio
// del tema del SO mientras la preferencia es "sistema").
export function useColorScheme() {
  const [preference, setPreferenceState] = useState<ColorSchemePreference>("system");

  useEffect(() => {
    setPreferenceState(readStoredPreference());
  }, []);

  useEffect(() => {
    applyIsDark(resolveIsDark(preference));

    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyIsDark(resolveIsDark("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ColorSchemePreference) => {
    setPreferenceState(next);
    if (next === "system") {
      window.localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next);
    }
  }, []);

  return { preference, setPreference };
}
