import type { Metadata } from "next";
import type { ReactNode } from "react";
import { COLOR_SCHEME_STORAGE_KEY } from "@/lib/color-scheme";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barber SaaS",
  description: "Gestión simple de ventas, caja y clientes para barberías.",
};

// Bloqueante (no "use client"/useEffect) a propósito: corre antes de que
// React hidrate, para que el modo oscuro ya esté aplicado en el primer
// pintado y no haya un flash de claro→oscuro (use-color-scheme.ts hace el
// resto una vez montada la app).
const NO_FLASH_SCRIPT = `(function(){try{var s=localStorage.getItem("${COLOR_SCHEME_STORAGE_KEY}");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
