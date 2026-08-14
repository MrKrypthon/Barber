"use client";

import { useState } from "react";
import { CustomersIcon } from "./icons";
import { WalkInModal } from "./walk-in-modal";

// Visible en todas las vistas internas (montado en AppShell): un cliente
// sin turno agendado puede llegar en cualquier pantalla, no solo en Agenda.
export function WalkInFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cliente sin turno"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-white shadow-card-hover transition duration-150 active:scale-95 md:bottom-8 md:right-8"
      >
        <CustomersIcon className="h-6 w-6" />
      </button>

      {open ? <WalkInModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
