"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Appointment as ApiAppointment, CreateAppointmentInput } from "@barber/types";
import { apiClient } from "@/lib/api-client";
import { toDateParam } from "@/lib/format";
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

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

// weekOf ancla qué semana (lunes a domingo) se construye; today se compara
// aparte para no confundir "el día que se está mirando" con "hoy" cuando se
// navega a otra semana.
function buildWeek(weekOf: Date, today: Date): WeekDay[] {
  const monday = startOfDay(weekOf);
  // getDay(): 0 = domingo ... 6 = sábado → retroceder hasta el lunes.
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return {
      index: i,
      dayLabel: DAY_LABELS[i],
      dayNumber: date.getDate(),
      date,
      isToday: date.toDateString() === today.toDateString(),
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
    serviceId: appointment.service.id,
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
  const queryClient = useQueryClient();
  const [referenceDate, setReferenceDate] = useState(() => startOfDay(new Date()));

  const week = buildWeek(referenceDate, new Date());
  const selectedIndex = weekDayIndex(referenceDate);
  const selectedDay = week[selectedIndex];
  const isCurrentWeek = week.some((d) => d.isToday);
  // Ancla de semana (lunes) como parte de la query key: cambiar de día
  // dentro de la misma semana no refetchea, solo cruzar de semana.
  // toDateParam, no toISOString: la API espera YYYY-MM-DD (parseDateParam),
  // nunca un ISO datetime — ver apps/web/src/lib/format.ts.
  const weekStartParam = toDateParam(week[0].date);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["appointments", "week", weekStartParam],
    queryFn: () => apiClient.appointments.list({ range: "week", date: weekStartParam }),
  });

  const changeServiceMutation = useMutation({
    mutationFn: ({ id, serviceId }: { id: string; serviceId: string }) =>
      apiClient.appointments.update(id, { serviceId }),
    // Invalida todas las queries de turnos (semana actual, otras semanas
    // cacheadas y "today" de los avisos de turno próximo) a la vez.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, startAt }: { id: string; startAt: string }) =>
      apiClient.appointments.update(id, { startAt }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const appointmentsByDay = groupByWeekDay(data ?? []);
  const appointments = appointmentsByDay[selectedIndex] ?? [];

  function appointmentsFor(index: number): Appointment[] {
    return appointmentsByDay[index] ?? [];
  }

  function selectDay(index: number) {
    setReferenceDate(week[index].date);
  }

  return {
    week,
    selectedDay,
    selectedIndex,
    selectDay,
    appointments,
    appointmentsFor,
    isLoading,
    isError,
    isCurrentWeek,
    goToPreviousDay: () => setReferenceDate((d) => addDays(d, -1)),
    goToNextDay: () => setReferenceDate((d) => addDays(d, 1)),
    goToPreviousWeek: () => setReferenceDate((d) => addDays(d, -7)),
    goToNextWeek: () => setReferenceDate((d) => addDays(d, 7)),
    goToToday: () => setReferenceDate(startOfDay(new Date())),
    changeService: changeServiceMutation.mutateAsync,
    isChangingService: changeServiceMutation.isPending,
    reschedule: rescheduleMutation.mutateAsync,
  };
}

// Hook liviano para el flujo de "Nuevo turno" (apps/web/src/app/(app)/agenda/nuevo),
// que no necesita el estado de navegación semanal de useAgenda.
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: CreateAppointmentInput) => apiClient.appointments.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  return {
    createAppointment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
