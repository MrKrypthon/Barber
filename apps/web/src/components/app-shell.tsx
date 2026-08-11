import type { ReactNode } from "react";
import { AppointmentNotifications } from "./appointment-notifications";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

// Layout compartido de las vistas internas: bottom nav en móvil,
// sidebar en tablet/desktop (ver mockups en docs/Propuesta.pdf).
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppointmentNotifications />
      <Sidebar />
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
