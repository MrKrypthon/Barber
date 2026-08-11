"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppointmentNotification } from "@/hooks/use-appointment-notifications";
import { useAppointmentNotifications } from "@/hooks/use-appointment-notifications";
import { cn } from "@/lib/cn";
import { ClockIcon, PlusIcon } from "./icons";

const AUTO_DISMISS_MS = 8000;

export function AppointmentNotifications() {
  const { notifications, dismiss } = useAppointmentNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3 md:inset-x-auto md:right-4 md:items-end">
      {notifications.map((notification) => (
        <AppointmentToast
          key={notification.id}
          notification={notification}
          onDismiss={() => dismiss(notification.id)}
        />
      ))}
    </div>
  );
}

function AppointmentToast({
  notification,
  onDismiss,
}: {
  notification: AppointmentNotification;
  onDismiss: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  // Se cierra sola a los 8s; si el usuario ya la cerró a mano, este timer
  // solo re-dispara la misma transición (sin efecto extra).
  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onDismiss, 200);
    return () => clearTimeout(timer);
  }, [leaving, onDismiss]);

  return (
    <Link
      href="/agenda"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-white p-4 shadow-card-hover transition-all duration-200 md:w-96",
        leaving ? "-translate-y-2 opacity-0" : "animate-sheet-in opacity-100",
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-light text-secondary">
        <ClockIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          Turno con {notification.customerName} en {notification.minutesUntil} min
        </p>
        <p className="truncate text-xs text-neutral-500">{notification.serviceName}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setLeaving(true);
        }}
        aria-label="Cerrar aviso"
        className="shrink-0 text-neutral-300 transition-colors hover:text-neutral-500"
      >
        <PlusIcon className="h-5 w-5 rotate-45" />
      </button>
    </Link>
  );
}
