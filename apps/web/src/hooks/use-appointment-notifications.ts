"use client";

import { useEffect, useRef, useState } from "react";
import { mockWeekAppointments } from "@/mocks/appointments";

// Aviso "turno próximo" cuando faltan <= 15 min para el inicio del turno.
const NOTIFY_WINDOW_MINUTES = 15;

export type AppointmentNotification = {
  id: string;
  customerName: string;
  serviceName: string;
  startTime: string;
  minutesUntil: number;
};

function todayIndex(): number {
  // 0 = lunes ... 6 = domingo (mismo criterio que use-agenda.ts).
  return (new Date().getDay() + 6) % 7;
}

function minutesUntilStart(startTime: string, now: Date): number {
  const [hours, minutes] = startTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60_000);
}

// Solo agenda mock por ahora (v0.2, sin backend todavía — ver docs/ROADMAP.md).
// Revisa cada minuto los turnos de hoy y avisa una sola vez por turno cuando
// entra en la ventana de 15 min.
export function useAppointmentNotifications() {
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const notifiedIds = useRef(new Set<string>());

  useEffect(() => {
    function check() {
      const now = new Date();
      const todaysAppointments = mockWeekAppointments[todayIndex()] ?? [];

      for (const appointment of todaysAppointments) {
        if (notifiedIds.current.has(appointment.id)) continue;

        const minutesUntil = minutesUntilStart(appointment.startTime, now);
        if (minutesUntil > 0 && minutesUntil <= NOTIFY_WINDOW_MINUTES) {
          notifiedIds.current.add(appointment.id);
          setNotifications((prev) => [
            ...prev,
            {
              id: appointment.id,
              customerName: appointment.customerName,
              serviceName: appointment.serviceName,
              startTime: appointment.startTime,
              minutesUntil,
            },
          ]);
        }
      }
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return { notifications, dismiss };
}
