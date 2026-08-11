"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { useAgenda } from "@/hooks/use-agenda";
import { cn } from "@/lib/cn";
import { formatLongDate } from "@/lib/format";
import type { Appointment } from "@/mocks/types";
import { ChangeServiceModal } from "./change-service-modal";
import { DayTimeline, HourGutter, useNow } from "./day-timeline";

const RESCHEDULE_CONFLICT_MESSAGE =
  "No se pudo mover el turno: el empleado ya tiene otro turno en ese horario.";

function withTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

export function AgendaView() {
  const {
    week,
    selectedDay,
    selectedIndex,
    selectDay,
    appointments,
    appointmentsFor,
    isLoading,
    isError,
    isCurrentWeek,
    goToPreviousDay,
    goToNextDay,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    changeService,
    isChangingService,
    reschedule,
  } = useAgenda();
  const now = useNow();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  async function saveServiceChange(serviceId: string) {
    if (!selectedAppointment) return;
    await changeService({ id: selectedAppointment.id, serviceId });
    setSelectedAppointment(null);
  }

  async function handleReschedule(date: Date, appointment: Appointment, newStartTime: string) {
    try {
      await reschedule({ id: appointment.id, startAt: withTime(date, newStartTime).toISOString() });
    } catch {
      setRescheduleError(RESCHEDULE_CONFLICT_MESSAGE);
      setTimeout(() => setRescheduleError(null), 4000);
    }
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle={formatLongDate(selectedDay.date)}
        action={
          <div className="flex items-center gap-1">
            {/* Móvil: navegar día por día. */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={goToPreviousDay}
                aria-label="Día anterior"
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-200"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {!selectedDay.isToday ? (
                <button type="button" onClick={goToToday} className="px-1 text-xs font-semibold text-primary">
                  Hoy
                </button>
              ) : null}
              <button
                type="button"
                onClick={goToNextDay}
                aria-label="Día siguiente"
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-200"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            {/* Desktop: navegar semana por semana (la grilla ya muestra los 7 días). */}
            <div className="hidden items-center gap-1 md:flex">
              <button
                type="button"
                onClick={goToPreviousWeek}
                aria-label="Semana anterior"
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {!isCurrentWeek ? (
                <button type="button" onClick={goToToday} className="px-1 text-sm font-semibold text-primary">
                  Hoy
                </button>
              ) : null}
              <button
                type="button"
                onClick={goToNextWeek}
                aria-label="Semana siguiente"
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        }
      />

      {rescheduleError ? (
        <p className="mb-4 rounded-xl bg-secondary/10 px-4 py-3 text-sm text-secondary">
          {rescheduleError}
        </p>
      ) : null}

      {/* Móvil: tira semanal para elegir un día (mockup pág. 6). Desktop:
          se ve la semana completa en la grilla, no hace falta elegir. */}
      <div className="mb-5 flex justify-between gap-1 md:hidden">
        {week.map((d) => (
          <button
            key={d.index}
            type="button"
            onClick={() => selectDay(d.index)}
            aria-pressed={selectedIndex === d.index}
            className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-1.5"
          >
            <span className="text-xs text-neutral-400">{d.dayLabel}</span>
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-150",
                selectedIndex === d.index
                  ? "bg-primary text-white"
                  : d.isToday
                    ? "text-primary"
                    : "text-neutral-600",
              )}
            >
              {d.dayNumber}
            </span>
          </button>
        ))}
      </div>

      {/* Móvil: un solo día. */}
      <Card className="overflow-x-auto md:hidden">
        {isLoading ? (
          <p className="py-10 text-center text-neutral-400">Cargando agenda...</p>
        ) : isError ? (
          <p className="py-10 text-center text-secondary">No se pudo cargar la agenda.</p>
        ) : appointments.length === 0 ? (
          <p className="py-10 text-center text-neutral-400">Sin turnos para este día.</p>
        ) : (
          <div className="flex">
            <HourGutter />
            <DayTimeline
              date={selectedDay.date}
              appointments={appointments}
              now={now}
              showNowLine={selectedDay.isToday}
              onAppointmentClick={setSelectedAppointment}
              onAppointmentReschedule={(appointment, newStartTime) =>
                handleReschedule(selectedDay.date, appointment, newStartTime)
              }
            />
          </div>
        )}
      </Card>

      {/* Desktop: semana completa, estilo Google Calendar. */}
      <Card className="hidden overflow-x-auto p-0 md:block">
        <div className="flex min-w-[720px]">
          <div className="w-10 shrink-0 border-b border-neutral-100 py-3" />
          {week.map((d) => (
            <div
              key={d.index}
              className="flex flex-1 flex-col items-center gap-1 border-b border-l border-neutral-100 py-3"
            >
              <span className="text-xs text-neutral-400">{d.dayLabel}</span>
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  d.isToday ? "bg-primary text-white" : "text-neutral-700",
                )}
              >
                {d.dayNumber}
              </span>
            </div>
          ))}
        </div>
        {isLoading ? (
          <p className="py-10 text-center text-neutral-400">Cargando agenda...</p>
        ) : isError ? (
          <p className="py-10 text-center text-secondary">No se pudo cargar la agenda.</p>
        ) : (
          <div className="flex min-w-[720px] px-0 pb-4 pt-2">
            <HourGutter />
            {week.map((d) => (
              <div key={d.index} className="flex-1 border-l border-neutral-100">
                <DayTimeline
                  date={d.date}
                  appointments={appointmentsFor(d.index)}
                  now={now}
                  showNowLine={d.isToday}
                  onAppointmentClick={setSelectedAppointment}
                  onAppointmentReschedule={(appointment, newStartTime) =>
                    handleReschedule(d.date, appointment, newStartTime)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedAppointment ? (
        <ChangeServiceModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onSave={saveServiceChange}
          isSaving={isChangingService}
        />
      ) : null}
    </div>
  );
}
