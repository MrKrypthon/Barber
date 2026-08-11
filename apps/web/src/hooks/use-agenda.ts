"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Appointment as ApiAppointment } from "@barber/types";
import { apiClient } from "@/lib/api-client";
import type { Appointment } from "@/mocks/types";

export type WeekDay = {
  index: number; // 0 = lunes ... 6 = domingo
  dayLabel: string;
  dayNumber: number;
  date: Date;
  isToday: boolean;
};

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
// Color de respaldo para turnos cuyo servicio no tiene color configurado
// (servicios creados antes de la fase de agenda, docs/DATABASE.md).
const DEFAULT_APPOINTMENT_COLOR = "#24406B";

function buildWeek(ref: Date): WeekDay[] {
  const monday = new Date(ref);
  monday.setHours(0, 0, 0, 0);
  // getDay(): 0 = domingo ... 6 = sábado → retroceder hasta el lunes.
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    return {
      index: i,
      dayLabel: DAY_LABELS[i],
      dayNumber: date.getDate(),
      date,
      isToday: date.toDateString() === ref.toDateString(),
    };
  });
}

function weekDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function toViewAppointment(appointment: ApiAppointment): Appointment {
  const start = new Date(appointment.startAt);
  return {
    id: appointment.id,
    customerName: appointment.customer.name,
    serviceName: appointment.service.name,
    startTime: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
    durationMinutes: appointment.durationMinutes,
    color: appointment.service.color ?? DEFAULT_APPOINTMENT_COLOR,
  };
}

function groupByWeekDay(appointments: ApiAppointment[]): Record<number, Appointment[]> {
  const grouped: Record<number, Appointment[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const appointment of appointments) {
    const index = weekDayIndex(new Date(appointment.startAt));
    grouped[index].push(toViewAppointment(appointment));
  }
  for (const list of Object.values(grouped)) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return grouped;
}

export function useAgenda() {
  const [week] = useState(() => buildWeek(new Date()));
  const [selectedIndex, setSelectedIndex] = useState(
    () => week.find((d) => d.isToday)?.index ?? 0,
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["appointments", "week"],
    queryFn: () => apiClient.appointments.list({ range: "week" }),
  });

  const appointmentsByDay = groupByWeekDay(data ?? []);
  const selectedDay = week[selectedIndex];
  const appointments = appointmentsByDay[selectedIndex] ?? [];

  function appointmentsFor(index: number): Appointment[] {
    return appointmentsByDay[index] ?? [];
  }

  return {
    week,
    selectedDay,
    selectedIndex,
    setSelectedIndex,
    appointments,
    appointmentsFor,
    isLoading,
    isError,
  };
}
