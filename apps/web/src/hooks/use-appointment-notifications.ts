"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// Aviso "turno próximo" cuando faltan <= 15 min para el inicio del turno.
const NOTIFY_WINDOW_MINUTES = 15;

export type AppointmentNotification = {
  id: string;
  customerName: string;
  serviceName: string;
  startTime: string;
  minutesUntil: number;
};

function minutesUntilStart(startAt: string, now: Date): number {
  return Math.round((new Date(startAt).getTime() - now.getTime()) / 60_000);
}

function toStartTime(startAt: string): string {
  const start = new Date(startAt);
  return `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
}

// Revisa cada minuto los turnos de hoy y avisa una sola vez por turno cuando
// entra en la ventana de 15 min.
export function useAppointmentNotifications() {
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const notifiedIds = useRef(new Set<string>());

  const { data: todaysAppointments } = useQuery({
    queryKey: ["appointments", "today"],
    queryFn: () => apiClient.appointments.list({ range: "today" }),
  });

  useEffect(() => {
    function check() {
      const now = new Date();

      for (const appointment of todaysAppointments ?? []) {
        if (notifiedIds.current.has(appointment.id)) continue;

        const minutesUntil = minutesUntilStart(appointment.startAt, now);
        if (minutesUntil > 0 && minutesUntil <= NOTIFY_WINDOW_MINUTES) {
          notifiedIds.current.add(appointment.id);
          setNotifications((prev) => [
            ...prev,
            {
              id: appointment.id,
              customerName: appointment.customer.name,
              serviceName: appointment.service.name,
              startTime: toStartTime(appointment.startAt),
              minutesUntil,
            },
          ]);
        }
      }
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [todaysAppointments]);

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return { notifications, dismiss };
}
